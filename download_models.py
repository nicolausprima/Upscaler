import urllib.request
import os

MODELS = {
    # Model utama — wajib
    "RealESRGAN_x4plus.pth": {
        "url": "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth",
        "required": True,
    },
    # Model anime — opsional (uncomment jika mau dipakai)
    # "RealESRGAN_x4plus_anime_6B.pth": {
    #     "url": "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth",
    #     "required": False,
    # },
    # Model GFPGAN — tidak dipakai lagi di pipeline upscaler, tapi boleh disimpan
    # "GFPGANv1.4.pth": {
    #     "url": "https://github.com/TencentARC/GFPGAN/releases/download/v1.3.4/GFPGANv1.4.pth",
    #     "required": False,
    # },
}

os.makedirs("models", exist_ok=True)

opener = urllib.request.build_opener()
opener.addheaders = [('User-Agent', 'Mozilla/5.0')]
urllib.request.install_opener(opener)

for filename, info in MODELS.items():
    filepath = f"models/{filename}"
    if os.path.exists(filepath):
        print(f"{filename} sudah ada, skip.")
        continue
    tag = "[WAJIB]" if info["required"] else "[OPSIONAL]"
    print(f"{tag} Downloading {filename}...")
    urllib.request.urlretrieve(info["url"], filepath)
    print(f"{filename} selesai ({os.path.getsize(filepath) / 1e6:.1f} MB)")

print("\nSemua model siap.")