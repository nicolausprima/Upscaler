import os
import uuid
import base64
import asyncio
import zipfile
import io
from typing import List
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, UploadFile, File, Query, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

from src.pipeline import ImageUpscaler

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
UPLOAD_DIR = os.path.join(PROJECT_ROOT, 'static', 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="Image Upscaler API")

# Izinkan frontend (beda origin/port) untuk akses API ini
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supaya hasil gambar bisa diakses langsung lewat URL
app.mount("/static", StaticFiles(directory=os.path.join(PROJECT_ROOT, 'static')), name="static")

# Load model SEKALI saat server pertama kali nyala
print("Menyiapkan model, mohon tunggu...")
upscaler = ImageUpscaler(model_type="general")
print("Server siap menerima request.")

# Thread pool untuk proses berat (agar tidak block event loop)
executor = ThreadPoolExecutor(max_workers=1)


@app.get("/")
def root():
    return {"status": "Image Upscaler API is running"}


@app.get("/download/{filename}")
async def download_image(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path=file_path, filename=filename, media_type='application/octet-stream')


class ZipRequest(BaseModel):
    filenames: List[str]


@app.post("/zip")
async def create_zip(req: ZipRequest):
    """Buat ZIP dari daftar file hasil upscale."""
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        for filename in req.filenames:
            file_path = os.path.join(UPLOAD_DIR, filename)
            if os.path.exists(file_path):
                zf.write(file_path, filename)
    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type='application/zip',
        headers={"Content-Disposition": "attachment; filename=restored_photos.zip"}
    )


@app.websocket("/ws/upscale")
async def ws_upscale(websocket: WebSocket):
    """
    WebSocket endpoint untuk upscale dengan progress real-time.
    
    Client mengirim JSON:
    {
        "filename": "foto.jpg",
        "file_b64": "<base64 encoded image>",
        "scale": 4,
        "strength": 80
    }
    
    Server mengirim:
    {"type": "progress", "pct": 45}
    {"type": "done", "result_url": "...", "output_size_mb": ..., ...}
    {"type": "error", "message": "..."}
    """
    await websocket.accept()
    loop = asyncio.get_event_loop()

    try:
        # Terima data dari client
        data = await websocket.receive_json()
        filename = data.get("filename", "image.jpg")
        file_b64 = data.get("file_b64", "")
        scale = int(data.get("scale", 4))
        strength = int(data.get("strength", 80))

        # Decode dan simpan file input
        ext = os.path.splitext(filename)[1] or ".jpg"
        input_filename = f"{uuid.uuid4().hex}{ext}"
        input_path = os.path.join(UPLOAD_DIR, input_filename)

        file_bytes = base64.b64decode(file_b64)
        with open(input_path, "wb") as f:
            f.write(file_bytes)

        output_filename = f"upscaled_{input_filename}"
        output_path = os.path.join(UPLOAD_DIR, output_filename)

        # Progress callback yang aman untuk async context
        def progress_callback(pct: int):
            future = asyncio.run_coroutine_threadsafe(
                websocket.send_json({"type": "progress", "pct": pct}),
                loop
            )
            try:
                future.result(timeout=2)
            except Exception:
                pass

        # Jalankan upscale di thread terpisah agar tidak block event loop
        result = await loop.run_in_executor(
            executor,
            lambda: upscaler.upscale(
                image_path=input_path,
                scale=scale,
                strength=strength,
                output_path=output_path,
                progress_callback=progress_callback,
            )
        )

        # Kirim hasil ke client
        await websocket.send_json({
            "type": "done",
            "result_url": f"/static/uploads/{output_filename}",
            "output_filename": output_filename,
            "input": result["input"],
            "output": result["output"],
            "output_size_mb": result["output_size_mb"],
            "scale": result["scale"],
            "processing_time_seconds": result["processing_time_seconds"],
            "detected_faces": result.get("detected_faces", []),
        })

    except WebSocketDisconnect:
        print("Client WebSocket terputus.")
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass


@app.post("/upscale")
async def upscale_photo(
    file: UploadFile = File(...),
    scale: int = Query(4, ge=2, le=4, description="Skala upscale: 2 atau 4"),
    strength: int = Query(80, ge=0, le=100, description="Kekuatan AI enhancement: 0 (bicubic murni) - 100 (full AI)"),
):
    # Simpan file upload sementara dengan nama unik
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    input_filename = f"{uuid.uuid4().hex}{ext}"
    input_path = os.path.join(UPLOAD_DIR, input_filename)

    with open(input_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Proses upscale
    output_filename = f"upscaled_{input_filename}"
    output_path = os.path.join(UPLOAD_DIR, output_filename)

    result = upscaler.upscale(
        image_path=input_path,
        scale=scale,
        strength=strength,
        output_path=output_path,
    )

    return {
        "result_url": f"/static/uploads/{output_filename}",
        "input": result["input"],
        "output": result["output"],
        "output_size_mb": result["output_size_mb"],
        "scale": result["scale"],
        "processing_time_seconds": result["processing_time_seconds"],
        "detected_faces": result.get("detected_faces", []),
    }