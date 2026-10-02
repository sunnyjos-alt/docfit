const state = {
  photo: { file: null, originalUrl: null, processedBlob: null, processedUrl: null },
  signature: { file: null, originalUrl: null, processedBlob: null, processedUrl: null },
  image: {
    file: null,
    originalUrl: null,
    workingUrl: null,
    processedBlob: null,
    processedUrl: null
  }
};

const $ = id => document.getElementById(id);

/* =========================================================
   Stats
   ========================================================= */
const STATS_KEY = "docfit-stats";

function readStats() {
  try {
    const raw = JSON.parse(localStorage.getItem(STATS_KEY));
    if (raw && typeof raw === "object") {
      return {
        photos: Number(raw.photos) || 0,
        signatures: Number(raw.signatures) || 0,
        images: Number(raw.images) || 0
      };
    }
  } catch { /* ignore */ }
  return { photos: 0, signatures: 0, images: 0 };
}

function writeStats(stats) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch { /* ignore */ }
}

function renderStats() {
  const stats = readStats();
  const photoEl = document.querySelector('[data-stat="photos"]');
  const sigEl = document.querySelector('[data-stat="signatures"]');
  const imgEl = document.querySelector('[data-stat="images"]');
  if (photoEl) photoEl.textContent = stats.photos;
  if (sigEl) sigEl.textContent = stats.signatures;
  if (imgEl) imgEl.textContent = stats.images;
}

function incrementStat(key) {
  const stats = readStats();
  stats[key] = (stats[key] || 0) + 1;
  writeStats(stats);
  renderStats();
}

/* =========================================================
   Settings
   ========================================================= */
const SETTINGS_KEY = "docfit-settings";
const DEFAULT_SETTINGS = {
  theme: "light",
  photoFormat: "image/jpeg",
  photoMaxKB: 150,
  photoQuality: 80,
  signatureFormat: "image/jpeg",
  signatureMaxKB: 50,
  imageFormat: "image/jpeg",
  imageMaxKB: 0,
  imageQuality: 85
};

function readSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (raw && typeof raw === "object") return { ...DEFAULT_SETTINGS, ...raw };
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

function writeSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

function applySettingsToUI() {
  const s = readSettings();
  const map = {
    setPhotoFormat: s.photoFormat,
    setPhotoMaxKB: s.photoMaxKB,
    setPhotoQuality: s.photoQuality,
    setSignatureFormat: s.signatureFormat,
    setSignatureMaxKB: s.signatureMaxKB,
    setImageFormat: s.imageFormat,
    setImageMaxKB: s.imageMaxKB,
    setImageQuality: s.imageQuality
  };
  Object.entries(map).forEach(([id, val]) => {
    const el = $(id);
    if (el) el.value = val;
  });
  const pQ = $("setPhotoQualityValue"); if (pQ) pQ.textContent = s.photoQuality;
  const iQ = $("setImageQualityValue"); if (iQ) iQ.textContent = s.imageQuality;
  const themeGroup = $("themeSegmented");
  if (themeGroup) {
    themeGroup.querySelectorAll(".segment").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.value === s.theme);
    });
  }
}

function applyDefaultsToTools() {
  const s = readSettings();
  const pf = $("photoFormat"); if (pf) pf.value = s.photoFormat;
  const pmkb = $("photoMaxSizeKB"); if (pmkb) pmkb.value = s.photoMaxKB;
  const pq = $("photoQuality");
  if (pq) { pq.value = s.photoQuality; const out = $("photoQualityValue"); if (out) out.textContent = s.photoQuality; }

  const sf = $("signatureFormat"); if (sf) sf.value = s.signatureFormat;
  const smkb = $("signatureMaxSizeKB"); if (smkb) smkb.value = s.signatureMaxKB;

  const imf = $("imageOutputFormat"); if (imf) imf.value = s.imageFormat;
  const imkb = $("compressTargetSize"); if (imkb) imkb.value = s.imageMaxKB;
  const imq = $("imageQuality");
  if (imq) { imq.value = s.imageQuality; const out = $("imageQualityValue"); if (out) out.textContent = s.imageQuality; }
}

/* ---- Per-tool "last used settings" memory ---- */
const LAST_USED_KEY = "docfit-last-used";

function readLastUsed() {
  try {
    const raw = JSON.parse(localStorage.getItem(LAST_USED_KEY));
    if (raw && typeof raw === "object") return raw;
  } catch { /* ignore */ }
  return {};
}

function saveLastUsed(tool, settings) {
  try {
    const all = readLastUsed();
    all[tool] = settings;
    localStorage.setItem(LAST_USED_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

function restoreLastUsed() {
  const all = readLastUsed();

  if (all.photo) {
    const p = all.photo;
    const map = {
      photoWidth: p.width, photoHeight: p.height,
      photoBackground: p.background, photoCustomBg: p.customBg,
      photoFormat: p.format, photoMaxSizeKB: p.maxKB,
      photoBrightness: p.brightness, photoContrast: p.contrast,
      photoQuality: p.quality, photoPreset: p.preset
    };
    Object.entries(map).forEach(([id, val]) => {
      const el = $(id);
      if (el && val !== undefined && val !== null) el.value = val;
    });
    const bq = $("photoQualityValue"); if (bq) bq.textContent = $("photoQuality").value;
    const bb = $("photoBrightnessValue"); if (bb) bb.textContent = $("photoBrightness").value;
    const bc = $("photoContrastValue"); if (bc) bc.textContent = $("photoContrast").value;
  }

  if (all.signature) {
    const s = all.signature;
    const map = {
      signatureWidth: s.width, signatureHeight: s.height,
      signatureFormat: s.format, signatureMaxSizeKB: s.maxKB,
      signatureBackground: s.background, signatureThreshold: s.threshold
    };
    Object.entries(map).forEach(([id, val]) => {
      const el = $(id);
      if (el && val !== undefined && val !== null) el.value = val;
    });
    const st = $("signatureThresholdValue"); if (st) st.textContent = $("signatureThreshold").value;
    const removeBgEl = $("signatureRemoveBg");
    if (removeBgEl) {
      removeBgEl.checked = !!s.removeBg;
      const opts = $("signatureBgOptions");
      if (opts) opts.classList.toggle("hidden", !removeBgEl.checked);
    }
  }

  if (all.image) {
    const i = all.image;
    const map = {
      imageWidth: i.width, imageHeight: i.height,
      imagePercent: i.percent, imageQuality: i.quality,
      imageOutputFormat: i.format, compressTargetSize: i.maxKB
    };
    Object.entries(map).forEach(([id, val]) => {
      const el = $(id);
      if (el && val !== undefined && val !== null) el.value = val;
    });
    const iq = $("imageQualityValue"); if (iq) iq.textContent = $("imageQuality").value;
  }
}

function readCurrentPhotoSettings() {
  return {
    width: $("photoWidth").value, height: $("photoHeight").value,
    background: $("photoBackground").value, customBg: $("photoCustomBg").value,
    format: $("photoFormat").value, maxKB: $("photoMaxSizeKB").value,
    brightness: $("photoBrightness").value, contrast: $("photoContrast").value,
    quality: $("photoQuality").value, preset: $("photoPreset").value
  };
}
function readCurrentSignatureSettings() {
  return {
    width: $("signatureWidth").value, height: $("signatureHeight").value,
    format: $("signatureFormat").value, maxKB: $("signatureMaxSizeKB").value,
    background: $("signatureBackground").value, threshold: $("signatureThreshold").value,
    removeBg: $("signatureRemoveBg").checked
  };
}
function readCurrentImageSettings() {
  return {
    width: $("imageWidth").value, height: $("imageHeight").value,
    percent: $("imagePercent").value, quality: $("imageQuality").value,
    format: $("imageOutputFormat").value, maxKB: $("compressTargetSize").value
  };
}

/* =========================================================
   IndexedDB
   ========================================================= */
const DB_NAME = "docfit-db";
const DB_VERSION = 2;
const STORE_HISTORY = "history";
const STORE_FILES = "files";
const STORE_FOLDERS = "folders";
const HISTORY_LIMIT = 200;

let _dbPromise = null;

function openDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        const store = db.createObjectStore(STORE_HISTORY, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("type", "type", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        const store = db.createObjectStore(STORE_FILES, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("folderId", "folderId", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_FOLDERS)) {
        const store = db.createObjectStore(STORE_FOLDERS, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return _dbPromise;
}

function dbAdd(storeName, item) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}
function dbGet(storeName, id) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}
function dbGetAll(storeName) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  }));
}
function dbDelete(storeName, id) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}
function dbClear(storeName) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}

async function historyTrimToLimit() {
  try {
    const items = await dbGetAll(STORE_HISTORY);
    items.sort((a, b) => b.createdAt - a.createdAt);
    if (items.length <= HISTORY_LIMIT) return;
    const toDelete = items.slice(HISTORY_LIMIT);
    for (const item of toDelete) await dbDelete(STORE_HISTORY, item.id);
  } catch (err) { console.warn("Trim failed", err); }
}

async function saveToHistory(entry) {
  try {
    const beforeThumb = await makeThumbnail(entry.originalUrl, 200);
    const afterThumb = await blobToThumbnail(entry.processedBlob, 200);
    const item = {
      id: "h_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      type: entry.type,
      filename: entry.filename,
      width: entry.width, height: entry.height,
      originalSize: entry.originalSize, finalSize: entry.finalSize,
      format: entry.format,
      beforeThumb, afterThumb,
      processedBlob: entry.processedBlob,
      createdAt: Date.now()
    };
    await dbAdd(STORE_HISTORY, item);
    historyTrimToLimit();
    renderHomeRecentFiles();
  } catch (err) { console.warn("Could not save to history", err); }
}

const DEFAULT_FOLDERS = [
  { id: "f_documents", name: "Documents", icon: "📄", createdAt: 0, default: true },
  { id: "f_photos", name: "Photos", icon: "📷", createdAt: 0, default: true },
  { id: "f_signatures", name: "Signatures", icon: "✍️", createdAt: 0, default: true },
  { id: "f_certificates", name: "Certificates", icon: "🎓", createdAt: 0, default: true },
  { id: "f_other", name: "Other", icon: "📦", createdAt: 0, default: true }
];

async function ensureDefaultFolders() {
  const existing = await dbGetAll(STORE_FOLDERS);
  if (existing.length === 0) {
    for (const f of DEFAULT_FOLDERS) await dbAdd(STORE_FOLDERS, f);
    return DEFAULT_FOLDERS;
  }
  return existing;
}

/* =========================================================
   Files page state
   ========================================================= */
const filesState = {
  activeFolder: "all",
  search: "",
  selected: new Set(),
  currentItems: []
};

/* =========================================================
   Helpers
   ========================================================= */
function makeThumbnail(sourceUrl, maxSize) {
  return new Promise(async resolve => {
    try {
      const img = await loadImage(sourceUrl);
      resolve(drawThumbFromImage(img, maxSize));
    } catch { resolve(null); }
  });
}

function blobToThumbnail(blob, maxSize) {
  return new Promise(async resolve => {
    try {
      const url = URL.createObjectURL(blob);
      const img = await loadImage(url);
      const thumb = drawThumbFromImage(img, maxSize);
      URL.revokeObjectURL(url);
      resolve(thumb);
    } catch { resolve(null); }
  });
}

function drawThumbFromImage(img, maxSize) {
  const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
  const w = Math.max(1, Math.round(img.width * ratio));
  const h = Math.max(1, Math.round(img.height * ratio));
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.7);
}

