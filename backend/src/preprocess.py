import cv2
import os

MAX_DIMENSION = 1024  # batas input supaya output 4x tidak OOM di GPU 6GB


def load_and_validate(image_path):
    """Load gambar dan validasi apakah berhasil dibaca."""
    img = cv2.imread(image_path, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError(f"Gagal membaca gambar: {image_path}")
    return img


def resize_if_too_large(img, max_dim=MAX_DIMENSION):
    """
    Kalau gambar input terlalu besar, kecilkan dulu supaya proses
    upscale 4x tidak membuat GPU kehabisan memori (OOM).
    """
    h, w = img.shape[:2]
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        new_w, new_h = int(w * scale), int(h * scale)
        img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
        print(f"Gambar diresize dari {w}x{h} ke {new_w}x{new_h}")
    return img


def get_image_info(img):
    """Return metadata tentang gambar (dimensi, dll)."""
    h, w = img.shape[:2]
    channels = img.shape[2] if len(img.shape) == 3 else 1
    return {
        "width": w,
        "height": h,
        "channels": channels,
        "megapixels": round((w * h) / 1_000_000, 2),
    }


def get_file_size_mb(file_path):
    """Return ukuran file dalam MB."""
    if os.path.exists(file_path):
        return round(os.path.getsize(file_path) / (1024 * 1024), 2)
    return 0