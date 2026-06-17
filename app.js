// ──────────────────────────────────────────────────────────
// USERS — edit this list to add/remove/change operators
// ──────────────────────────────────────────────────────────
const USERS = {
  "Hari": "Hari@98957",
  "Aditya": "Adi89877",
  "Panti": "Panti656852",
  "Ravindra": "Ravi58978",
  "Surjit": "Surjit55987",
  "Salman": "Salman@989325",
  "Priya": "Priya@56674",
  "Nikita": "Nicks25778",
  "Abhishek": "Abhi@225",
  "Shakti": "Shakri@998",
  "Meet": "Meet@65",
  "Shivam": "Shivam@689"
};

// ──────────────────────────────────────────────────────────
// State
// ──────────────────────────────────────────────────────────
const state = {
  user: null,
  rack: "",
  sku: "",          // SKU as stored in the sheet (original casing)
  imageUrl: "",
  skuMap: new Map(),// normalized SKU -> { sku, imageUrl }
  scanTarget: null, // "rack" | "sku"
  html5QrCode: null
};

// ──────────────────────────────────────────────────────────
// DOM references
// ──────────────────────────────────────────────────────────
const el = (id) => document.getElementById(id);

const loginScreen = el("loginScreen");
const appScreen = el("appScreen");
const loginForm = el("loginForm");
const loginUser = el("loginUser");
const loginPass = el("loginPass");
const loginError = el("loginError");
const userName = el("userName");
const logoutBtn = el("logoutBtn");

const trackRack = el("trackRack");
const trackSku = el("trackSku");
const trackQty = el("trackQty");

const rackCard = el("rackCard");
const rackDisplay = el("rackDisplay");
const rackInput = el("rackInput");
const scanRackBtn = el("scanRackBtn");
const confirmRackBtn = el("confirmRackBtn");
const rackBanner = el("rackBanner");
const rackBannerValue = el("rackBannerValue");
const changeRackBtn = el("changeRackBtn");

const skuCard = el("skuCard");
const skuInput = el("skuInput");
const skuSuggestions = el("skuSuggestions");
const scanSkuBtn = el("scanSkuBtn");
const skuLoading = el("skuLoading");
const skuNotFound = el("skuNotFound");
const skuResult = el("skuResult");
const skuImage = el("skuImage");
const skuLabel = el("skuLabel");
const qtyInput = el("qtyInput");
const submitBtn = el("submitBtn");

const entryLog = el("entryLog");

const scannerModal = el("scannerModal");
const scannerTitle = el("scannerTitle");
const closeScannerBtn = el("closeScannerBtn");

const toast = el("toast");

// ──────────────────────────────────────────────────────────
// Init
// ──────────────────────────────────────────────────────────
function init() {
  Object.keys(USERS).forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    loginUser.appendChild(opt);
  });

  const savedUser = localStorage.getItem("inwardStockUser");
  if (savedUser && USERS[savedUser]) {
    enterApp(savedUser);
  }

  loadSkuMap();
  wireEvents();
}

// ──────────────────────────────────────────────────────────
// Login / logout
// ──────────────────────────────────────────────────────────
function wireEvents() {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = loginUser.value;
    const pass = loginPass.value;
    if (name && USERS[name] === pass) {
      loginError.hidden = true;
      localStorage.setItem("inwardStockUser", name);
      enterApp(name);
    } else {
      loginError.hidden = false;
    }
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("inwardStockUser");
    state.user = null;
    appScreen.hidden = true;
    loginScreen.hidden = false;
    loginForm.reset();
  });

  confirmRackBtn.addEventListener("click", confirmRack);
  changeRackBtn.addEventListener("click", changeRack);
  rackInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); confirmRack(); }
  });

  skuInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); hideSuggestions(); handleSkuLookup(); }
    if (e.key === "Escape") { hideSuggestions(); }
  });
  skuInput.addEventListener("input", () => renderSuggestions(skuInput.value));
  skuInput.addEventListener("focus", () => {
    if (skuInput.value.trim()) renderSuggestions(skuInput.value);
  });
  skuSuggestions.addEventListener("click", (e) => {
    const li = e.target.closest("li[data-sku]");
    if (!li) return;
    const sku = li.getAttribute("data-sku");
    skuInput.value = sku;
    hideSuggestions();
    handleSkuLookup(sku);
  });
  document.addEventListener("click", (e) => {
    if (e.target !== skuInput && !skuSuggestions.contains(e.target)) {
      hideSuggestions();
    }
  });

  qtyInput.addEventListener("input", updateSubmitEnabled);
  submitBtn.addEventListener("click", submitEntry);

  scanRackBtn.addEventListener("click", () => openScanner("rack"));
  scanSkuBtn.addEventListener("click", () => openScanner("sku"));
  closeScannerBtn.addEventListener("click", closeScanner);
}