function formatRelativeDate(timestamp) {
  const d = new Date(timestamp);
  const diffMs = Date.now() - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  return d.toLocaleDateString();
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* =========================================================
   Copy to clipboard + Share helpers
   ========================================================= */
async function copyBlobToClipboard(blob) {
  try {
    if (!navigator.clipboard || !window.ClipboardItem) {
      showToast("Clipboard not supported in this browser. Try Download instead.");
      return false;
    }
    let clipBlob = blob;
    if (blob.type !== "image/png") {
      const img = await loadImage(URL.createObjectURL(blob));
      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      clipBlob = await canvasToBlob(canvas, "image/png", 1);
    }
    await navigator.clipboard.write([new ClipboardItem({ "image/png": clipBlob })]);
    showToast("Copied to clipboard. Paste anywhere.");
    return true;
  } catch (err) {
    console.warn("Copy failed:", err);
    showToast("Could not copy. Try Download instead.");
    return false;
  }
}

async function shareBlob(blob, filename) {
  try {
    const file = new File([blob], filename, { type: blob.type || "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "DocFit",
        text: "Made with DocFit — free photo, signature & image tools."
      });
      return true;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: "DocFit",
          text: "Free photo, signature & image tools — try DocFit!",
          url: location.origin
        });
        return true;
      } catch (e) {
        if (e && e.name === "AbortError") return false;
      }
    }

    if (navigator.clipboard && window.ClipboardItem) {
      try {
        let clipBlob = blob;
        if (blob.type !== "image/png") {
          const img = await loadImage(URL.createObjectURL(blob));
          const canvas = createCanvas(img.width, img.height);
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          clipBlob = await canvasToBlob(canvas, "image/png", 1);
        }
        await navigator.clipboard.write([new ClipboardItem({ "image/png": clipBlob })]);
        showToast("Image copied to clipboard. Paste it anywhere.");
        return true;
      } catch (e) {
        console.warn("Clipboard image copy failed:", e);
      }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(`Check out DocFit — free photo, signature & image tools. ${location.origin}`);
        showToast("Link copied. Share it anywhere.");
        return true;
      } catch (e) {
        console.warn("Clipboard text copy failed:", e);
      }
    }

    showToast("Sharing isn't supported in this browser. Try Copy or Download instead.");
    return false;
  } catch (err) {
    if (err && err.name === "AbortError") return false;
    console.warn("Share failed:", err);
    showToast("Sharing isn't supported here. Try Copy or Download instead.");
    return false;
  }
}

/* =========================================================
   Home Recent Files (clickable to reload)
   ========================================================= */
async function renderHomeRecentFiles() {
  const listEl = $("homeRecentFiles");
  if (!listEl) return;

  let items = [];
  try {
    items = await dbGetAll(STORE_HISTORY);
    items.sort((a, b) => b.createdAt - a.createdAt);
    items = items.slice(0, 8);
  } catch { items = []; }

  listEl.replaceChildren();

  if (!items.length) {
    const empty = document.createElement("span");
    empty.className = "recent-files-empty";
    empty.textContent = "Your recently processed files will appear here.";
    listEl.appendChild(empty);
    return;
  }

  items.forEach(item => {
    const el = document.createElement("div");
    el.className = "recent-file";
    el.title = "Click to reopen in its tool";
    el.innerHTML = `
      <img src="${item.afterThumb || item.beforeThumb || ""}" alt="${escapeHtml(item.filename)}" />
      <div>
        <strong>${escapeHtml(item.filename)}</strong>
        <span>${formatRelativeDate(item.createdAt)}</span>
      </div>
    `;
    el.addEventListener("click", () => reopenFromHistory(item));
    listEl.appendChild(el);
  });
}

async function reopenFromHistory(item) {
  try {
    if (!item.processedBlob) {
      showToast("This entry can't be reopened.");
      return;
    }

    let sectionHash = "#photo-tools";
    if (item.type === "photo") sectionHash = "#photo-tools";
    else if (item.type === "signature") sectionHash = "#signature-tools";
    else if (item.type === "image") sectionHash = "#image-tools";

    document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
    $("view-home").classList.remove("hidden");

    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    const navEl = document.querySelector(`.nav-item[href="${sectionHash}"]`);
    if (navEl) navEl.classList.add("active");

    setTimeout(() => {
      const section = document.querySelector(sectionHash);
      if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 30);

    const fileName = item.filename || `docfit-${item.type}-reopen.png`;
    const file = new File([item.processedBlob], fileName, { type: item.processedBlob.type || "image/png" });

    if (item.type === "photo") {
      const url = await fileToDataUrl(file);
      state.photo.file = file;
      state.photo.originalUrl = url;
      state.photo.processedBlob = null;

      setFileCard("photoFileCard", "photoOriginalPreview", "photoFileName", "photoFileDetails", file, url);
      const beforeImg = $("photoBeforeImg");
      const beforeEmpty = $("photoBeforeEmpty");
      if (beforeImg && beforeEmpty) setPreview(beforeImg, beforeEmpty, url);
      getImageDimensions(url).then(({ width, height }) => {
        const meta = $("photoBeforeMeta");
        if (meta) meta.textContent = `${width} × ${height} px · ${formatBytes(file.size)}`;
        const wEl = $("photoWidth"); const hEl = $("photoHeight");
        if (wEl) wEl.value = width;
        if (hEl) hEl.value = height;
      });
      setStatus($("photoPreviewStatus"), "Ready");
    } else if (item.type === "signature") {
      const url = await fileToDataUrl(file);
      state.signature.file = file;
      state.signature.originalUrl = url;
      state.signature.processedBlob = null;

      setFileCard("signatureFileCard", "signatureOriginalPreview", "signatureFileName", "signatureFileDetails", file, url);
      const beforeImg = $("signatureBeforeImg");
      const beforeEmpty = $("signatureBeforeEmpty");
      if (beforeImg && beforeEmpty) setPreview(beforeImg, beforeEmpty, url);
      getImageDimensions(url).then(({ width, height }) => {
        const meta = $("signatureBeforeMeta");
        if (meta) meta.textContent = `${width} × ${height} px · ${formatBytes(file.size)}`;
      });
      setStatus($("signaturePreviewStatus"), "Ready");
    } else if (item.type === "image") {
      const url = await fileToDataUrl(file);
      state.image.file = file;
      state.image.originalUrl = url;
      state.image.workingUrl = null;
      state.image.processedBlob = null;

      setFileCard("imageFileCard", "imageOriginalPreview", "imageFileName", "imageFileDetails", file, url);
      const beforeImg = $("imageBeforeImg");
      const beforeEmpty = $("imageBeforeEmpty");
      if (beforeImg && beforeEmpty) setPreview(beforeImg, beforeEmpty, url);
      getImageDimensions(url).then(({ width, height }) => {
        const meta = $("imageBeforeMeta");
        if (meta) meta.textContent = `${width} × ${height} px · ${formatBytes(file.size)}`;
        const wEl = $("imageWidth"); const hEl = $("imageHeight");
        if (wEl) wEl.value = width;
        if (hEl) hEl.value = height;
      });
      const cropToggle = $("cropToggleBtn");
      if (cropToggle) cropToggle.classList.remove("hidden");
      setStatus($("imagePreviewStatus"), "Ready");
    }

    showToast("Reopened in its tool.");
  } catch (err) {
    console.error(err);
    showToast("Could not reopen this file.");
  }
}

/* =========================================================
   History page
   ========================================================= */
let currentHistoryFilter = "all";

async function renderHistoryPage() {
  const listEl = $("historyList");
  const emptyEl = $("historyEmpty");
  if (!listEl || !emptyEl) return;

  let items = [];
  try {
    items = await dbGetAll(STORE_HISTORY);
    items.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error("History read error:", err);
    items = [];
  }

  let savedIds = new Set();
  try {
    const savedFiles = await dbGetAll(STORE_FILES);
    savedFiles.forEach(f => { if (f.fromHistoryId) savedIds.add(f.fromHistoryId); });
  } catch { /* ignore */ }

  const filtered = currentHistoryFilter === "all"
    ? items
    : items.filter(it => it.type === currentHistoryFilter);

  listEl.replaceChildren();

  if (!filtered.length) {
    listEl.classList.add("hidden");
    emptyEl.classList.remove("hidden");
    return;
  }

  listEl.classList.remove("hidden");
  emptyEl.classList.add("hidden");

  filtered.forEach(item => {
    const el = document.createElement("div");
    el.className = "history-item";

    const typeLabel = item.type === "photo" ? "Photo"
                    : item.type === "signature" ? "Signature"
                    : "Image";
    const formatLabel = (item.format || "image/jpeg").split("/")[1].toUpperCase();
    const alreadySaved = savedIds.has(item.id);

    el.innerHTML = `
      <div class="history-thumb">
        ${item.beforeThumb ? `<img src="${item.beforeThumb}" alt="Before" />` : ""}
      </div>
      <div class="history-arrow">→</div>
      <div class="history-thumb">
        ${item.afterThumb ? `<img src="${item.afterThumb}" alt="After" />` : ""}
      </div>
      <div class="history-info">
        <div class="history-info-row1">
          <span class="history-filename">${escapeHtml(item.filename)}</span>
          <span class="history-type-badge history-type-${item.type}">${typeLabel}</span>
        </div>
        <div class="history-info-row2">
          <span>📐 ${item.width} × ${item.height} px</span>
          <span>📦 ${formatBytes(item.originalSize)} → ${formatBytes(item.finalSize)}</span>
          <span>🎨 ${formatLabel}</span>
          <span>🕐 ${formatRelativeDate(item.createdAt)}</span>
        </div>
      </div>
      <div class="history-actions">
        <button class="history-action-btn" data-save="${item.id}" title="${alreadySaved ? "Already saved" : "Save to My Files"}" type="button" ${alreadySaved ? "disabled style=\"opacity:0.4;cursor:default\"" : ""}>${alreadySaved ? "✓" : "💾"}</button>
        <button class="history-action-btn" data-download="${item.id}" title="Download full file" type="button">⬇</button>
        <button class="history-action-btn danger" data-delete="${item.id}" title="Delete" type="button">✕</button>
      </div>
    `;
    listEl.appendChild(el);
  });

  listEl.querySelectorAll("[data-download]").forEach(btn => {
    btn.addEventListener("click", () => downloadHistoryItem(btn.dataset.download));
  });
  listEl.querySelectorAll("[data-delete]").forEach(btn => {
    btn.addEventListener("click", () => deleteHistoryItem(btn.dataset.delete));
  });
  listEl.querySelectorAll("[data-save]").forEach(btn => {
    if (btn.disabled) return;
    btn.addEventListener("click", () => saveHistoryItemToFiles(btn.dataset.save));
  });
}

async function downloadHistoryItem(id) {
  try {
    const item = await dbGet(STORE_HISTORY, id);
    if (!item || !item.processedBlob) { showToast("This entry has no downloadable file."); return; }
    triggerBlobDownload(item.processedBlob, item.filename);
  } catch (err) {
    console.error(err);
    showToast("Could not download this entry.");
  }
}

async function deleteHistoryItem(id) {
  await dbDelete(STORE_HISTORY, id);
  await renderHistoryPage();
  renderHomeRecentFiles();
  showToast("Entry removed.");
}

async function clearAllHistory() {
  if (!confirm("Delete all history? This cannot be undone.")) return;
  await dbClear(STORE_HISTORY);
  await renderHistoryPage();
  renderHomeRecentFiles();
  showToast("History cleared.");
}

async function saveHistoryItemToFiles(historyId) {
  try {
    const item = await dbGet(STORE_HISTORY, historyId);
    if (!item) { showToast("Entry not found."); return; }

    let suggestedFolder = "f_documents";
    if (item.type === "photo") suggestedFolder = "f_photos";
    if (item.type === "signature") suggestedFolder = "f_signatures";

    const folderId = await promptChooseFolder(suggestedFolder);
    if (!folderId) return;

    const newFile = {
      id: "file_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      name: item.filename,
      type: item.type,
      width: item.width, height: item.height,
      originalSize: item.originalSize, finalSize: item.finalSize,
      format: item.format,
      thumb: item.afterThumb,
      processedBlob: item.processedBlob,
      folderId: folderId,
      fromHistoryId: item.id,
      createdAt: Date.now()
    };
    await dbAdd(STORE_FILES, newFile);
    showToast("Saved to My Files.");
    await renderHistoryPage();
  } catch (err) {
    console.error(err);
    showToast("Could not save to My Files.");
  }
}

/* =========================================================
   Prompt helpers
   ========================================================= */
function showPrompt({ title, message, placeholder, initialValue, confirmLabel }) {
  return new Promise(resolve => {
    const backdrop = $("promptBackdrop");
    const titleEl = $("promptTitle");
    const messageEl = $("promptMessage");
    const inputEl = $("promptInput");
    const cancelBtn = $("promptCancel");
    const confirmBtn = $("promptConfirm");

    titleEl.textContent = title || "Input";
    messageEl.textContent = message || "";
    inputEl.value = initialValue || "";
    inputEl.placeholder = placeholder || "";
    confirmBtn.textContent = confirmLabel || "OK";

    backdrop.hidden = false;
    setTimeout(() => inputEl.focus(), 50);

    function cleanup() {
      backdrop.hidden = true;
      cancelBtn.removeEventListener("click", onCancel);
      confirmBtn.removeEventListener("click", onConfirm);
      document.removeEventListener("keydown", onKey);
    }
    function onCancel() { cleanup(); resolve(null); }
    function onConfirm() {
      const val = inputEl.value.trim();
      if (!val) return;
      cleanup();
      resolve(val);
    }
    function onKey(e) {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    }
    cancelBtn.addEventListener("click", onCancel);
    confirmBtn.addEventListener("click", onConfirm);
    document.addEventListener("keydown", onKey);
  });
}

function promptChooseFolder(defaultId) {
  return new Promise(async resolve => {
    const folders = await dbGetAll(STORE_FOLDERS);
    folders.sort((a, b) => a.createdAt - b.createdAt);

    const backdrop = $("promptBackdrop");
    const titleEl = $("promptTitle");
    const messageEl = $("promptMessage");
    const inputEl = $("promptInput");
    const cancelBtn = $("promptCancel");
    const confirmBtn = $("promptConfirm");

    titleEl.textContent = "Save to folder";
    messageEl.textContent = "Choose a folder:";

    const select = document.createElement("select");
    select.className = "input-control";
    folders.forEach(f => {
      const opt = document.createElement("option");
      opt.value = f.id;
      opt.textContent = `${f.icon || "📁"} ${f.name}`;
      if (f.id === defaultId) opt.selected = true;
      select.appendChild(opt);
    });

    inputEl.parentNode.insertBefore(select, inputEl);
    inputEl.style.display = "none";

    confirmBtn.textContent = "Save";
    backdrop.hidden = false;

    function cleanup() {
      backdrop.hidden = true;
      inputEl.style.display = "";
      if (select.parentNode) select.parentNode.removeChild(select);
      cancelBtn.removeEventListener("click", onCancel);
      confirmBtn.removeEventListener("click", onConfirm);
      document.removeEventListener("keydown", onKey);
    }
    function onCancel() { cleanup(); resolve(null); }
    function onConfirm() { const v = select.value; cleanup(); resolve(v); }
    function onKey(e) {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    }
    cancelBtn.addEventListener("click", onCancel);
    confirmBtn.addEventListener("click", onConfirm);
    document.addEventListener("keydown", onKey);
  });
}

/* =========================================================
   Files page
   ========================================================= */
async function renderFolders() {
  const folders = await dbGetAll(STORE_FOLDERS);
  folders.sort((a, b) => {
    if (a.default && b.default) return DEFAULT_FOLDERS.findIndex(f => f.id === a.id) - DEFAULT_FOLDERS.findIndex(f => f.id === b.id);
    if (a.default) return -1;
    if (b.default) return 1;
    return a.createdAt - b.createdAt;
  });
  const files = await dbGetAll(STORE_FILES);
  const counts = { all: files.length };
  folders.forEach(f => { counts[f.id] = 0; });
  files.forEach(file => {
    if (file.folderId && counts[file.folderId] !== undefined) counts[file.folderId]++;
  });

  const allBtn = document.querySelector('.folder-item[data-folder="all"]');
  if (allBtn) {
    const countEl = allBtn.querySelector(".folder-count");
    if (countEl) countEl.textContent = counts.all;
  }

  const list = $("folderList");
  if (!list) return;
  list.replaceChildren();

  folders.forEach(folder => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "folder-item" + (filesState.activeFolder === folder.id ? " active" : "");
    btn.dataset.folder = folder.id;
    btn.innerHTML = `
      <span class="folder-icon" aria-hidden="true">${folder.icon || "📁"}</span>
      <span class="folder-name">${escapeHtml(folder.name)}</span>
      <span class="folder-count">${counts[folder.id] || 0}</span>
    `;
    btn.addEventListener("click", () => {
      filesState.activeFolder = folder.id;
      filesState.selected.clear();
      renderFolders();
      renderFilesPage();
    });
    list.appendChild(btn);
  });

  document.querySelectorAll('.folder-item[data-folder="all"]').forEach(b => {
    b.classList.toggle("active", filesState.activeFolder === "all");
  });
}

