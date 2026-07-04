# AI Image Upscaler ✨

An *open-source* web application for increasing image resolution (upscaling) up to 4x using **Real-ESRGAN** AI technology. This application is designed with an elegant, clean, and responsive **Apple Light Mode Glassmorphism** user interface (UI).

## 🚀 Key Features

### 1. AI Upscaler
- **AI Upscaling (2x & 4x)**: Uses the pretrained `RealESRGAN_x4plus` model to restore pixelated or blurry image details.
- **AI Strength Control**: An interactive slider to adjust AI intensity (0% to 100%), allowing for blending between the AI output and standard *bicubic resize* so that textures aren't overly aggressive on illustrations/cartoons.
- **Auto-Downscale Protection**: Images that are too large (>1024px) are automatically resized before entering the AI model to prevent *Out of Memory* (OOM) errors on GPUs with limited VRAM (e.g., 6GB).
- **Batch Processing**: Support for uploading and processing multiple images at once, complete with a download as ZIP feature.

### 2. Photo Enhancer (In Development 🚧)
- **Instant Sharpen & Deblur**: Instantly improve image sharpness and remove motion blur or out-of-focus effects using OpenCV image processing without heavy AI models.
- **Multiscale Unsharp Masking**: A smart sharpening algorithm that clarifies edges and fine details without destroying textures.
- **Iterative Deblurring**: A multi-pass deblurring process with Laplacian edge boost to restore lost focus.
- *Note: This feature is still in the experimental phase and the algorithms will continue to be refined.*

### 3. Modern UI/UX
- **Interactive UI**: Features a smooth *Before/After Comparison Slider* and a *drag-and-drop* file uploader.
- **Elegant Glass Theme**: A pearlescent white theme styled after Apple VisionOS/macOS with stunning *frosted glass* effects.

## 🛠️ Technologies Used
**Backend:**
- Python 3
- FastAPI & Uvicorn (REST API)
- OpenCV (`cv2`) & NumPy (Image Processing)
- PyTorch & Real-ESRGAN (AI Inference)

**Frontend:**
- HTML5, Vanilla CSS3 (Custom Glassmorphism Framework), Vanilla JavaScript
- Font: SF Pro Display (Apple System Font)

## 📦 Folder Structure
```
Project Restorer/
├── models/                  # Folder for the RealESRGAN_x4plus.pth model
├── backend/
│   ├── api.py               # FastAPI entry point
│   ├── requirements.txt     # Python dependencies
│   ├── static/uploads/      # Temporary storage for image input/output
│   └── src/
│       ├── pipeline.py      # AI Orchestrator (ImageUpscaler Class)
│       ├── upscale.py       # Real-ESRGAN inference & Blending logic
│       └── preprocess.py    # Validation & OOM prevention resize
└── frontend/
    ├── index.html           # UI Structure
    ├── style.css            # Apple Glassmorphism Styling
    └── script.js            # Client logic & API calls
```

## ⚙️ How to Run (Local Development)

### 1. Backend Setup
Ensure you have Python installed (Python 3.9+ recommended).
```bash
cd backend
pip install -r requirements.txt
```
*Note: Make sure the `RealESRGAN_x4plus.pth` model file is already in the `models/` folder.*

Run the FastAPI server:
```bash
uvicorn api:app --reload --port 8000
```
The backend will run at `http://localhost:8000`.

### 2. Frontend Setup
Open a new terminal, run a static HTTP server for the frontend:
```bash
cd frontend
python -m http.server 5500
```
The frontend will run at `http://localhost:5500`.

## 📜 License & Model Attribution

This web application project is licensed under the **MIT License** (see the `LICENSE` file). However, please note that this application (along with its extensions) uses third-party *pretrained* AI models:

**1. Real-ESRGAN** (Main Resolution Enhancer)
- **Creators**: [Xintao Wang et al. (Tencent ARC)](https://github.com/xinntao/Real-ESRGAN)
- **Model License**: [BSD 3-Clause License](https://github.com/xinntao/Real-ESRGAN/blob/master/LICENSE)
- **Download Model**: [RealESRGAN_x4plus.pth (67MB)](https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth)

**2. GFPGAN** (Face Restoration - *Optional/Extension*)
- **Creators**: [Tencent ARC](https://github.com/TencentARC/GFPGAN)
- **Model License**: [Apache License 2.0](https://github.com/TencentARC/GFPGAN/blob/master/LICENSE)
- **Download Model**: [GFPGANv1.4.pth (332MB)](https://github.com/TencentARC/GFPGAN/releases/download/v1.3.4/GFPGANv1.4.pth)

*This project does not claim ownership over the model architecture or weights of either Real-ESRGAN or GFPGAN. This application serves purely as a wrapper interface to facilitate the use of these models locally.*

Full texts of the respective licenses are available in the `THIRD_PARTY_LICENSES/` folder.