function enterApp(name) {
  state.user = name;
  userName.textContent = name;
  loginScreen.hidden = true;
  appScreen.hidden = false;
}

// ──────────────────────────────────────────────────────────
// SKU master list (from Sheet1 published CSV)
// ──────────────────────────────────────────────────────────
function normalize(s) {
  return (s || "").toString().trim().toUpperCase();
}

function loadSkuMap() {
  skuLoading.hidden = false;
  Papa.parse(CONFIG.SKU_CSV_URL, {
    download: true,
    complete: (results) => {
      const rows = results.data.filter((r) => r && r.length >= 2 && (r[0] || r[1]));
      let startIndex = 0;
      if (rows.length && /^sku$/i.test((rows[0][0] || "").trim())) startIndex = 1;

      state.skuMap = new Map();
      for (let i = startIndex; i < rows.length; i++) {
        const sku = (rows[i][0] || "").trim();
        const imageUrl = (rows[i][1] || "").trim();
        if (!sku) continue;
        state.skuMap.set(normalize(sku), { sku, imageUrl });
      }
      skuLoading.hidden = true;
    },
    error: () => {
      skuLoading.textContent = "Could not load SKU list. Check your connection and reload the page.";
    }
  });
}

// ──────────────────────────────────────────────────────────
// Step 1 — Rack
// ──────────────────────────────────────────────────────────
function confirmRack() {
  const val = rackInput.value.trim();
  if (!val) return;
  state.rack = val;
  rackDisplay.textContent = val;
  rackDisplay.classList.add("filled");

  rackCard.hidden = true;
  rackBannerValue.textContent = val;
  rackBanner.hidden = false;
  skuCard.hidden = false;
  skuInput.value = "";
  skuInput.focus();

  setTracker("sku");
}

function changeRack() {
  rackCard.hidden = false;
  rackBanner.hidden = true;
  skuCard.hidden = true;
  resetSkuStep();
  rackInput.value = state.rack;
  rackInput.focus();
  setTracker("rack");
}

function setTracker(step) {
  [trackRack, trackSku, trackQty].forEach((t) => t.classList.remove("active", "done"));
  if (step === "rack") trackRack.classList.add("active");
  if (step === "sku") { trackRack.classList.add("done"); trackSku.classList.add("active"); }
  if (step === "qty") { trackRack.classList.add("done"); trackSku.classList.add("done"); trackQty.classList.add("active"); }
}

// ──────────────────────────────────────────────────────────
// Step 2 — SKU lookup
// ──────────────────────────────────────────────────────────
function resetSkuStep() {
  skuResult.hidden = true;
  skuNotFound.hidden = true;
  qtyInput.value = "";
  submitBtn.disabled = true;
  state.sku = "";
  state.imageUrl = "";
  hideSuggestions();
}