async function renderFilesPage() {
  const grid = $("filesGrid");
  const emptyEl = $("filesEmpty");
  const headingEl = $("filesHeading");
  if (!grid || !emptyEl) return;

  let files = await dbGetAll(STORE_FILES);
  const folders = await dbGetAll(STORE_FOLDERS);
  const folderMap = new Map(folders.map(f => [f.id, f]));

  if (filesState.activeFolder !== "all") {
    files = files.filter(f => f.folderId === filesState.activeFolder);
  }
  if (filesState.search) {
    const q = filesState.search.toLowerCase();
    files = files.filter(f => (f.name || "").toLowerCase().includes(q));
  }
  files.sort((a, b) => b.createdAt - a.createdAt);
  filesState.currentItems = files;

  if (headingEl) {
    if (filesState.activeFolder === "all") headingEl.textContent = "All files";
    else {
      const folder = folderMap.get(filesState.activeFolder);
      headingEl.textContent = folder ? `${folder.icon || "📁"} ${folder.name}` : "Folder";
    }
  }

  grid.replaceChildren();

  if (!files.length) {
    grid.classList.add("hidden");
    emptyEl.classList.remove("hidden");
    updateBulkBar();
    return;
  }
  grid.classList.remove("hidden");
  emptyEl.classList.add("hidden");

  files.forEach(file => {
    const card = document.createElement("div");
    card.className = "file-card-item" + (filesState.selected.has(file.id) ? " selected" : "");
    card.dataset.fileId = file.id;
    const folder = folderMap.get(file.folderId);

    card.innerHTML = `
      <input type="checkbox" class="file-card-checkbox" data-check="${file.id}" ${filesState.selected.has(file.id) ? "checked" : ""} />
      <div class="file-card-thumb">
        ${file.thumb ? `<img src="${file.thumb}" alt="${escapeHtml(file.name)}" />` : ""}
      </div>
      <div class="file-card-info">
        <div class="file-card-name">${escapeHtml(file.name)}</div>
        <div class="file-card-meta">
          <span>${file.width}×${file.height}</span>
          <span>${formatBytes(file.finalSize)}</span>
        </div>
        ${folder ? `<span class="file-card-folder">${folder.icon || "📁"} ${escapeHtml(folder.name)}</span>` : ""}
      </div>
    `;
    card.addEventListener("click", e => {
      if (e.target.matches('input[type="checkbox"]')) return;
      openPreview(file.id);
    });
    grid.appendChild(card);
  });

  grid.querySelectorAll("[data-check]").forEach(cb => {
    cb.addEventListener("click", e => e.stopPropagation());
    cb.addEventListener("change", () => {
      const id = cb.dataset.check;
      if (cb.checked) filesState.selected.add(id);
      else filesState.selected.delete(id);
      cb.closest(".file-card-item").classList.toggle("selected", cb.checked);
      updateBulkBar();
    });
  });

  const selectAll = $("filesSelectAll");
  if (selectAll) {
    selectAll.checked = files.length > 0 && filesState.selected.size === files.length;
    selectAll.indeterminate = filesState.selected.size > 0 && filesState.selected.size < files.length;
  }
  updateBulkBar();
}

function updateBulkBar() {
  const moveBtn = $("filesMoveBtn");
  const deleteBtn = $("filesDeleteBtn");
  const n = filesState.selected.size;
  if (moveBtn) {
    moveBtn.classList.toggle("hidden", n === 0);
    moveBtn.textContent = n > 0 ? `Move (${n})` : "Move to folder";
  }
  if (deleteBtn) {
    deleteBtn.classList.toggle("hidden", n === 0);
    deleteBtn.textContent = n > 0 ? `Delete (${n})` : "Delete";
  }
}

async function moveSelectedToFolder() {
  if (!filesState.selected.size) return;
  const folders = await dbGetAll(STORE_FOLDERS);
  folders.sort((a, b) => a.createdAt - b.createdAt);

  const folderId = await new Promise(resolve => {
    const backdrop = $("promptBackdrop");
    const titleEl = $("promptTitle");
    const messageEl = $("promptMessage");
    const inputEl = $("promptInput");
    const cancelBtn = $("promptCancel");
    const confirmBtn = $("promptConfirm");

    titleEl.textContent = "Move to folder";
    messageEl.textContent = `${filesState.selected.size} file(s) will be moved.`;
    const select = document.createElement("select");
    select.className = "input-control";
    folders.forEach(f => {
      const opt = document.createElement("option");
      opt.value = f.id;
      opt.textContent = `${f.icon || "📁"} ${f.name}`;
      select.appendChild(opt);
    });
    inputEl.parentNode.insertBefore(select, inputEl);
    inputEl.style.display = "none";
    confirmBtn.textContent = "Move";
    backdrop.hidden = false;

    function cleanup() {
      backdrop.hidden = true;
      inputEl.style.display = "";
      if (select.parentNode) select.parentNode.removeChild(select);
      cancelBtn.removeEventListener("click", onCancel);
      confirmBtn.removeEventListener("click", onConfirm);
    }
    function onCancel() { cleanup(); resolve(null); }
    function onConfirm() { const v = select.value; cleanup(); resolve(v); }

    cancelBtn.addEventListener("click", onCancel);
    confirmBtn.addEventListener("click", onConfirm);
  });

  if (!folderId) return;
  for (const id of filesState.selected) {
    const file = await dbGet(STORE_FILES, id);
    if (file) { file.folderId = folderId; await dbAdd(STORE_FILES, file); }
  }
  filesState.selected.clear();
  await renderFolders();
  await renderFilesPage();
  showToast("Files moved.");
}

