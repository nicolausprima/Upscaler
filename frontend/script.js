const API_URL = "http://localhost:8000";

// ===== DOM Elements =====
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const uploadPrompt = document.getElementById("uploadPrompt");
const previewImg = document.getElementById("previewImg");
const processBtn = document.getElementById("processBtn");
const scaleSelector = document.getElementById("scaleSelector");
const strengthSlider = document.getElementById("strengthSlider");
const strengthValue = document.getElementById("strengthValue");
const loadingSection = document.getElementById("loadingSection");
const resultSection = document.getElementById("resultSection");
const metaRow = document.getElementById("metaRow");
const beforeImg = document.getElementById("beforeImg");
const afterImg = document.getElementById("afterImg");
const comparisonContainer = document.getElementById("comparisonContainer");
const comparisonAfter = document.getElementById("comparisonAfter");
const comparisonSliderLine = document.getElementById("comparisonSliderLine");
const comparisonSliderHandle = document.getElementById("comparisonSliderHandle");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");

let selectedFile = null;
let selectedScale = 4;
let selectedStrength = 80;

// ===== Controls =====
scaleSelector.addEventListener("click", (e) => {
    const btn = e.target.closest(".segment-btn");
    if (!btn) return;

    scaleSelector.querySelectorAll(".segment-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedScale = parseInt(btn.dataset.scale, 10);
    
    const indicator = scaleSelector.querySelector(".segment-indicator");
    if (indicator) {
        indicator.style.transform = selectedScale === 4 ? "translateX(100%)" : "translateX(0)";
    }
});

strengthSlider.addEventListener("input", (e) => {
    selectedStrength = parseInt(e.target.value, 10);
    strengthValue.textContent = `${selectedStrength}%`;
    
    // Dynamic smooth background fill
    const val = e.target.value;
    e.target.style.background = `linear-gradient(to right, #1d1d1f ${val}%, rgba(0, 0, 0, 0.08) ${val}%)`;
});

// Initialize slider fill on load
strengthSlider.style.background = `linear-gradient(to right, #1d1d1f ${strengthSlider.value}%, rgba(0, 0, 0, 0.08) ${strengthSlider.value}%)`;

// ===== File Upload =====
dropZone.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files[0]);
});

dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragging");
});

dropZone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragging");
});

dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragging");
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
});

// ===== Reset Button =====
resetBtn.addEventListener("click", () => {
    selectedFile = null;
    fileInput.value = "";
    previewImg.src = "";
    previewImg.style.display = "none";
    uploadPrompt.style.display = "block";
    dropZone.classList.remove("has-image");
    processBtn.disabled = true;
    resultSection.classList.remove("visible");
});

function handleFile(file) {
    if (!file.type.startsWith("image/")) {
        alert("Harap unggah file gambar yang valid.");
        return;
    }

    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImg.src = e.target.result;
        previewImg.style.display = "block";
        uploadPrompt.style.display = "none";
        dropZone.classList.add("has-image");
    };
    reader.readAsDataURL(file);
    processBtn.disabled = false;
    resultSection.classList.remove("visible");
}

// ===== Processing =====
processBtn.addEventListener("click", async () => {
    if (!selectedFile) return;

    loadingSection.classList.add("visible");
    resultSection.classList.remove("visible");
    processBtn.disabled = true;
    processBtn.textContent = "Memproses...";

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
        const response = await fetch(
            `${API_URL}/upscale?scale=${selectedScale}&strength=${selectedStrength}`,
            { method: "POST", body: formData }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const msg = errorData?.detail || "Gagal memproses gambar.";
            throw new Error(msg);
        }

        const data = await response.json();
        const resultUrl = `${API_URL}${data.result_url}`;

        renderMeta(data);

        beforeImg.src = previewImg.src;
        
        afterImg.onload = () => {
            resetSlider();
            resultSection.classList.add("visible");
            setTimeout(() => {
                resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        };
        
        afterImg.onerror = () => {
            alert("Gagal memuat hasil gambar.");
        };
        
        afterImg.src = resultUrl;
        downloadBtn.href = resultUrl;

    } catch (err) {
        alert("Terjadi kesalahan: " + err.message);
    } finally {
        loadingSection.classList.remove("visible");
        processBtn.disabled = false;
        processBtn.textContent = "Tingkatkan Resolusi";
    }
});

function renderMeta(data) {
    const metaData = [
        { label: "Resolusi Input", value: `${data.input.width}×${data.input.height}` },
        { label: "Resolusi Output", value: `${data.output.width}×${data.output.height}` },
        { label: "Ukuran File", value: `${data.output_size_mb} MB` },
        { label: "Waktu Proses", value: `${data.processing_time_seconds}s` }
    ];

    metaRow.innerHTML = metaData
        .map(item => `
            <div class="meta-item">
                <div class="meta-label">${item.label}</div>
                <div class="meta-value">${item.value}</div>
            </div>
        `)
        .join("");
}

// ===== Comparison Slider =====
let isDragging = false;

function setSliderPosition(clientX) {
    const rect = comparisonContainer.getBoundingClientRect();
    let ratio = (clientX - rect.left) / rect.width;
    ratio = Math.max(0, Math.min(1, ratio));
    const pct = ratio * 100;

    comparisonAfter.style.clipPath = `inset(0 0 0 ${pct}%)`;
    comparisonSliderLine.style.left = `${pct}%`;
    comparisonSliderHandle.style.left = `${pct}%`;
}

function resetSlider() {
    comparisonAfter.style.clipPath = "inset(0 0 0 50%)";
    comparisonSliderLine.style.left = "50%";
    comparisonSliderHandle.style.left = "50%";
}

// Mouse
comparisonContainer.addEventListener("mousedown", (e) => {
    isDragging = true;
    setSliderPosition(e.clientX);
    e.preventDefault();
});

document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    setSliderPosition(e.clientX);
    e.preventDefault();
});

document.addEventListener("mouseup", () => {
    isDragging = false;
});

// Touch
comparisonContainer.addEventListener("touchstart", (e) => {
    isDragging = true;
    setSliderPosition(e.touches[0].clientX);
}, { passive: true });

document.addEventListener("touchmove", (e) => {
    if (!isDragging) return;
    setSliderPosition(e.touches[0].clientX);
}, { passive: true });

document.addEventListener("touchend", () => {
    isDragging = false;
});