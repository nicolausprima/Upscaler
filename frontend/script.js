const API_URL  = "http://127.0.0.1:8000";
const WS_URL   = "ws://127.0.0.1:8000/ws/upscale";

// ===== DOM Elements =====
const dropZone            = document.getElementById("dropZone");
const fileInput           = document.getElementById("fileInput");
const uploadPrompt        = document.getElementById("uploadPrompt");
const previewImg          = document.getElementById("previewImg");
const processBtn          = document.getElementById("processBtn");
const scaleSelector       = document.getElementById("scaleSelector");
const strengthSlider      = document.getElementById("strengthSlider");
const strengthValue       = document.getElementById("strengthValue");
const loadingSection      = document.getElementById("loadingSection");
const loadingText         = document.getElementById("loadingText");
const resultSection       = document.getElementById("resultSection");
const metaRow             = document.getElementById("metaRow");
const beforeImg           = document.getElementById("beforeImg");
const afterImg            = document.getElementById("afterImg");
const comparisonContainer = document.getElementById("comparisonContainer");
const comparisonAfter     = document.getElementById("comparisonAfter");
const comparisonSliderLine   = document.getElementById("comparisonSliderLine");
const comparisonSliderHandle = document.getElementById("comparisonSliderHandle");
const downloadBtn         = document.getElementById("downloadBtn");
const resetBtn            = document.getElementById("resetBtn");
const zoomLayer           = document.getElementById("zoomLayer");
const featureHighlights   = document.getElementById("featureHighlights");
const zoomResetBtn        = document.getElementById("zoomResetBtn");

// Batch
const batchSection    = document.getElementById("batchSection");
const batchQueue      = document.getElementById("batchQueue");
const batchCounter    = document.getElementById("batchCounter");
const downloadZipBtn  = document.getElementById("downloadZipBtn");

let selectedFiles    = [];   // Array of File objects (from multi-select)
let selectedFile     = null; // Single file (for single-mode compat)
let selectedScale    = 4;
let selectedStrength = 80;
let batchResults     = [];   // Collected output filenames for ZIP

// ===== Controls =====
scaleSelector.addEventListener("click", (e) => {
    const btn = e.target.closest(".segment-btn");
    if (!btn) return;
    scaleSelector.querySelectorAll(".segment-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedScale = parseInt(btn.dataset.scale, 10);
    const indicator = scaleSelector.querySelector(".segment-indicator");
    if (indicator) indicator.style.transform = selectedScale === 4 ? "translateX(100%)" : "translateX(0)";
});

strengthSlider.addEventListener("input", (e) => {
    selectedStrength = parseInt(e.target.value, 10);
    strengthValue.textContent = `${selectedStrength}%`;
    const pct = (selectedStrength / 100) * 100;
    e.target.style.background = `linear-gradient(to right, var(--accent) ${pct}%, rgba(0,0,0,0.08) ${pct}%)`;
});

// ===== File Selection =====
dropZone.addEventListener("click", (e) => {
    if (e.target !== previewImg) fileInput.click();
});

dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragging");
});

dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragging"));

dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragging");
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length > 0) handleFiles(files);
});

fileInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) handleFiles(files);
});