async function deleteSelected() {
  if (!filesState.selected.size) return;
  if (!confirm(`Delete ${filesState.selected.size} file(s)? This cannot be undone.`)) return;
  for (const id of filesState.selected) await dbDelete(STORE_FILES, id);
  filesState.selected.clear();
  await renderFolders();
  await renderFilesPage();
  showToast("Files deleted.");
}

async function createNewFolder() {
  const name = await showPrompt({
    title: "New folder",
    message: "Give your folder a name.",
    placeholder: "e.g. Visa documents",
    confirmLabel: "Create"
  });
  if (!name) return;
  const folder = {
    id: "f_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
    name: name,
    icon: "📁",
    createdAt: Date.now(),
    default: false
  };
  await dbAdd(STORE_FOLDERS, folder);
  await renderFolders();
  showToast("Folder created.");
}

/* Preview modal */
let previewFileId = null;

async function openPreview(fileId) {
  const file = await dbGet(STORE_FILES, fileId);
  if (!file) { showToast("File not found."); return; }

  previewFileId = fileId;
  const backdrop = $("previewBackdrop");
  const img = $("previewImage");
  const meta = $("previewMeta");

  if (file.processedBlob) img.src = URL.createObjectURL(file.processedBlob);
  else if (file.thumb) img.src = file.thumb;
  else img.removeAttribute("src");

  const folders = await dbGetAll(STORE_FOLDERS);
  const folder = folders.find(f => f.id === file.folderId);

  meta.innerHTML = `
    <strong>${escapeHtml(file.name)}</strong><br/>
    ${file.width} × ${file.height} px · ${formatBytes(file.finalSize)} · ${(file.format || "image/jpeg").split("/")[1].toUpperCase()}<br/>
    ${folder ? "Folder: " + escapeHtml(folder.name) + " · " : ""}Saved ${formatRelativeDate(file.createdAt)}
  `;
  backdrop.hidden = false;
}

function closePreview() {
  const backdrop = $("previewBackdrop");
  backdrop.hidden = true;
  const img = $("previewImage");
  if (img.src && img.src.startsWith("blob:")) URL.revokeObjectURL(img.src);
  img.removeAttribute("src");
  previewFileId = null;
}

async function previewDownload() {
  if (!previewFileId) return;
  const file = await dbGet(STORE_FILES, previewFileId);
  if (!file || !file.processedBlob) { showToast("Nothing to download."); return; }
  triggerBlobDownload(file.processedBlob, file.name);
}

async function previewRename() {
  if (!previewFileId) return;
  const file = await dbGet(STORE_FILES, previewFileId);
  if (!file) return;
  const newName = await showPrompt({
    title: "Rename file",
    message: "Enter a new name.",
    initialValue: file.name,
    confirmLabel: "Rename"
  });
  if (!newName) return;
  file.name = newName;
  await dbAdd(STORE_FILES, file);
  await renderFilesPage();
  await openPreview(previewFileId);
  showToast("Renamed.");
}

async function previewDelete() {
  if (!previewFileId) return;
  if (!confirm("Delete this file? This cannot be undone.")) return;
  await dbDelete(STORE_FILES, previewFileId);
  closePreview();
  await renderFolders();
  await renderFilesPage();
  showToast("File deleted.");
}

/* =========================================================
   Utility — download
   ========================================================= */
function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "docfit-download";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("Download started.");
}

/* =========================================================
   Paste from clipboard (Ctrl+V)
   ========================================================= */
function setupGlobalPaste() {
  document.addEventListener("paste", async e => {
    try {
      const tag = (document.activeElement && document.activeElement.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      let imageFile = null;
      for (const item of items) {
        if (item.type && item.type.startsWith("image/")) {
          imageFile = item.getAsFile();
          break;
        }
      }
      if (!imageFile) return;

      e.preventDefault();

      const tool = pickActiveTool();
      if (tool === "photo") {
        await handlePhotoFile(imageFile);
        showToast("Pasted into Photo Resizer.");
      } else if (tool === "signature") {
        await handleSignatureFile(imageFile);
        showToast("Pasted into Signature Resizer.");
      } else {
        await handleImageFile(imageFile);
        showToast("Pasted into Image Tools.");
      }

      const target = tool === "photo" ? "#photo-tools" : tool === "signature" ? "#signature-tools" : "#image-tools";
      const el = document.querySelector(target);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      console.warn("Paste failed:", err);
    }
  });
}

function pickActiveTool() {
  const tools = [
    { name: "photo", el: $("photo-tools") },
    { name: "signature", el: $("signature-tools") },
    { name: "image", el: $("image-tools") }
  ].filter(t => t.el);

  if (!tools.length) return "image";
  const mid = window.innerHeight / 2;
  let best = tools[0];
  let bestDist = Infinity;
  tools.forEach(t => {
    const r = t.el.getBoundingClientRect();
    const center = r.top + r.height / 2;
    const d = Math.abs(center - mid);
    if (d < bestDist) { bestDist = d; best = t; }
  });
  return best.name;
}

async function handlePhotoFile(file) {
  const url = await fileToDataUrl(file);
  state.photo.file = file;
  state.photo.originalUrl = url;
  setFileCard("photoFileCard", "photoOriginalPreview", "photoFileName", "photoFileDetails", file, url);
  const beforeImg = $("photoBeforeImg");
  const beforeEmpty = $("photoBeforeEmpty");
  if (beforeImg && beforeEmpty) setPreview(beforeImg, beforeEmpty, url);
  getImageDimensions(url).then(({ width, height }) => {
    const meta = $("photoBeforeMeta");
    if (meta) meta.textContent = `${width} × ${height} px · ${formatBytes(file.size)}`;
  });
  setStatus($("photoPreviewStatus"), "Ready");
}

async function handleSignatureFile(file) {
  const url = await fileToDataUrl(file);
  state.signature.file = file;
  state.signature.originalUrl = url;
  setFileCard("signatureFileCard", "signatureOriginalPreview", "signatureFileName", "signatureFileDetails", file, url);
  const beforeImg = $("signatureBeforeImg");
  const beforeEmpty = $("signatureBeforeEmpty");
  if (beforeImg && beforeEmpty) setPreview(beforeImg, beforeEmpty, url);
  getImageDimensions(url).then(({ width, height }) => {
    const meta = $("signatureBeforeMeta");
    if (meta) meta.textContent = `${width} × ${height} px · ${formatBytes(file.size)}`;
  });
  setStatus($("signaturePreviewStatus"), "Ready");
}

async function handleImageFile(file) {
  const url = await fileToDataUrl(file);
  state.image.file = file;
  state.image.originalUrl = url;
  state.image.workingUrl = null;
  setFileCard("imageFileCard", "imageOriginalPreview", "imageFileName", "imageFileDetails", file, url);
  const beforeImg = $("imageBeforeImg");
  const beforeEmpty = $("imageBeforeEmpty");
  if (beforeImg && beforeEmpty) setPreview(beforeImg, beforeEmpty, url);
  getImageDimensions(url).then(({ width, height }) => {
    const meta = $("imageBeforeMeta");
    if (meta) meta.textContent = `${width} × ${height} px · ${formatBytes(file.size)}`;
    const wEl = $("imageWidth"); const hEl = $("imageHeight");
    if (wEl && (!wEl.value || wEl.value === "1200")) wEl.value = width;
    if (hEl && (!hEl.value || hEl.value === "1200")) hEl.value = height;
  });
  const cropToggle = $("cropToggleBtn");
  if (cropToggle) cropToggle.classList.remove("hidden");
  setStatus($("imagePreviewStatus"), "Ready");
}

/* =========================================================
   Keyboard shortcuts
   ========================================================= */
function setupShortcuts() {
  document.addEventListener("keydown", e => {
    const tag = (document.activeElement && document.activeElement.tagName) || "";
    const inField = tag === "INPUT" || tag === "TEXTAREA";

    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "h" && !inField) {
      e.preventDefault();
      document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
      $("view-history").classList.remove("hidden");
      renderHistoryPage();
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
      const navEl = document.querySelector('.nav-item[data-nav="history"]');
      if (navEl) navEl.classList.add("active");
      return;
    }

    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "s" && !inField) {
      e.preventDefault();
      const tool = pickActiveTool();
      if (tool === "photo" && state.photo.processedBlob) triggerBlobDownload(state.photo.processedBlob, `docfit-photo-${Date.now()}.jpg`);
      else if (tool === "signature" && state.signature.processedBlob) triggerBlobDownload(state.signature.processedBlob, `docfit-signature-${Date.now()}.png`);
      else if (tool === "image" && state.image.processedBlob) triggerBlobDownload(state.image.processedBlob, `docfit-image-${Date.now()}.jpg`);
      else showToast("Nothing processed yet in this tool.");
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "c" && !inField) {
      e.preventDefault();
      const tool = pickActiveTool();
      if (tool === "photo" && state.photo.processedBlob) copyBlobToClipboard(state.photo.processedBlob);
      else if (tool === "signature" && state.signature.processedBlob) copyBlobToClipboard(state.signature.processedBlob);
      else if (tool === "image" && state.image.processedBlob) copyBlobToClipboard(state.image.processedBlob);
      else showToast("Nothing processed yet in this tool.");
      return;
    }

    if ((e.ctrlKey || e.metaKey) && !inField) {
      if (e.key === "1") {
        e.preventDefault();
        const s = document.querySelector("#photo-tools");
        if (s) s.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (e.key === "2") {
        e.preventDefault();
        const s = document.querySelector("#signature-tools");
        if (s) s.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (e.key === "3") {
        e.preventDefault();
        const s = document.querySelector("#image-tools");
        if (s) s.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }

    if (e.key === "Escape" && !inField) {
      const previewOpen = $("previewBackdrop") && !$("previewBackdrop").hidden;
      const promptOpen = $("promptBackdrop") && !$("promptBackdrop").hidden;
      if (previewOpen || promptOpen) return;

      const tool = pickActiveTool();
      if (tool === "photo") resetPhoto();
      else if (tool === "signature") resetSignature();
      else if (tool === "image") resetImage();
    }
  });
}

/* =========================================================
   Files page setup
   ========================================================= */
function setupFilesPage() {
  const newFolderBtn = $("filesNewFolderBtn");
  if (newFolderBtn) newFolderBtn.addEventListener("click", createNewFolder);

  const allBtn = document.querySelector('.folder-item[data-folder="all"]');
  if (allBtn) {
    allBtn.addEventListener("click", () => {
      filesState.activeFolder = "all";
      filesState.selected.clear();
      renderFolders();
      renderFilesPage();
    });
  }

  const searchInput = $("filesSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      filesState.search = searchInput.value.trim();
      renderFilesPage();
    });
  }

  const selectAll = $("filesSelectAll");
  if (selectAll) {
    selectAll.addEventListener("change", () => {
      if (selectAll.checked) filesState.currentItems.forEach(f => filesState.selected.add(f.id));
      else filesState.selected.clear();
      renderFilesPage();
    });
  }

  const moveBtn = $("filesMoveBtn");
  if (moveBtn) moveBtn.addEventListener("click", moveSelectedToFolder);
  const deleteBtn = $("filesDeleteBtn");
  if (deleteBtn) deleteBtn.addEventListener("click", deleteSelected);

  const previewClose = $("previewClose");
  if (previewClose) previewClose.addEventListener("click", closePreview);
  const previewBackdrop = $("previewBackdrop");
  if (previewBackdrop) {
    previewBackdrop.addEventListener("click", e => {
      if (e.target === previewBackdrop) closePreview();
    });
  }
  const previewDownloadBtn = $("previewDownload");
  if (previewDownloadBtn) previewDownloadBtn.addEventListener("click", previewDownload);
  const previewRenameBtn = $("previewRename");
  if (previewRenameBtn) previewRenameBtn.addEventListener("click", previewRename);
  const previewDeleteBtn = $("previewDelete");
  if (previewDeleteBtn) previewDeleteBtn.addEventListener("click", previewDelete);

  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && $("previewBackdrop") && !$("previewBackdrop").hidden) closePreview();
  });
}

