import os
import time
import cv2
from src.preprocess import load_and_validate, resize_if_too_large, get_image_info, get_file_size_mb
from src.upscale import load_upscaler, upscale_image


class ImageUpscaler:
    """
    Kelas utama untuk image upscaling.
    Model di-load sekali saat inisialisasi, supaya request berikutnya cepat.
    """

    def __init__(self, model_type="general"):
        print(f"Loading model Real-ESRGAN ({model_type})...")
        self.model_type = model_type
        self.upsampler = load_upscaler(model_type=model_type)
        print("Model siap.")

    def upscale(self, image_path, scale=4, strength=100, output_path='result.jpg', progress_callback=None):
        """
        Alur:
        1. Load & validasi gambar
        2. Resize kalau kegedean (supaya output tidak OOM)
        3. Upscale resolusi pakai Real-ESRGAN (dengan strength blending)
        4. Simpan hasil
        5. Return metadata
        """
        start_time = time.time()

        # Load & preprocess
        img = load_and_validate(image_path)
        input_info = get_image_info(img)
        img = resize_if_too_large(img)

        # Upscale
        print(f"Upscaling {scale}x, strength={strength}%...")
        img = upscale_image(self.upsampler, img, outscale=scale, strength=strength, progress_callback=progress_callback)
        output_info = get_image_info(img)

        # Save
        cv2.imwrite(output_path, img)
        elapsed = round(time.time() - start_time, 2)
        output_size_mb = get_file_size_mb(output_path)

        # ====== DETEKSI WAJAH ======
        detected_faces = []
        try:
            import base64
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            cascade_path = os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml')
            face_cascade = cv2.CascadeClassifier(cascade_path)
            
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))
            
            h_img, w_img = img.shape[:2]
            for i, (x, y, w, h) in enumerate(faces):
                cx = x + w / 2
                cy = y + h / 2
                x_pct = round((cx / w_img) * 100, 2)
                y_pct = round((cy / h_img) * 100, 2)
                
                # Crop area wajah (dengan sedikit padding) untuk thumbnail
                pad_x = int(w * 0.3)
                pad_y = int(h * 0.3)
                x1 = max(0, x - pad_x)
                y1 = max(0, y - pad_y)
                x2 = min(w_img, x + w + pad_x)
                y2 = min(h_img, y + h + pad_y)
                
                face_crop = img[y1:y2, x1:x2]

                # Buat square crop agar gambar tidak stretch di thumbnail
                h_c, w_c = face_crop.shape[:2]
                side = min(h_c, w_c)
                cx_c, cy_c = w_c // 2, h_c // 2
                sq = face_crop[
                    max(0, cy_c - side // 2):cy_c + side // 2,
                    max(0, cx_c - side // 2):cx_c + side // 2
                ]
                face_crop_sq = cv2.resize(sq, (128, 128))
                
                # Encode base64
                _, buffer = cv2.imencode('.jpg', face_crop_sq, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
                b64_str = base64.b64encode(buffer).decode('utf-8')
                
                detected_faces.append({
                    "x_pct": x_pct,
                    "y_pct": y_pct,
                    "thumbnail": f"data:image/jpeg;base64,{b64_str}"
                })
        except Exception as e:
            print("Error saat deteksi wajah:", e)
        # ============================

        print(f"Selesai dalam {elapsed}s. Hasil: {output_info['width']}x{output_info['height']}")

        return {
            "output_path": output_path,
            "input": input_info,
            "output": output_info,
            "output_size_mb": output_size_mb,
            "scale": scale,
            "model_type": self.model_type,
            "processing_time_seconds": elapsed,
            "detected_faces": detected_faces,
        }