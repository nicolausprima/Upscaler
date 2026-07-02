# AI Image Upscaler ✨

Sebuah aplikasi web *open-source* untuk meningkatkan resolusi gambar (upscaling) hingga 4x lipat menggunakan teknologi AI **Real-ESRGAN**. Aplikasi ini dirancang dengan antarmuka pengguna (UI) bergaya **Apple Light Mode Glassmorphism** yang elegan, bersih, dan responsif.

## 🚀 Fitur Utama
- **AI Upscaling (2x & 4x)**: Menggunakan model pretrained `RealESRGAN_x4plus` untuk mengembalikan detail gambar yang pecah atau buram.
- **AI Strength Control**: Slider interaktif untuk mengatur intensitas AI (0% hingga 100%), memungkinkan pencampuran (*blending*) antara hasil AI dengan *bicubic resize* biasa agar tekstur tidak terlalu agresif pada gambar ilustrasi/kartun.
- **Auto-Downscale Protection**: Gambar yang terlalu besar (>1024px) akan otomatis di-resize sebelum masuk ke model AI untuk mencegah *Out of Memory* (OOM) pada GPU dengan VRAM terbatas (misal: 6GB).
- **Interactive UI**: Dilengkapi fitur *Before/After Comparison Slider* yang mulus dan *drag-and-drop* file uploader.
- **Elegant Glass Theme**: Tema putih mutiara (*pearlescent white*) bergaya Apple VisionOS/macOS dengan efek *frosted glass* yang memukau.

## 🛠️ Teknologi yang Digunakan
**Backend:**
- Python 3
- FastAPI & Uvicorn (REST API)
- OpenCV (`cv2`) & NumPy (Image Processing)
- PyTorch & Real-ESRGAN (AI Inference)

**Frontend:**
- HTML5, Vanilla CSS3 (Custom Glassmorphism Framework), Vanilla JavaScript
- Font: SF Pro Display (Apple System Font)

## 📦 Struktur Folder
```
Project Restorer/
├── backend/
│   ├── api.py               # Entry point FastAPI
│   ├── requirements.txt     # Dependensi Python
│   ├── weights/             # Folder untuk model RealESRGAN_x4plus.pth
│   ├── static/uploads/      # Penyimpanan sementara untuk input/output gambar
│   └── src/
│       ├── pipeline.py      # Orkestrator AI (Class ImageUpscaler)
│       ├── upscale.py       # Logika inferensi Real-ESRGAN & Blending
│       └── preprocess.py    # Validasi & Resize pencegah OOM
└── frontend/
    ├── index.html           # Struktur UI
    ├── style.css            # Styling Apple Glassmorphism
    └── script.js            # Logika klien & pemanggilan API
```

## ⚙️ Cara Menjalankan (Local Development)

### 1. Persiapan Backend
Pastikan Anda sudah menginstal Python (disarankan Python 3.9+).
```bash
cd backend
pip install -r requirements.txt
```
*Catatan: Pastikan file model `RealESRGAN_x4plus.pth` sudah berada di dalam folder `backend/weights/`.*

Jalankan server FastAPI:
```bash
uvicorn api:app --reload --port 8000
```
Backend akan berjalan di `http://localhost:8000`.

### 2. Persiapan Frontend
Buka terminal baru, jalankan server HTTP statis untuk frontend:
```bash
cd frontend
python -m http.server 5500
```
Frontend akan berjalan di `http://localhost:5500`.

## 📜 Lisensi & Atribusi Model

Proyek aplikasi web ini dilisensikan di bawah **MIT License** (lihat file `LICENSE`). Namun, harap diperhatikan bahwa aplikasi ini (beserta ekstensinya) menggunakan model AI *pretrained* pihak ketiga:

**1. Real-ESRGAN** (Peningkat Resolusi Utama)
- **Pembuat**: [Xintao Wang dkk. (Tencent ARC)](https://github.com/xinntao/Real-ESRGAN)
- **Lisensi Model**: [BSD 3-Clause License](https://github.com/xinntao/Real-ESRGAN/blob/master/LICENSE)
- **Download Model**: [RealESRGAN_x4plus.pth (67MB)](https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth)

**2. GFPGAN** (Restorasi Wajah - *Opsional/Ekstensi*)
- **Pembuat**: [Tencent ARC](https://github.com/TencentARC/GFPGAN)
- **Lisensi Model**: [Apache License 2.0](https://github.com/TencentARC/GFPGAN/blob/master/LICENSE)
- **Download Model**: [GFPGANv1.4.pth (332MB)](https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.4.pth)

*Proyek ini tidak mengklaim kepemilikan atas arsitektur model maupun bobot (weights) dari Real-ESRGAN ataupun GFPGAN. Aplikasi ini murni berfungsi sebagai antarmuka (wrapper) untuk mempermudah penggunaan model tersebut secara lokal.*