function handleFiles(files) {
    selectedFiles = files;
    const multiGrid = document.getElementById("multiPreviewGrid");

    if (files.length === 1) {
        // Single mode: show preview as before
        selectedFile = files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
            previewImg.src = ev.target.result;
            previewImg.style.display = "block";
            uploadPrompt.style.display = "none";
            multiGrid.style.display = "none";
            dropZone.classList.add("has-image");
            dropZone.classList.remove("has-multi");
            resetBtn.style.display = "flex";
            processBtn.disabled = false;
            processBtn.textContent = "Tingkatkan Resolusi";
        };
        reader.readAsDataURL(files[0]);
    } else {
        // Batch mode: show file count and grid
        previewImg.style.display = "none";
        uploadPrompt.style.display = "none"; // Hide standard prompt
        multiGrid.style.display = "grid";
        multiGrid.innerHTML = ""; // Clear existing

        const maxThumbs = 8;
        const toShow = files.slice(0, maxThumbs);
        
        toShow.forEach((f) => {
            const wrap = document.createElement("div");
            wrap.className = "multi-thumb-wrap";
            const img = document.createElement("img");
            
            const reader = new FileReader();
            reader.onload = (ev) => {
                img.src = ev.target.result;
            };
            reader.readAsDataURL(f);
            
            wrap.appendChild(img);
            multiGrid.appendChild(wrap);
        });

        if (files.length > maxThumbs) {
            const wrap = document.createElement("div");
            wrap.className = "multi-thumb-wrap";
            const overflow = document.createElement("div");
            overflow.className = "multi-thumb-overflow";
            overflow.textContent = `+${files.length - maxThumbs}`;
            wrap.appendChild(overflow);
            multiGrid.appendChild(wrap);
        }

        // Add a small label below grid
        const label = document.createElement("div");
        label.className = "multi-file-label";
        label.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            ${files.length} foto dipilih
        `;
        multiGrid.appendChild(label);
        // Force the label to span full width of the grid
        label.style.gridColumn = "1 / -1";
        label.style.marginTop = "16px";

        dropZone.classList.add("has-image");
        dropZone.classList.add("has-multi");
        resetBtn.style.display = "flex";
        processBtn.disabled = false;
        processBtn.textContent = `Proses ${files.length} Foto`;
    }
}

// ===== Reset =====
resetBtn.addEventListener("click", () => {
    selectedFile = null;
    selectedFiles = [];
    batchResults = [];
    previewImg.src = "";
    previewImg.style.display = "none";
    
    const multiGrid = document.getElementById("multiPreviewGrid");
    if(multiGrid) {
        multiGrid.style.display = "none";
        multiGrid.innerHTML = "";
    }
    
    uploadPrompt.style.display = "flex";
    uploadPrompt.querySelector(".upload-text").textContent = "Pilih atau letakkan gambar";
    uploadPrompt.querySelector(".upload-hint").textContent = "Format: JPG, PNG, WEBP \u2022 Pilih banyak sekaligus";
    dropZone.classList.remove("has-image");
    dropZone.classList.remove("has-multi");
    resetBtn.style.display = "none";
    processBtn.disabled = true;
    processBtn.textContent = "Tingkatkan Resolusi";
    fileInput.value = "";
    loadingSection.classList.remove("visible");
    resultSection.classList.remove("visible");
    batchSection.style.display = "none";
    batchQueue.innerHTML = "";
    downloadZipBtn.style.display = "none";
    resetSlider();
});

// ===== Helper: file → base64 =====
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ===== Process via WebSocket =====
function processFileWS(file) {
    return new Promise(async (resolve, reject) => {
        const ws = new WebSocket(WS_URL);

        ws.onerror = () => reject(new Error("WebSocket connection failed"));

        ws.onopen = async () => {
            const b64 = await fileToBase64(file);
            ws.send(JSON.stringify({
                filename: file.name,
                file_b64: b64,
                scale: selectedScale,
                strength: selectedStrength
            }));
        };

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === "progress") {
                resolve({ type: "progress", pct: msg.pct, ws });
                // Don't close — keep streaming
            } else if (msg.type === "done") {
                ws.close();
                resolve({ type: "done", data: msg });
            } else if (msg.type === "error") {
                ws.close();
                reject(new Error(msg.message));
            }
        };
    });
}

// ===== Process via WebSocket (streaming, with callbacks) =====
function processFileWithProgress(file, onProgress, onDone, onError) {
    const ws = new WebSocket(WS_URL);

    ws.onerror = () => onError(new Error("WebSocket connection failed"));

    ws.onopen = async () => {
        try {
            const b64 = await fileToBase64(file);
            ws.send(JSON.stringify({
                filename: file.name,
                file_b64: b64,
                scale: selectedScale,
                strength: selectedStrength
            }));
        } catch (e) {
            onError(e);
        }
    };

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "progress") {
            onProgress(msg.pct);
        } else if (msg.type === "done") {
            ws.close();
            onDone(msg);
        } else if (msg.type === "error") {
            ws.close();
            onError(new Error(msg.message));
        }
    };

    return ws;
}

// ===== Processing =====
processBtn.addEventListener("click", async () => {
    if (selectedFiles.length === 0) return;

    if (selectedFiles.length === 1) {
        // ===== SINGLE MODE (with WebSocket real progress) =====
        loadingSection.classList.add("visible");
        resultSection.classList.remove("visible");
        processBtn.disabled = true;
        processBtn.textContent = "Memproses...";

        const progressBar = document.getElementById("progressBar");
        progressBar.style.width = "0%";
        if (loadingText) loadingText.textContent = "Memproses gambar...";

        processFileWithProgress(
            selectedFiles[0],
            (pct) => {
                progressBar.style.width = `${pct}%`;
            },
            (data) => {
                progressBar.style.width = "100%";
                const resultUrl = `${API_URL}${data.result_url}`;

                renderMeta(data);
                beforeImg.src = previewImg.src;

                afterImg.onload = () => {
                    resetSlider();
                    resultSection.classList.add("visible");
                    setTimeout(() => resultSection.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
                };
                afterImg.src = resultUrl;

                const filename = data.result_url.split("/").pop();
                downloadBtn.href = `${API_URL}/download/${filename}`;

                setTimeout(() => {
                    loadingSection.classList.remove("visible");
                    processBtn.disabled = false;
                    processBtn.textContent = "Tingkatkan Resolusi";
                }, 500);
            },
            (err) => {
                alert("Terjadi kesalahan: " + err.message);
                loadingSection.classList.remove("visible");
                processBtn.disabled = false;
                processBtn.textContent = "Tingkatkan Resolusi";
            }
        );

    } else {
        // ===== BATCH MODE =====
        processBtn.disabled = true;
        processBtn.textContent = "Memproses Batch...";
        batchResults = [];
        batchQueue.innerHTML = "";
        batchSection.style.display = "block";
        downloadZipBtn.style.display = "none";
        batchCounter.textContent = `0 / ${selectedFiles.length}`;

        // Build queue UI items
        const queueItems = selectedFiles.map((file, idx) => {
            const div = document.createElement("div");
            div.className = "queue-item";
            div.id = `qi-${idx}`;

            // Thumbnail
            const thumb = document.createElement("img");
            thumb.className = "queue-thumb";
            const reader = new FileReader();
            reader.onload = (e) => { thumb.src = e.target.result; };
            reader.readAsDataURL(file);

            const info = document.createElement("div");
            info.className = "queue-info";

            const name = document.createElement("div");
            name.className = "queue-name";
            name.textContent = file.name;

            const progressWrap = document.createElement("div");
            progressWrap.className = "queue-progress-wrap";
            const progressBarEl = document.createElement("div");
            progressBarEl.className = "queue-progress-bar";
            progressWrap.appendChild(progressBarEl);

            info.appendChild(name);
            info.appendChild(progressWrap);

            const status = document.createElement("div");
            status.className = "queue-status waiting";
            status.textContent = "Antri";

            div.appendChild(thumb);
            div.appendChild(info);
            div.appendChild(status);
            batchQueue.appendChild(div);

            return { div, progressBarEl, status };
        });

        // Process sequentially
        let doneCount = 0;
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const { div, progressBarEl, status } = queueItems[i];

            div.classList.add("processing");
            status.className = "queue-status running";
            status.textContent = "Proses...";
            div.scrollIntoView({ behavior: "smooth", block: "nearest" });

            await new Promise((resolve) => {
                processFileWithProgress(
                    file,
                    (pct) => {
                        progressBarEl.style.width = `${pct}%`;
                    },
                    (data) => {
                        progressBarEl.style.width = "100%";
                        div.classList.remove("processing");
                        div.classList.add("done");
                        status.className = "queue-status done";
                        status.textContent = "✓ Selesai";
                        doneCount++;
                        batchCounter.textContent = `${doneCount} / ${selectedFiles.length}`;
                        const outputFilename = data.output_filename || data.result_url.split("/").pop();
                        batchResults.push(outputFilename);
                        resolve();
                    },
                    (err) => {
                        div.classList.remove("processing");
                        div.classList.add("error");
                        status.className = "queue-status error";
                        status.textContent = "✗ Gagal";
                        console.error(`Error processing ${file.name}:`, err);
                        resolve();
                    }
                );
            });
        }

        // All done
        processBtn.disabled = false;
        processBtn.textContent = `Proses ${selectedFiles.length} Foto`;
        if (batchResults.length > 0) {
            downloadZipBtn.style.display = "flex";
        }
        batchSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
});

// ===== Download ZIP =====
downloadZipBtn.addEventListener("click", async () => {
    if (batchResults.length === 0) return;

    downloadZipBtn.textContent = "Membuat ZIP...";
    downloadZipBtn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/zip`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filenames: batchResults })
        });

        if (!response.ok) throw new Error("Gagal membuat ZIP");

        const blob = await response.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href     = url;
        a.download = "restored_photos.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        alert("Gagal mengunduh ZIP: " + err.message);
    } finally {
        downloadZipBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Unduh Semua (ZIP)`;
        downloadZipBtn.disabled = false;
    }
});

function renderMeta(data) {
    const metaData = [
        { label: "Input", value: `${data.input.width} x ${data.input.height}` },
        { label: "Output", value: `${data.output.width} x ${data.output.height}` },
        { label: "Waktu Proses", value: `${data.processing_time_seconds} s` },
        { label: "Ukuran File", value: `${data.output_size_mb} MB` },
    ];

    metaRow.innerHTML = "";
    metaData.forEach(item => {
        const div = document.createElement("div");
        div.className = "meta-item";
        div.innerHTML = `<div class="meta-label">${item.label}</div><div class="meta-value">${item.value}</div>`;
        metaRow.appendChild(div);
    });

    // Render Highlights — maks 4
    featureHighlights.innerHTML = "";
    if (data.detected_faces && data.detected_faces.length > 0) {
        const faces = data.detected_faces.slice(0, 4);
        faces.forEach(face => {
            const btn = document.createElement("button");
            btn.className = "highlight-btn";
            btn.innerHTML = `<img src="${face.thumbnail}" class="highlight-thumb" alt="Detail">`;
            btn.title = "Sorot Area Ini";
            btn.onclick = () => {
                currentZoom = 3.5;
                zoomLayer.style.transition = "transform 0.5s cubic-bezier(0.2, 0, 0.2, 1), transform-origin 0.5s ease";
                zoomLayer.style.transform = `scale(${currentZoom})`;
                zoomLayer.style.transformOrigin = `${face.x_pct}% ${face.y_pct}%`;
                zoomResetBtn.style.display = "flex";

                // Slider ke tengah
                comparisonAfter.style.clipPath = `inset(0 0 0 50%)`;
                comparisonSliderLine.style.left = `50%`;
                comparisonSliderHandle.style.left = `50%`;

                setTimeout(() => {
                    zoomLayer.style.transition = "transform 0.15s cubic-bezier(0.2, 0, 0.2, 1), transform-origin 0.1s ease";
                }, 500);
            };
            featureHighlights.appendChild(btn);
        });
    }
}

// ===== Comparison Slider =====
let isDragging = false;
let currentZoom = 1;

// Zoom logic dihilangkan sesuai permintaan user (hanya via tombol thumbnail)

function setSliderPosition(clientX) {
    const rect = comparisonContainer.getBoundingClientRect();
    let pct = ((clientX - rect.left) / rect.width) * 100;
    pct = Math.max(0, Math.min(100, pct));
    comparisonAfter.style.clipPath = `inset(0 0 0 ${pct}%)`;
    comparisonSliderLine.style.left = `${pct}%`;
    comparisonSliderHandle.style.left = `${pct}%`;
}

function resetSlider() {
    currentZoom = 1;
    if (zoomLayer) {
        zoomLayer.style.transform = "scale(1)";
        zoomLayer.style.transformOrigin = "50% 50%";
    }
    if (zoomResetBtn) zoomResetBtn.style.display = "none";
    comparisonAfter.style.clipPath = "inset(0 0 0 50%)";
    comparisonSliderLine.style.left = "50%";
    comparisonSliderHandle.style.left = "50%";
}

// Zoom Reset Button
zoomResetBtn.addEventListener("click", () => { resetSlider(); });

// Mouse
comparisonContainer.addEventListener("mousedown", (e) => {
    isDragging = true;
    setSliderPosition(e.clientX);
});
document.addEventListener("mousemove", (e) => { if (isDragging) setSliderPosition(e.clientX); });
document.addEventListener("mouseup",   ()  => { isDragging = false; });

// Touch
comparisonContainer.addEventListener("touchstart", (e) => {
    isDragging = true;
    setSliderPosition(e.touches[0].clientX);
}, { passive: true });
document.addEventListener("touchmove",  (e) => { if (isDragging) setSliderPosition(e.touches[0].clientX); }, { passive: true });
document.addEventListener("touchend",   ()  => { isDragging = false; });

// Download logic handled natively by browser now using backend /download endpoint