/* =========================================================
   Settings page setup
   ========================================================= */
function applyTheme() {
  const s = readSettings();
  let effective = s.theme;
  if (effective === "system") {
    effective = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.dataset.theme = effective;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", effective === "dark" ? "#0b1220" : "#2563EB");
}

function setupSettingsPage() {
  const themeGroup = $("themeSegmented");
  if (themeGroup) {
    themeGroup.querySelectorAll(".segment").forEach(btn => {
      btn.addEventListener("click", () => {
        themeGroup.querySelectorAll(".segment").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const s = readSettings();
        s.theme = btn.dataset.value;
        writeSettings(s);
        applyTheme();
      });
    });
  }

  const pf = $("setPhotoFormat");
  if (pf) pf.addEventListener("change", () => { const s = readSettings(); s.photoFormat = pf.value; writeSettings(s); });
  const pmkb = $("setPhotoMaxKB");
  if (pmkb) pmkb.addEventListener("input", () => { const s = readSettings(); s.photoMaxKB = Math.max(1, Number(pmkb.value) || 150); writeSettings(s); });
  const pq = $("setPhotoQuality");
  if (pq) pq.addEventListener("input", () => {
    const s = readSettings(); s.photoQuality = Number(pq.value); writeSettings(s);
    const out = $("setPhotoQualityValue"); if (out) out.textContent = pq.value;
  });

  const sf = $("setSignatureFormat");
  if (sf) sf.addEventListener("change", () => { const s = readSettings(); s.signatureFormat = sf.value; writeSettings(s); });
  const smkb = $("setSignatureMaxKB");
  if (smkb) smkb.addEventListener("input", () => { const s = readSettings(); s.signatureMaxKB = Math.max(1, Number(smkb.value) || 50); writeSettings(s); });

  const imf = $("setImageFormat");
  if (imf) imf.addEventListener("change", () => { const s = readSettings(); s.imageFormat = imf.value; writeSettings(s); });
  const imkb = $("setImageMaxKB");
  if (imkb) imkb.addEventListener("input", () => { const s = readSettings(); s.imageMaxKB = Math.max(0, Number(imkb.value) || 0); writeSettings(s); });
  const imq = $("setImageQuality");
  if (imq) imq.addEventListener("input", () => {
    const s = readSettings(); s.imageQuality = Number(imq.value); writeSettings(s);
    const out = $("setImageQualityValue"); if (out) out.textContent = imq.value;
  });

  const clearStats = $("clearStatsBtn");
  if (clearStats) clearStats.addEventListener("click", () => {
    if (!confirm("Clear all stats? This cannot be undone.")) return;
    localStorage.removeItem(STATS_KEY);
    renderStats();
    showToast("Stats cleared.");
  });

  const clearHistory = $("clearHistoryBtn");
  if (clearHistory) clearHistory.addEventListener("click", async () => {
    if (!confirm("Clear all history? This cannot be undone.")) return;
    await dbClear(STORE_HISTORY);
    renderHomeRecentFiles();
    showToast("History cleared.");
  });

  const clearFiles = $("clearFilesBtn");
  if (clearFiles) clearFiles.addEventListener("click", async () => {
    if (!confirm("Delete all files in My Files? This cannot be undone.")) return;
    await dbClear(STORE_FILES);
    showToast("My Files cleared.");
  });

  const clearAll = $("clearAllDataBtn");
  if (clearAll) clearAll.addEventListener("click", async () => {
    if (!confirm("Clear everything — stats, history and files? This cannot be undone.")) return;
    localStorage.removeItem(STATS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(LAST_USED_KEY);
    await dbClear(STORE_HISTORY);
    await dbClear(STORE_FILES);
    renderStats();
    applySettingsToUI();
    applyTheme();
    renderHomeRecentFiles();
    showToast("All data cleared.");
  });
}

/* =========================================================
   Feedback
   ========================================================= */
const FEEDBACK_EMAIL = "docfitfeedback@gmail.com";

function setupFeedback() {
  const sendBtn = $("feedbackSendBtn");
  const clearBtn = $("feedbackClearBtn");
  if (sendBtn) {
    sendBtn.addEventListener("click", () => {
      const type = $("feedbackType") ? $("feedbackType").value : "Idea";
      const msg = $("feedbackMessage") ? $("feedbackMessage").value.trim() : "";
      const email = $("feedbackEmail") ? $("feedbackEmail").value.trim() : "";
      if (!msg) { showToast("Please write your message first."); return; }
      const subject = encodeURIComponent(`[DocFit ${type}] Feedback`);
      const bodyLines = [`Type: ${type}`, "", "Message:", msg, ""];
      if (email) bodyLines.push(`Reply to: ${email}`);
      bodyLines.push("", "---", `Sent from DocFit (${location.host || "local"})`, `Time: ${new Date().toLocaleString()}`);
      const body = encodeURIComponent(bodyLines.join("\n"));
      window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
      showToast("Opening your email app…");
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if ($("feedbackMessage")) $("feedbackMessage").value = "";
      if ($("feedbackEmail")) $("feedbackEmail").value = "";
      if ($("feedbackType")) $("feedbackType").value = "Idea";
    });
  }
}

/* =========================================================
   Utility functions
   ========================================================= */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The selected file is not a valid image."));
    image.src = source;
  });
}

function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function canvasToBlob(canvas, type, quality = 0.9) {
  return new Promise(resolve => { canvas.toBlob(resolve, type, quality); });
}

function extensionForMime(type) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function showToast(message) {
  const toast = $("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => { toast.classList.remove("show"); }, 3500);
}

function setPreview(imageElement, emptyElement, source) {
  imageElement.src = source;
  imageElement.classList.remove("hidden");
  emptyElement.classList.add("hidden");
}

function clearPreview(imageElement, emptyElement) {
  imageElement.removeAttribute("src");
  imageElement.classList.add("hidden");
  emptyElement.classList.remove("hidden");
}

function setStatus(element, text, ready = false) {
  if (!element) return;
  element.textContent = text;
  element.classList.toggle("ready", ready);
}

function setFileCard(cardId, imageId, nameId, detailsId, file, source) {
  const card = $(cardId);
  if (card) card.classList.remove("hidden");
  const img = $(imageId);
  if (img) img.src = source;
  const nameEl = $(nameId);
  if (nameEl) nameEl.textContent = file.name;

  getImageDimensions(source)
    .then(({ width, height }) => {
      const el = $(detailsId);
      if (el) el.textContent = `${width} × ${height} px · ${formatBytes(file.size)}`;
    })
    .catch(() => {
      const el = $(detailsId);
      if (el) el.textContent = formatBytes(file.size);
    });
}

function hideFileCard(cardId) {
  const el = $(cardId);
  if (el) el.classList.add("hidden");
}

function getImageDimensions(source) {
  return loadImage(source).then(image => ({
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height
  }));
}

function applyBrightnessContrast(ctx, imageData, brightness, contrast) {
  const data = imageData.data;
  const brightnessAmount = (Number(brightness) / 100) * 255;
  const contrastAmount = Number(contrast);
  const contrastFactor = (259 * (contrastAmount + 255)) / (255 * (259 - contrastAmount));
  for (let index = 0; index < data.length; index += 4) {
    data[index] = clamp(contrastFactor * (data[index] - 128) + 128 + brightnessAmount);
    data[index + 1] = clamp(contrastFactor * (data[index + 1] - 128) + 128 + brightnessAmount);
    data[index + 2] = clamp(contrastFactor * (data[index + 2] - 128) + 128 + brightnessAmount);
  }
  ctx.putImageData(imageData, 0, 0);
}

function clamp(value) { return Math.max(0, Math.min(255, Math.round(value))); }

function fillBackground(ctx, width, height, background, customColor) {
  let color = "#ffffff";
  if (background === "lightGray") color = "#f3f4f6";
  if (background === "blue") color = "#dbeafe";
  if (background === "custom") color = customColor || "#ffffff";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
}

function rotateAndFitImage(image, targetWidth, targetHeight, rotation) {
  const radians = (Number(rotation) * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const rotatedWidth = Math.ceil(image.width * cos + image.height * sin);
  const rotatedHeight = Math.ceil(image.width * sin + image.height * cos);

  const rotatedCanvas = createCanvas(rotatedWidth, rotatedHeight);
  const rotatedContext = rotatedCanvas.getContext("2d");
  rotatedContext.translate(rotatedWidth / 2, rotatedHeight / 2);
  rotatedContext.rotate(radians);
  rotatedContext.drawImage(image, -image.width / 2, -image.height / 2);

  const scale = Math.min(targetWidth / rotatedWidth, targetHeight / rotatedHeight);
  return { canvas: rotatedCanvas, width: rotatedWidth * scale, height: rotatedHeight * scale };
}

function showResultActions(actionsId) {
  const el = $(actionsId);
  if (el) el.classList.remove("hidden");
}
function hideResultActions(actionsId) {
  const el = $(actionsId);
  if (el) el.classList.add("hidden");
}

function makeDownloadButton(buttonId, blob, fileName) {
  const button = $(buttonId);
  if (!button) return;
  button.onclick = () => triggerBlobDownload(blob, fileName);
}

async function compressBlobToLimit(canvas, mimeType, initialQuality, maxSizeKB) {
  let quality = Number(initialQuality) || 0.9;
  let blob = await canvasToBlob(canvas, mimeType, quality);
  if (!blob) throw new Error("The browser could not create the output image.");
  const maximumBytes = Number(maxSizeKB) * 1024;
  for (let attempt = 0; attempt < 10; attempt++) {
    if (mimeType === "image/png") break;
    if (blob.size <= maximumBytes) break;
    quality = Math.max(0.15, quality - 0.08);
    blob = await canvasToBlob(canvas, mimeType, quality);
  }
  return blob;
}

function attachFilePicker({ inputId, browseButtonId, dropZoneId, onFile }) {
  const input = $(inputId);
  const browseButton = $(browseButtonId);
  const dropZone = $(dropZoneId);
  if (!input || !dropZone) return;
  if (browseButton) {
    browseButton.addEventListener("click", event => {
      event.stopPropagation();
      input.click();
    });
  }
  dropZone.addEventListener("click", event => {
    if (event.target.closest("button")) return;
    input.click();
  });
  input.addEventListener("change", () => {
    const file = input.files[0];
    if (file) onFile(file);
  });
  ["dragenter", "dragover"].forEach(eventName => {
    dropZone.addEventListener(eventName, event => {
      event.preventDefault();
      dropZone.classList.add("dragover");
    });
  });
  ["dragleave", "drop"].forEach(eventName => {
    dropZone.addEventListener(eventName, event => {
      event.preventDefault();
      dropZone.classList.remove("dragover");
    });
  });
  dropZone.addEventListener("drop", event => {
    const file = event.dataTransfer.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file.");
      return;
    }
    input.files = event.dataTransfer.files;
    onFile(file);
  });
}

function setupRangeValue(rangeId, outputId) {
  const range = $(rangeId);
  const output = $(outputId);
  if (!range || !output) return;
  const update = () => { output.textContent = range.value; };
  range.addEventListener("input", update);
  update();
}

/* =========================================================
   Quick Preset chips
   ========================================================= */
function setupQuickPresets() {
  const container = $("quickPresets");
  if (!container) return;

  container.querySelectorAll("[data-quick]").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.quick;
      goToHome();
      setTimeout(() => {
        switch (action) {
          case "passport": {
            const sec = document.querySelector("#photo-tools");
            if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
            const w = $("photoWidth"); const h = $("photoHeight");
            const p = $("photoPreset");
            if (w) w.value = 350;
            if (h) h.value = 350;
            if (p) p.value = "passport";
            showToast("Photo tool ready for a 350 × 350 passport photo.");
            break;
          }
          case "signature": {
            const sec = document.querySelector("#signature-tools");
            if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
            const w = $("signatureWidth"); const h = $("signatureHeight");
            if (w) w.value = 200;
            if (h) h.value = 80;
            showToast("Signature tool set to 200 × 80.");
            break;
          }
          case "compress100": {
            const sec = document.querySelector("#image-tools");
            if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
            const kb = $("compressTargetSize");
            if (kb) kb.value = 100;
            showToast("Target set to 100 KB. Upload an image to compress.");
            break;
          }
          case "png": {
            const sec = document.querySelector("#image-tools");
            if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
            const fmt = $("imageOutputFormat");
            if (fmt) fmt.value = "image/png";
            showToast("Output set to PNG. Upload an image to convert.");
            break;
          }
          case "half": {
            const sec = document.querySelector("#image-tools");
            if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
            const pct = $("imagePercent");
            const seg = document.querySelectorAll("#imageResizeModeSegmented .segment");
            seg.forEach(s => s.classList.remove("active"));
            const percSeg = document.querySelector('#imageResizeModeSegmented [data-value="percentage"]');
            if (percSeg) percSeg.classList.add("active");
            const pixGrid = $("imageResizePixels");
            const perGrid = $("imageResizePercent");
            if (pixGrid) pixGrid.classList.add("hidden");
            if (perGrid) perGrid.classList.remove("hidden");
            if (pct) pct.value = 50;
            showToast("Resize set to 50%. Upload an image.");
            break;
          }
        }
      }, 120);
    });
  });
}

