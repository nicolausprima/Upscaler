import os
import uuid
from fastapi import FastAPI, UploadFile, File, Query
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

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


@app.get("/")
def root():
    return {"status": "Image Upscaler API is running"}


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
    }