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

    def upscale(self, image_path, scale=4, strength=100, output_path='result.jpg'):
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
        img = upscale_image(self.upsampler, img, outscale=scale, strength=strength)
        output_info = get_image_info(img)

        # Save
        cv2.imwrite(output_path, img)
        elapsed = round(time.time() - start_time, 2)
        output_size_mb = get_file_size_mb(output_path)

        print(f"Selesai dalam {elapsed}s. Hasil: {output_info['width']}x{output_info['height']}")

        return {
            "output_path": output_path,
            "input": input_info,
            "output": output_info,
            "output_size_mb": output_size_mb,
            "scale": scale,
            "model_type": self.model_type,
            "processing_time_seconds": elapsed,
        }