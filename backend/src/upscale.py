import os
import cv2
import numpy as np
from realesrgan import RealESRGANer
from basicsr.archs.rrdbnet_arch import RRDBNet

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

MODELS = {
    "general": {
        "path": os.path.join(BASE_DIR, 'models', 'RealESRGAN_x4plus.pth'),
        "num_block": 23,
        "num_feat": 64,
        "num_grow_ch": 32,
        "scale": 4,
    },
    "anime": {
        "path": os.path.join(BASE_DIR, 'models', 'RealESRGAN_x4plus_anime_6B.pth'),
        "num_block": 6,
        "num_feat": 64,
        "num_grow_ch": 32,
        "scale": 4,
    },
}


def _adaptive_tile_size(img):
    """Pilih tile size berdasarkan resolusi input supaya tidak OOM."""
    h, w = img.shape[:2]
    pixels = h * w
    if pixels > 800_000:
        return 128
    elif pixels > 400_000:
        return 192
    else:
        return 256


def load_upscaler(model_type="general"):
    """Load model Real-ESRGAN. model_type: 'general' atau 'anime'."""
    cfg = MODELS.get(model_type)
    if cfg is None:
        raise ValueError(f"Model type '{model_type}' tidak dikenal. Pilih 'general' atau 'anime'.")

    if not os.path.exists(cfg["path"]):
        raise FileNotFoundError(
            f"Model file tidak ditemukan: {cfg['path']}. "
            f"Jalankan download_models.py dulu."
        )

    model = RRDBNet(
        num_in_ch=3, num_out_ch=3,
        num_feat=cfg["num_feat"],
        num_block=cfg["num_block"],
        num_grow_ch=cfg["num_grow_ch"],
        scale=cfg["scale"],
    )
    upsampler = RealESRGANer(
        scale=cfg["scale"],
        model_path=cfg["path"],
        model=model,
        tile=200,
        tile_pad=10,
        pre_pad=0,
        half=True,
    )
    return upsampler


def upscale_image(upsampler, img, outscale=4, strength=100):
    """
    Upscale gambar.
    - outscale: 2 atau 4
    - strength: 0-100, seberapa kuat enhancement AI.
      0   = murni bicubic (no AI), 
      100 = full Real-ESRGAN.
      Di antara itu = blend keduanya.
    """
    tile = _adaptive_tile_size(img)
    upsampler.tile_size = tile

    # Full AI upscale
    ai_output, _ = upsampler.enhance(img, outscale=outscale)

    # Jika strength < 100, blend dengan simple bicubic resize
    if strength < 100:
        h_out, w_out = ai_output.shape[:2]
        simple_output = cv2.resize(img, (w_out, h_out), interpolation=cv2.INTER_CUBIC)

        alpha = strength / 100.0
        blended = cv2.addWeighted(ai_output, alpha, simple_output, 1.0 - alpha, 0)
        return blended

    return ai_output