function goToHome() {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  const home = $("view-home");
  if (home) home.classList.remove("hidden");
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  const navEl = document.querySelector('.nav-item[data-nav="home"]');
  if (navEl) navEl.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* =========================================================
   PHOTO
   ========================================================= */
function setupPhoto() {
  attachFilePicker({
    inputId: "photoFile",
    browseButtonId: "photoBrowseBtn",
    dropZoneId: "photoDropZone",
    onFile: async file => {
      try {
        state.photo.file = file;
        state.photo.originalUrl = await fileToDataUrl(file);
        setFileCard("photoFileCard", "photoOriginalPreview", "photoFileName", "photoFileDetails", file, state.photo.originalUrl);

        const beforeImg = $("photoBeforeImg");
        const beforeEmpty = $("photoBeforeEmpty");
        if (beforeImg && beforeEmpty) setPreview(beforeImg, beforeEmpty, state.photo.originalUrl);

        getImageDimensions(state.photo.originalUrl).then(({ width, height }) => {
          const meta = $("photoBeforeMeta");
          if (meta) meta.textContent = `${width} × ${height} px · ${formatBytes(file.size)}`;
        });

        const meta = $("photoMeta");
        if (meta) meta.textContent = "Original loaded. Adjust settings and click Process photo.";

        setStatus($("photoPreviewStatus"), "Ready");
        showToast("Photo loaded. Preview is ready.");
      } catch (error) {
        showToast(error.message);
      }
    }
  });

  const presetEl = $("photoPreset");
  if (presetEl) {
    presetEl.addEventListener("change", event => {
      const presets = {
        passport: [350, 350],
        government: [350, 350],
        job: [300, 300],
        college: [350, 350]
      };
      const selected = presets[event.target.value];
      if (!selected) return;
      $("photoWidth").value = selected[0];
      $("photoHeight").value = selected[1];
    });
  }

  const processBtn = $("photoProcessBtn");
  if (processBtn) processBtn.addEventListener("click", processPhoto);
  const removeBtn = $("photoRemoveBtn");
  if (removeBtn) removeBtn.addEventListener("click", resetPhoto);
  const resetBtn = $("photoResetBtn");
  if (resetBtn) resetBtn.addEventListener("click", resetPhoto);

  const copyBtn = $("photoCopyBtn");
  if (copyBtn) copyBtn.addEventListener("click", () => {
    if (state.photo.processedBlob) copyBlobToClipboard(state.photo.processedBlob);
  });
  const shareBtn = $("photoShareBtn");
  if (shareBtn) shareBtn.addEventListener("click", () => {
    if (state.photo.processedBlob) shareBlob(state.photo.processedBlob, `docfit-photo-${Date.now()}.jpg`);
  });

  setupRangeValue("photoBrightness", "photoBrightnessValue");
  setupRangeValue("photoContrast", "photoContrastValue");
  setupRangeValue("photoQuality", "photoQualityValue");
}

async function processPhoto() {
  if (!state.photo.file) { showToast("Please upload a photo first."); return; }

  try {
    const width = Math.max(20, Number($("photoWidth").value) || 350);
    const height = Math.max(20, Number($("photoHeight").value) || 350);
    const background = $("photoBackground").value;
    const customColor = $("photoCustomBg").value;
    const format = $("photoFormat").value;
    const maxSizeKB = Math.max(1, Number($("photoMaxSizeKB").value) || 150);
    const brightness = Number($("photoBrightness").value) || 0;
    const contrast = Number($("photoContrast").value) || 0;
    const qualitySlider = $("photoQuality");
    const userQuality = qualitySlider ? Math.max(0.4, Number(qualitySlider.value) / 100) : 0.92;

    setStatus($("photoPreviewStatus"), "Processing…");

    const image = await loadImage(state.photo.originalUrl);
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");

    fillBackground(context, width, height, background, customColor);
    const fitted = rotateAndFitImage(image, width - 10, height - 10, 0);
    const x = (width - fitted.width) / 2;
    const y = (height - fitted.height) / 2;
    context.drawImage(fitted.canvas, x, y, fitted.width, fitted.height);

    const imageData = context.getImageData(0, 0, width, height);
    applyBrightnessContrast(context, imageData, brightness, contrast);

    const blob = await compressBlobToLimit(canvas, format, userQuality, maxSizeKB);

    state.photo.processedBlob = blob;
    state.photo.processedUrl = URL.createObjectURL(blob);

    setPreview($("photoPreview"), $("photoAfterEmpty"), state.photo.processedUrl);

    const meta = $("photoMeta");
    if (meta) meta.textContent = `Final: ${width} × ${height} px · ${formatBytes(blob.size)} · ${format.split("/")[1].toUpperCase()}`;

    setStatus($("photoPreviewStatus"), "Ready", true);

    const filename = `docfit-photo-${Date.now()}.${extensionForMime(format)}`;
    makeDownloadButton("photoDownloadBtn", blob, filename);
    showResultActions("photoResultActions");
    incrementStat("photos");

    saveLastUsed("photo", readCurrentPhotoSettings());

    await saveToHistory({
      type: "photo", filename, processedBlob: blob, originalUrl: state.photo.originalUrl,
      format, width, height, originalSize: state.photo.file.size, finalSize: blob.size
    });

    showToast("Photo processed successfully.");
  } catch (error) {
    console.error(error);
    setStatus($("photoPreviewStatus"), "Error");
    showToast("The photo could not be processed.");
  }
}

function resetPhoto() {
  const fileInput = $("photoFile");
  if (fileInput) fileInput.value = "";
  state.photo.file = null;
  state.photo.originalUrl = null;
  state.photo.processedBlob = null;

  hideFileCard("photoFileCard");
  const beforeImg = $("photoBeforeImg");
  const beforeEmpty = $("photoBeforeEmpty");
  if (beforeImg && beforeEmpty) clearPreview(beforeImg, beforeEmpty);
  clearPreview($("photoPreview"), $("photoAfterEmpty"));

  const beforeMeta = $("photoBeforeMeta");
  if (beforeMeta) beforeMeta.textContent = "—";
  const meta = $("photoMeta");
  if (meta) meta.textContent = "Upload a photo to begin.";
  hideResultActions("photoResultActions");
  setStatus($("photoPreviewStatus"), "Waiting");
}

/* =========================================================
   SIGNATURE
   ========================================================= */
function setupSignature() {
  attachFilePicker({
    inputId: "signatureFile",
    browseButtonId: "signatureBrowseBtn",
    dropZoneId: "signatureDropZone",
    onFile: async file => {
      try {
        state.signature.file = file;
        state.signature.originalUrl = await fileToDataUrl(file);

        setFileCard("signatureFileCard", "signatureOriginalPreview", "signatureFileName", "signatureFileDetails", file, state.signature.originalUrl);

        const beforeImg = $("signatureBeforeImg");
        const beforeEmpty = $("signatureBeforeEmpty");
        if (beforeImg && beforeEmpty) setPreview(beforeImg, beforeEmpty, state.signature.originalUrl);

        getImageDimensions(state.signature.originalUrl).then(({ width, height }) => {
          const meta = $("signatureBeforeMeta");
          if (meta) meta.textContent = `${width} × ${height} px · ${formatBytes(file.size)}`;
        });

        const meta = $("signatureMeta");
        if (meta) meta.textContent = "Original loaded. Pick a size and click Resize Signature.";

        setStatus($("signaturePreviewStatus"), "Ready");
        showToast("Signature loaded. Preview is ready.");
      } catch (error) {
        showToast(error.message);
      }
    }
  });

  const processBtn = $("signatureProcessBtn");
  if (processBtn) processBtn.addEventListener("click", processSignature);
  const removeBtn = $("signatureRemoveBtn");
  if (removeBtn) removeBtn.addEventListener("click", resetSignature);
  const resetBtn = $("signatureResetBtn");
  if (resetBtn) resetBtn.addEventListener("click", resetSignature);

  const copyBtn = $("signatureCopyBtn");
  if (copyBtn) copyBtn.addEventListener("click", () => {
    if (state.signature.processedBlob) copyBlobToClipboard(state.signature.processedBlob);
  });
  const shareBtn = $("signatureShareBtn");
  if (shareBtn) shareBtn.addEventListener("click", () => {
    if (state.signature.processedBlob) shareBlob(state.signature.processedBlob, `docfit-signature-${Date.now()}.png`);
  });
}

function drawSignatureFill(context, image, canvasWidth, canvasHeight) {
  const scale = Math.min(canvasWidth / image.width, canvasHeight / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const x = (canvasWidth - drawWidth) / 2;
  const y = (canvasHeight - drawHeight) / 2;
  context.drawImage(image, x, y, drawWidth, drawHeight);
}

function softBackgroundRemoval(context, canvasWidth, canvasHeight, bgValue, threshold) {
  const imageData = context.getImageData(0, 0, canvasWidth, canvasHeight);
  const pixels = imageData.data;
  const nearlyWhite = Math.min(254, Math.max(200, threshold));
  const fadeStart = Math.max(180, nearlyWhite - 30);
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
    if (a === 0) continue;
    const minChannel = Math.min(r, g, b);
    if (minChannel >= nearlyWhite) {
      if (bgValue === "transparent") pixels[i + 3] = 0;
      else { pixels[i] = 255; pixels[i + 1] = 255; pixels[i + 2] = 255; pixels[i + 3] = 255; }
      continue;
    }
    if (minChannel > fadeStart) {
      const t = (minChannel - fadeStart) / (nearlyWhite - fadeStart);
      if (bgValue === "transparent") pixels[i + 3] = Math.round(a * (1 - t));
      else {
        pixels[i]     = Math.round(r + (255 - r) * t);
        pixels[i + 1] = Math.round(g + (255 - g) * t);
        pixels[i + 2] = Math.round(b + (255 - b) * t);
      }
    }
  }
  context.putImageData(imageData, 0, 0);
}

async function processSignature() {
  if (!state.signature.file) { showToast("Please upload a signature first."); return; }
  try {
    const width = Math.max(20, Number($("signatureWidth").value) || 200);
    const height = Math.max(20, Number($("signatureHeight").value) || 80);
    const format = $("signatureFormat").value;
    const maxSizeKB = Math.max(1, Number($("signatureMaxSizeKB").value) || 50);
    const removeBg = $("signatureRemoveBg") && $("signatureRemoveBg").checked;
    const bgValue = $("signatureBackground") ? $("signatureBackground").value : "white";
    const threshold = Math.min(254, Math.max(180, Number($("signatureThreshold") && $("signatureThreshold").value) || 240));

    setStatus($("signaturePreviewStatus"), "Processing…");

    const image = await loadImage(state.signature.originalUrl);
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");

    if (removeBg && bgValue === "transparent") context.clearRect(0, 0, width, height);
    else { context.fillStyle = "#ffffff"; context.fillRect(0, 0, width, height); }

    drawSignatureFill(context, image, width, height);
    if (removeBg) softBackgroundRemoval(context, width, height, bgValue, threshold);

    let blob = await canvasToBlob(canvas, format, 0.95);
    if (!blob) throw new Error("The browser could not create the output image.");
    const limitBytes = maxSizeKB * 1024;
    if (format !== "image/png" && blob.size > limitBytes) {
      blob = await compressBlobToLimit(canvas, format, 0.95, maxSizeKB);
    }

    state.signature.processedBlob = blob;
    state.signature.processedUrl = URL.createObjectURL(blob);

    setPreview($("signaturePreview"), $("signatureEmptyPreview"), state.signature.processedUrl);

    const meta = $("signatureMeta");
    if (meta) meta.textContent = `Final: ${width} × ${height} px · ${formatBytes(blob.size)} · ${format.split("/")[1].toUpperCase()}`;

    setStatus($("signaturePreviewStatus"), "Ready", true);

    const filename = `docfit-signature-${Date.now()}.${extensionForMime(format)}`;
    makeDownloadButton("signatureDownloadBtn", blob, filename);
    showResultActions("signatureResultActions");
    incrementStat("signatures");

    saveLastUsed("signature", readCurrentSignatureSettings());

    await saveToHistory({
      type: "signature", filename, processedBlob: blob, originalUrl: state.signature.originalUrl,
      format, width, height, originalSize: state.signature.file.size, finalSize: blob.size
    });
    showToast("Signature processed successfully.");
  } catch (error) {
    console.error(error);
    setStatus($("signaturePreviewStatus"), "Error");
    showToast("The signature could not be processed.");
  }
}

function resetSignature() {
  const fileInput = $("signatureFile");
  if (fileInput) fileInput.value = "";
  state.signature.file = null;
  state.signature.originalUrl = null;
  state.signature.processedBlob = null;

  hideFileCard("signatureFileCard");
  const beforeImg = $("signatureBeforeImg");
  const beforeEmpty = $("signatureBeforeEmpty");
  if (beforeImg && beforeEmpty) clearPreview(beforeImg, beforeEmpty);
  clearPreview($("signaturePreview"), $("signatureEmptyPreview"));

  const beforeMeta = $("signatureBeforeMeta");
  if (beforeMeta) beforeMeta.textContent = "—";
  const meta = $("signatureMeta");
  if (meta) meta.textContent = "Upload a signature to begin.";
  hideResultActions("signatureResultActions");
  setStatus($("signaturePreviewStatus"), "Waiting");
}

/* =========================================================
   IMAGE
   ========================================================= */
const cropState = {
  active: false,
  interaction: "idle",
  handle: null,
  startPointer: { x: 0, y: 0 },
  startBox: { x: 0, y: 0, w: 0, h: 0 },
  box: null,
  bounds: { w: 0, h: 0 }
};

function setupImageTools() {
  attachFilePicker({
    inputId: "imageFile",
    browseButtonId: "imageBrowseBtn",
    dropZoneId: "imageDropZone",
    onFile: async file => {
      try {
        state.image.file = file;
        state.image.originalUrl = await fileToDataUrl(file);
        state.image.workingUrl = null;

        setFileCard("imageFileCard", "imageOriginalPreview", "imageFileName", "imageFileDetails", file, state.image.originalUrl);

        const beforeImg = $("imageBeforeImg");
        const beforeEmpty = $("imageBeforeEmpty");
        if (beforeImg && beforeEmpty) setPreview(beforeImg, beforeEmpty, state.image.originalUrl);

        getImageDimensions(state.image.originalUrl).then(({ width, height }) => {
          const meta = $("imageBeforeMeta");
          if (meta) meta.textContent = `${width} × ${height} px · ${formatBytes(file.size)}`;
          const wEl = $("imageWidth"); const hEl = $("imageHeight");
          if (wEl && (!wEl.value || wEl.value === "1200")) wEl.value = width;
          if (hEl && (!hEl.value || hEl.value === "1200")) hEl.value = height;
        });

        const cropToggle = $("cropToggleBtn");
        if (cropToggle) cropToggle.classList.remove("hidden");

        const info = $("imageInfo");
        if (info) info.textContent = "Original loaded. Adjust settings and click Process image.";

        setStatus($("imagePreviewStatus"), "Ready");
        showToast("Image loaded. Preview is ready.");
      } catch (error) {
        showToast(error.message);
      }
    }
  });

  const processBtn = $("imageProcessBtn");
  if (processBtn) processBtn.addEventListener("click", processImage);
  const removeBtn = $("imageRemoveBtn");
  if (removeBtn) removeBtn.addEventListener("click", resetImage);
  const resetBtn = $("imageResetBtn");
  if (resetBtn) resetBtn.addEventListener("click", resetImage);

  const copyBtn = $("imageCopyBtn");
  if (copyBtn) copyBtn.addEventListener("click", () => {
    if (state.image.processedBlob) copyBlobToClipboard(state.image.processedBlob);
  });
  const shareBtn = $("imageShareBtn");
  if (shareBtn) shareBtn.addEventListener("click", () => {
    if (state.image.processedBlob) shareBlob(state.image.processedBlob, `docfit-image-${Date.now()}.jpg`);
  });

  setupRangeValue("imageQuality", "imageQualityValue");

  const cropToggle = $("cropToggleBtn");
  if (cropToggle) cropToggle.addEventListener("click", toggleCropMode);

  const cropBox = $("cropBox");
  if (cropBox && !cropBox.querySelector(".crop-handle-edge")) {
    ["n", "s", "e", "w"].forEach(dir => {
      const h = document.createElement("span");
      h.className = `crop-handle-edge crop-handle-${dir}`;
      h.dataset.handle = dir;
      cropBox.appendChild(h);
    });
    cropBox.querySelector(".crop-handle-tl").dataset.handle = "nw";
    cropBox.querySelector(".crop-handle-tr").dataset.handle = "ne";
    cropBox.querySelector(".crop-handle-bl").dataset.handle = "sw";
    cropBox.querySelector(".crop-handle-br").dataset.handle = "se";
  }

  const overlay = $("cropOverlay");
  if (overlay) {
    overlay.addEventListener("mousedown", onOverlayPointerDown);
    overlay.addEventListener("touchstart", onOverlayPointerDown, { passive: false });
  }
  window.addEventListener("mousemove", onGlobalPointerMove);
  window.addEventListener("touchmove", onGlobalPointerMove, { passive: false });
  window.addEventListener("mouseup", onGlobalPointerUp);
  window.addEventListener("touchend", onGlobalPointerUp);
  window.addEventListener("touchcancel", onGlobalPointerUp);

  const cropApply = $("cropApplyBtn");
  if (cropApply) cropApply.addEventListener("click", applyCrop);
  const cropReset = $("cropResetBtn");
  if (cropReset) cropReset.addEventListener("click", resetCropSelection);
}

function toggleCropMode() {
  if (!state.image.originalUrl) { showToast("Please upload an image first."); return; }
  cropState.active = !cropState.active;
  const overlay = $("cropOverlay"), controls = $("cropControls"), toggleBtn = $("cropToggleBtn");
  if (cropState.active) {
    overlay.classList.remove("hidden");
    controls.classList.remove("hidden");
    if (toggleBtn) toggleBtn.classList.add("active");
    const frame = $("imageBeforeFrame");
    if (frame) {
      const rect = frame.getBoundingClientRect();
      cropState.bounds = { w: rect.width - 24, h: rect.height - 24 };
    }
    resetCropSelection();
  } else {
    overlay.classList.add("hidden");
    controls.classList.add("hidden");
    if (toggleBtn) toggleBtn.classList.remove("active");
    resetCropSelection();
  }
}

function getPointerPoint(e) {
  if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  return { x: e.clientX, y: e.clientY };
}

function getOverlayLocalPoint(e) {
  const overlay = $("cropOverlay");
  const rect = overlay.getBoundingClientRect();
  const p = getPointerPoint(e);
  return {
    x: Math.max(0, Math.min(rect.width, p.x - rect.left)),
    y: Math.max(0, Math.min(rect.height, p.y - rect.top))
  };
}

function onOverlayPointerDown(e) {
  if (!cropState.active) return;
  const target = e.target;
  if (target && target.dataset && target.dataset.handle) {
    cropState.interaction = "resizing";
    cropState.handle = target.dataset.handle;
    cropState.startPointer = getOverlayLocalPoint(e);
    cropState.startBox = { ...cropState.box };
    e.preventDefault(); return;
  }
  const insideBox = cropState.box && target && target.classList && target.classList.contains("crop-box");
  if (insideBox) {
    cropState.interaction = "moving";
    cropState.startPointer = getOverlayLocalPoint(e);
    cropState.startBox = { ...cropState.box };
    e.preventDefault(); return;
  }
  const p = getOverlayLocalPoint(e);
  cropState.interaction = "drawing";
  cropState.startPointer = p;
  cropState.box = { x: p.x, y: p.y, w: 0, h: 0 };
  updateCropBoxUI();
  e.preventDefault();
}

function onGlobalPointerMove(e) {
  if (!cropState.active) return;
  if (cropState.interaction === "idle") return;
  const p = getOverlayLocalPoint(e);
  const b = cropState.bounds;
  if (cropState.interaction === "drawing") {
    const start = cropState.startPointer;
    cropState.box = {
      x: Math.min(start.x, p.x), y: Math.min(start.y, p.y),
      w: Math.abs(p.x - start.x), h: Math.abs(p.y - start.y)
    };
  } else if (cropState.interaction === "moving") {
    const start = cropState.startPointer, startBox = cropState.startBox;
    let nx = startBox.x + (p.x - start.x);
    let ny = startBox.y + (p.y - start.y);
    nx = Math.max(0, Math.min(b.w - startBox.w, nx));
    ny = Math.max(0, Math.min(b.h - startBox.h, ny));
    cropState.box = { x: nx, y: ny, w: startBox.w, h: startBox.h };
  } else if (cropState.interaction === "resizing") {
    const startBox = cropState.startBox, handle = cropState.handle;
    let { x, y, w, h } = startBox;
    const right = x + w, bottom = y + h, MIN = 20;
    if (handle.includes("n")) { const nY = Math.max(0, Math.min(bottom - MIN, p.y)); y = nY; h = bottom - nY; }
    if (handle.includes("s")) { const nB = Math.min(b.h, Math.max(y + MIN, p.y)); h = nB - y; }
    if (handle.includes("w")) { const nX = Math.max(0, Math.min(right - MIN, p.x)); x = nX; w = right - nX; }
    if (handle.includes("e")) { const nR = Math.min(b.w, Math.max(x + MIN, p.x)); w = nR - x; }
    cropState.box = { x, y, w, h };
  }
  updateCropBoxUI();
  e.preventDefault();
}

function onGlobalPointerUp() {
  if (!cropState.active) return;
  if (cropState.interaction === "idle") return;
  cropState.interaction = "idle";
  cropState.handle = null;
  const applyBtn = $("cropApplyBtn");
  const box = cropState.box;
  if (applyBtn) applyBtn.disabled = !(box && box.w >= 20 && box.h >= 20);
}

function updateCropBoxUI() {
  const boxEl = $("cropBox"), box = cropState.box;
  if (!boxEl) return;
  if (!box || box.w < 1 || box.h < 1) {
    boxEl.style.opacity = "0";
    boxEl.style.left = "0px"; boxEl.style.top = "0px";
    boxEl.style.width = "0px"; boxEl.style.height = "0px";
    return;
  }
  boxEl.style.opacity = "1";
  boxEl.style.left = box.x + "px"; boxEl.style.top = box.y + "px";
  boxEl.style.width = box.w + "px"; boxEl.style.height = box.h + "px";
}

function resetCropSelection() {
  cropState.box = null;
  cropState.interaction = "idle";
  cropState.handle = null;
  updateCropBoxUI();
  const applyBtn = $("cropApplyBtn");
  if (applyBtn) applyBtn.disabled = true;
}

async function applyCrop() {
  if (!cropState.box || cropState.box.w < 20 || cropState.box.h < 20) {
    showToast("Please drag to select a crop area first."); return;
  }
  const PAD = 12;
  const boxInFrame = { x: cropState.box.x + PAD, y: cropState.box.y + PAD, w: cropState.box.w, h: cropState.box.h };
  const frame = $("imageBeforeFrame"), img = $("imageBeforeImg");
  if (!frame || !img) return;
  const frameRect = frame.getBoundingClientRect(), imgRect = img.getBoundingClientRect();
  const offsetX = imgRect.left - frameRect.left, offsetY = imgRect.top - frameRect.top;
  const dispX = boxInFrame.x - offsetX, dispY = boxInFrame.y - offsetY;
  const dispW = imgRect.width, dispH = imgRect.height;
  const cx = Math.max(0, Math.min(dispW, dispX)), cy = Math.max(0, Math.min(dispH, dispY));
  const cw = Math.max(0, Math.min(dispW - cx, boxInFrame.w));
  const ch = Math.max(0, Math.min(dispH - cy, boxInFrame.h));

  const source = state.image.originalUrl;
  const nat = await getImageDimensions(source);
  const scaleX = nat.width / dispW, scaleY = nat.height / dispH;
  const sx = Math.round(cx * scaleX), sy = Math.round(cy * scaleY);
  const sw = Math.round(cw * scaleX), sh = Math.round(ch * scaleY);

  try {
    const image = await loadImage(source);
    const canvas = createCanvas(sw, sh);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);

    const blob = await canvasToBlob(canvas, "image/png", 1);
    if (!blob) throw new Error("Crop failed.");
    state.image.workingUrl = URL.createObjectURL(blob);

    const beforeImg = $("imageBeforeImg");
    const beforeEmpty = $("imageBeforeEmpty");
    if (beforeImg && beforeEmpty) setPreview(beforeImg, beforeEmpty, state.image.workingUrl);

    const meta = $("imageBeforeMeta");
    if (meta) meta.textContent = `Cropped: ${sw} × ${sh} px`;
    const wEl = $("imageWidth"), hEl = $("imageHeight");
    if (wEl) wEl.value = sw;
    if (hEl) hEl.value = sh;

    toggleCropMode();
    showToast(`Crop applied: ${sw} × ${sh} px. Click Process image to finish.`);
  } catch (error) {
    console.error(error);
    showToast("Could not apply crop.");
  }
}