function escapeHtml(s) {
  return (s || "").toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderSuggestions(query) {
  const q = normalize(query);
  if (!q) { hideSuggestions(); return; }

  const starts = [];
  const contains = [];
  for (const item of state.skuMap.values()) {
    const normSku = normalize(item.sku);
    if (normSku.startsWith(q)) {
      starts.push(item);
    } else if (normSku.includes(q)) {
      contains.push(item);
    }
    if (starts.length >= 8) break;
  }
  const matches = starts.concat(contains).slice(0, 8);

  if (!matches.length) {
    skuSuggestions.innerHTML = `<li class="sg-empty">No matching SKU</li>`;
    skuSuggestions.hidden = false;
    return;
  }

  skuSuggestions.innerHTML = matches.map((m) => `
    <li data-sku="${escapeHtml(m.sku)}">
      ${m.imageUrl ? `<img src="${escapeHtml(m.imageUrl)}" alt="" onerror="this.style.display='none'">` : ""}
      <span>${escapeHtml(m.sku)}</span>
    </li>
  `).join("");
  skuSuggestions.hidden = false;
}

function hideSuggestions() {
  skuSuggestions.hidden = true;
  skuSuggestions.innerHTML = "";
}

function handleSkuLookup(rawValue) {
  const value = (rawValue !== undefined ? rawValue : skuInput.value).trim();
  if (!value) return;

  const match = state.skuMap.get(normalize(value));
  if (match) {
    state.sku = match.sku;
    state.imageUrl = match.imageUrl;
    skuLabel.textContent = match.sku;
    skuImage.src = match.imageUrl;
    skuImage.alt = match.sku;
    skuResult.hidden = false;
    skuNotFound.hidden = true;
    qtyInput.value = "";
    qtyInput.focus();
    setTracker("qty");
  } else {
    skuResult.hidden = true;
    skuNotFound.hidden = false;
    state.sku = "";
    state.imageUrl = "";
  }
  updateSubmitEnabled();
}

function updateSubmitEnabled() {
  const qty = parseInt(qtyInput.value, 10);
  submitBtn.disabled = !(state.sku && qty > 0);
}

// ──────────────────────────────────────────────────────────
// Step 3 — Submit entry
// ──────────────────────────────────────────────────────────
function pad(n) { return n < 10 ? "0" + n : "" + n; }

function formatDate(d) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}
function formatTimestamp(d) {
  return `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function submitEntry() {
  const qty = parseInt(qtyInput.value, 10);
  if (!state.sku || !(qty > 0)) return;

  const now = new Date();
  const payload = {
    date: formatDate(now),
    timestamp: formatTimestamp(now),
    name: state.user,
    rack: state.rack,
    sku: state.sku,
    qty: qty
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "Saving…";

  fetch(CONFIG.APPS_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify(payload)
  })
    .then(() => {
      showToast(`Saved — ${payload.sku} × ${payload.qty}`, "success");
      addToLog(payload);
      resetSkuStep();
      skuInput.value = "";
      skuInput.focus();
      setTracker("sku");
    })
    .catch(() => {
      showToast("Network error — entry was not saved. Try again.", "error");
    })
    .finally(() => {
      submitBtn.textContent = "Save entry";
      updateSubmitEnabled();
    });
}

function addToLog(payload) {
  const empty = entryLog.querySelector(".entry-empty");
  if (empty) empty.remove();

  const li = document.createElement("li");
  li.innerHTML = `
    <span class="e-sku">${payload.sku} × ${payload.qty}</span>
    <span class="e-meta">Rack ${payload.rack}<br>${payload.timestamp.split(" ")[1]}</span>
  `;
  entryLog.prepend(li);
}

function showToast(msg, type) {
  toast.textContent = msg;
  toast.className = "toast " + (type || "");
  toast.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { toast.hidden = true; }, 2800);
}

// ──────────────────────────────────────────────────────────
// Camera scanner (rack QR / barcode and SKU barcode)
// ──────────────────────────────────────────────────────────
function openScanner(target) {
  state.scanTarget = target;
  scannerTitle.textContent = target === "rack" ? "Scan rack code" : "Scan SKU";
  scannerModal.hidden = false;

  state.html5QrCode = new Html5Qrcode("reader");
  const config = {
    fps: 10,
    qrbox: { width: 250, height: 180 },
    formatsToSupport: [
      Html5QrcodeSupportedFormats.QR_CODE,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E
    ]
  };

  state.html5QrCode
    .start({ facingMode: "environment" }, config, onScanSuccess, () => {})
    .catch(() => {
      showToast("Could not access camera. Check camera permission.", "error");
      closeScanner();
    });
}

function onScanSuccess(decodedText) {
  const target = state.scanTarget;
  closeScanner();
  if (target === "rack") {
    rackInput.value = decodedText.trim();
    confirmRack();
  } else if (target === "sku") {
    skuInput.value = decodedText.trim();
    hideSuggestions();
    handleSkuLookup(decodedText.trim());
  }
}

function closeScanner() {
  scannerModal.hidden = true;
  if (state.html5QrCode) {
    state.html5QrCode.stop()
      .then(() => state.html5QrCode.clear())
      .catch(() => {});
    state.html5QrCode = null;
  }
}

// ──────────────────────────────────────────────────────────
init();
