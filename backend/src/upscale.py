import os
import math
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


def upscale_image(upsampler, img, outscale=4, strength=100, progress_callback=None):
    """
    Upscale gambar.
    - outscale: 2 atau 4
    - strength: 0-100, seberapa kuat enhancement AI.
      0   = murni bicubic (no AI),
      100 = full Real-ESRGAN.
      Di antara itu = blend keduanya.
    - progress_callback(pct: int): dipanggil per-tile dengan persentase 0-95.
    """
    tile = _adaptive_tile_size(img)
    upsampler.tile_size = tile

    # Hitung total tile untuk progress yang akurat
    h, w = img.shape[:2]
    tiles_h = math.ceil(h / tile)
    tiles_w = math.ceil(w / tile)
    total_tiles = max(1, tiles_h * tiles_w)

    # Wrap model untuk intercept setiap tile inference
    if progress_callback:
        original_model = upsampler.model
        tile_counter = [0]

        class TileProgressWrapper:
            def __call__(self, *args, **kwargs):
                result = original_model(*args, **kwargs)
                tile_counter[0] += 1
                pct = min(95, int(tile_counter[0] / total_tiles * 95))
                try:
                    progress_callback(pct)
                except Exception:
                    pass
                return result

            def __getattr__(self, name):
                return getattr(original_model, name)

        upsampler.model = TileProgressWrapper()

    try:
        # Full AI upscale
        ai_output, _ = upsampler.enhance(img, outscale=outscale)
    finally:
        # Kembalikan model asli
        if progress_callback:
            upsampler.model = original_model

    # Jika strength < 100, blend dengan simple bicubic resize
    if strength < 100:
        h_out, w_out = ai_output.shape[:2]
        simple_output = cv2.resize(img, (w_out, h_out), interpolation=cv2.INTER_CUBIC)

        alpha = strength / 100.0
        blended = cv2.addWeighted(ai_output, alpha, simple_output, 1.0 - alpha, 0)
        return blended

    return ai_output