function getWorkingSource() { return state.image.workingUrl || state.image.originalUrl; }

async function createImageCanvas() {
  const source = getWorkingSource();
  const image = await loadImage(source);
  const resizeMode = document.querySelector("#imageResizeModeSegmented .segment.active");
  const mode = resizeMode ? resizeMode.dataset.value : "pixels";
  let width, height;
  if (mode === "percentage") {
    const pct = Math.max(5, Math.min(100, Number($("imagePercent").value) || 75)) / 100;
    width = Math.max(20, Math.round(image.width * pct));
    height = Math.max(20, Math.round(image.height * pct));
  } else {
    width = Math.max(20, Number($("imageWidth").value) || image.width);
    height = Math.max(20, Number($("imageHeight").value) || image.height);
  }
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  const scale = Math.min(width / image.width, height / image.height);
  const drawWidth = image.width * scale, drawHeight = image.height * scale;
  const drawX = (width - drawWidth) / 2, drawY = (height - drawHeight) / 2;
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  return canvas;
}

async function processImage() {
  if (!state.image.file) { showToast("Please upload an image first."); return; }
  try {
    setStatus($("imagePreviewStatus"), "Processing…");
    const canvas = await createImageCanvas();
    const format = $("imageOutputFormat").value;
    const qualitySlider = $("imageQuality");
    const userQuality = qualitySlider ? Math.max(0.4, Number(qualitySlider.value) / 100) : 0.85;
    const targetKB = Math.max(0, Number($("compressTargetSize").value) || 0);
    let blob;
    if (targetKB > 0 && format !== "image/png") blob = await compressBlobToLimit(canvas, format, userQuality, targetKB);
    else blob = await canvasToBlob(canvas, format, userQuality);
    if (!blob) throw new Error("The browser could not create the output image.");

    state.image.processedBlob = blob;
    state.image.processedUrl = URL.createObjectURL(blob);

    setPreview($("imagePreview"), $("imageAfterEmpty"), state.image.processedUrl);

    const info = $("imageInfo");
    if (info) info.textContent = `Final: ${canvas.width} × ${canvas.height} px · ${formatBytes(blob.size)} · ${format.split("/")[1].toUpperCase()}`;

    setStatus($("imagePreviewStatus"), "Ready", true);

    const filename = `docfit-image-${Date.now()}.${extensionForMime(format)}`;
    makeDownloadButton("imageDownloadBtn", blob, filename);
    showResultActions("imageResultActions");
    incrementStat("images");

    saveLastUsed("image", readCurrentImageSettings());

    await saveToHistory({
      type: "image", filename, processedBlob: blob, originalUrl: getWorkingSource(),
      format, width: canvas.width, height: canvas.height,
      originalSize: state.image.file.size, finalSize: blob.size
    });
    showToast("Image processed successfully.");
  } catch (error) {
    console.error(error);
    setStatus($("imagePreviewStatus"), "Error");
    showToast("The image could not be processed.");
  }
}

function resetImage() {
  const fileInput = $("imageFile");
  if (fileInput) fileInput.value = "";
  state.image.file = null;
  state.image.originalUrl = null;
  state.image.workingUrl = null;
  state.image.processedBlob = null;

  hideFileCard("imageFileCard");
  const beforeImg = $("imageBeforeImg");
  const beforeEmpty = $("imageBeforeEmpty");
  if (beforeImg && beforeEmpty) clearPreview(beforeImg, beforeEmpty);
  clearPreview($("imagePreview"), $("imageAfterEmpty"));

  const beforeMeta = $("imageBeforeMeta");
  if (beforeMeta) beforeMeta.textContent = "—";
  const info = $("imageInfo");
  if (info) info.textContent = "Upload an image to begin.";
  hideResultActions("imageResultActions");

  cropState.active = false;
  resetCropSelection();
  const overlay = $("cropOverlay");
  if (overlay) overlay.classList.add("hidden");
  const controls = $("cropControls");
  if (controls) controls.classList.add("hidden");
  const toggleBtn = $("cropToggleBtn");
  if (toggleBtn) { toggleBtn.classList.remove("active"); toggleBtn.classList.add("hidden"); }

  setStatus($("imagePreviewStatus"), "Waiting");
}

/* =========================================================
   Navigation + view switching
   ========================================================= */
function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const views = {
    home: $("view-home"),
    history: $("view-history"),
    files: $("view-files"),
    settings: $("view-settings"),
    help: $("view-help")
  };

  async function showView(name) {
    Object.keys(views).forEach(k => {
      if (views[k]) views[k].classList.toggle("hidden", k !== name);
    });
    if (name === "history") await renderHistoryPage();
    else if (name === "files") {
      await ensureDefaultFolders();
      await renderFolders();
      await renderFilesPage();
    }
    else if (name === "settings") applySettingsToUI();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.querySelectorAll("[data-nav]").forEach(el => {
    el.addEventListener("click", e => {
      const target = el.dataset.nav || "home";
      if (el.getAttribute("href") && el.getAttribute("href").startsWith("#")) {
        e.preventDefault();
        showView(target);
        const hash = el.getAttribute("href");
        if (target === "home" && hash && hash !== "#home" && hash !== "#history" && hash !== "#my-files") {
          setTimeout(() => {
            const section = document.querySelector(hash);
            if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 30);
        }
        navItems.forEach(n => n.classList.remove("active"));
        el.classList.add("active");
      }
    });
  });
}

/* =========================================================
   Init
   ========================================================= */
async function init() {
  applyTheme();
  renderStats();
  applyDefaultsToTools();
  restoreLastUsed();
  applySettingsToUI();

  setupPhoto();
  setupSignature();
  setupImageTools();
  setupHistoryPage();
  setupFilesPage();
  setupSettingsPage();
  setupFeedback();
  setupNavigation();
  setupQuickPresets();
  setupGlobalPaste();
  setupShortcuts();

  try { await ensureDefaultFolders(); } catch (err) { console.warn(err); }
  try { await renderHomeRecentFiles(); } catch (err) { console.warn(err); }
}

function setupHistoryPage() {
  document.querySelectorAll(".history-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".history-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentHistoryFilter = tab.dataset.filter || "all";
      renderHistoryPage();
    });
  });
  const clearBtn = $("historyClearAllBtn");
  if (clearBtn) clearBtn.addEventListener("click", clearAllHistory);
}

if (window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
    const s = readSettings();
    if (s.theme === "system") applyTheme();
  });
}

init();