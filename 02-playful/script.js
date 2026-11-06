"use strict";

const STORAGE_KEY = "cathotel_playful_reservations_v1";
const RECENT_KEY = "cathotel_playful_recent_codes_v1";
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const services = {
  stay: {
    title: "Playroom Stay",
    description: "A bright private room, twice-daily play invitations, familiar feeding routines and a photo hello for your phone.",
    price: 48,
    unit: "per night",
    icon: "🏡",
    color: "#ff8a80",
    image: "images/service-stay.webp?v=__BUILD_VERSION__",
    alt: "A fluffy cream-and-ginger kitten snuggled in a plush round bed inside a bright private cat hotel suite",
    features: ["Private cosy room", "Daily photo update", "Supervised play", "Your feeding routine"]
  },
  groom: {
    title: "Fresh Fur Groom",
    description: "A patient brush, cat-safe wash and fluffy dry with breaks whenever your cat asks for one.",
    price: 65,
    unit: "per visit",
    icon: "🫧",
    color: "#bde7fa",
    image: "images/service-groom.webp?v=__BUILD_VERSION__",
    alt: "A long-haired white-and-grey cat enjoying a gentle brush-out on a soft mint towel",
    features: ["Gentle brush-out", "Cat-safe products", "Nail check", "Comfort breaks"]
  },
  trim: {
    title: "Tiny Tidy Trim",
    description: "A neat little refresh for paws, nails and hygiene areas—quick, calm and never rushed.",
    price: 35,
    unit: "per visit",
    icon: "✂️",
    color: "#ffd758",
    image: "images/service-trim.webp?v=__BUILD_VERSION__",
    alt: "A tabby kitten sitting on a yellow grooming mat and lifting one tidy front paw",
    features: ["Nail trim", "Paw tidy", "Hygiene trim", "Gentle handling"]
  }
};

const servicePrices = {
  stay: { label: "Playroom Stay", price: 48, type: "night" },
  "stay-groom": { label: "Stay + Glow-Up", price: 83, type: "night" },
  groom: { label: "Fresh Fur Groom", price: 65, type: "visit" },
  trim: { label: "Tiny Tidy Trim", price: 35, type: "visit" }
};

const bookingOverlay = $("#bookingOverlay");
const bookingForm = $("#bookingForm");
const bookingSuccess = $("#bookingSuccess");
const reservationPanel = $("#reservationPanel");
const panelBackdrop = $("#panelBackdrop");
const trackingCode = $("#trackingCode");
const heroSlides = $$(".hero-slide");
const heroDots = $$('[data-hero-slide]');
const carouselToggle = $("#carouselToggle");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let lastFocus = null;
let toastTimer;
let heroIndex = 0;
let heroTimer = null;
let heroTransitioning = false;
const FADE_ZOOM_MS = 1600;
let activeServiceKey = null;
let carouselPaused = reducedMotionQuery.matches;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function readReservations() {
  return readList(STORAGE_KEY);
}

function saveReservations(reservations) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
    return true;
  } catch {
    showToast("Browser storage is unavailable for this demo.");
    return false;
  }
}

function dateString(offset = 0) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function nightCount(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  return Math.round((new Date(`${checkOut}T12:00:00`) - new Date(`${checkIn}T12:00:00`)) / 86400000);
}

function createCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const existing = new Set(readReservations().map(item => item.id));
  let code;
  do {
    code = "POP-" + Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  } while (existing.has(code));
  return code;
}

function statusLabel(status) {
  return ({ pending: "Waiting for high-five", confirmed: "Stay confirmed", declined: "Needs new dates" })[status] || "Pending";
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function updateHeroControls() {
  heroSlides.forEach((slide, index) => slide.setAttribute("aria-hidden", String(index !== heroIndex)));
  heroDots.forEach((dot, index) => {
    const active = index === heroIndex;
    dot.classList.toggle("is-active", active);
    if (active) dot.setAttribute("aria-current", "true");
    else dot.removeAttribute("aria-current");
  });
}

// Smooth fade & zoom: the incoming slide fades in on top while it begins a slow
// zoom; the outgoing slide stays fully visible beneath so the crossfade never flashes.
function crossfadeSlides(outgoing, incoming, onDone) {
  incoming.classList.remove("is-active", "is-leaving");
  incoming.classList.add("is-resetting");
  incoming.getBoundingClientRect();
  requestAnimationFrame(() => {
    incoming.classList.remove("is-resetting");
    incoming.classList.add("is-active");
    if (outgoing && outgoing !== incoming) {
      outgoing.classList.remove("is-active");
      outgoing.classList.add("is-leaving");
    }
  });
  setTimeout(() => {
    if (outgoing && outgoing !== incoming) outgoing.classList.remove("is-leaving");
    if (onDone) onDone();
  }, reducedMotionQuery.matches ? 30 : FADE_ZOOM_MS + 100);
}

function changeHeroImage(nextIndex) {
  const safeIndex = (Number(nextIndex) + heroSlides.length) % heroSlides.length;
  if (heroTransitioning || safeIndex === heroIndex) return;
  heroTransitioning = true;
  const outgoing = heroSlides[heroIndex];
  heroIndex = safeIndex;
  updateHeroControls();
  crossfadeSlides(outgoing, heroSlides[safeIndex], () => { heroTransitioning = false; });
}

function startHeroCarousel() {
  clearInterval(heroTimer);
  if (carouselPaused || heroSlides.length < 2 || document.hidden) return;
  heroTimer = setInterval(() => changeHeroImage(heroIndex + 1), 5000);
}

function setCarouselPaused(paused) {
  carouselPaused = paused;
  carouselToggle.setAttribute("aria-pressed", String(paused));
  carouselToggle.setAttribute("aria-label", paused ? "Play hero images" : "Pause hero images");
  carouselToggle.querySelector("span").textContent = paused ? "▶" : "Ⅱ";
  startHeroCarousel();
}

function renderService(serviceKey = "stay") {
  const service = services[serviceKey];
  const stage = $("#serviceStage");
  let panel = stage.querySelector(".service-panel");
  if (!panel) {
    stage.innerHTML = `
      <article class="service-panel">
        <div class="service-art">
          ${Object.entries(services).map(([key, item]) => `<img class="service-slide" data-service-image="${key}" src="${item.image}" width="1536" height="1024" alt="${escapeHtml(item.alt)}" loading="lazy" decoding="async">`).join("")}
          <span class="service-icon" aria-hidden="true"></span>
        </div>
        <div class="service-details"></div>
      </article>`;
    panel = stage.querySelector(".service-panel");
  }
  panel.style.setProperty("--service-color", service.color);
  panel.querySelector(".service-icon").textContent = service.icon;
  panel.querySelector(".service-details").innerHTML = `
    <div><h3>${service.title}</h3><p>${service.description}</p></div>
    <div class="service-price">RM${service.price}<small>${service.unit}</small></div>
    <ul class="service-list">${service.features.map(feature => `<li>✓ ${feature}</li>`).join("")}</ul>
    <button class="button" type="button" data-book-service="${serviceKey}">Choose ${service.title}</button>`;

  const outgoing = activeServiceKey ? panel.querySelector(`[data-service-image="${activeServiceKey}"]`) : null;
  const incoming = panel.querySelector(`[data-service-image="${serviceKey}"]`);
  activeServiceKey = serviceKey;
  if (outgoing) {
    crossfadeSlides(outgoing, incoming);
  } else {
    // First paint: hold the photo until the section scrolls into view, then fade & zoom it in.
    incoming.classList.add("is-resetting");
    const reveal = () => crossfadeSlides(null, incoming);
    if ("IntersectionObserver" in window && !reducedMotionQuery.matches) {
      const observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        observer.disconnect();
        reveal();
      }, { threshold: 0.2 });
      observer.observe(stage);
    } else {
      reveal();
    }
  }
}

function selectServiceTab(key) {
  $$('[data-service-tab]').forEach(button => button.setAttribute("aria-selected", String(button.dataset.serviceTab === key)));
  renderService(key);
}

function openBooking(serviceKey) {
  lastFocus = document.activeElement;
  bookingForm.hidden = false;
  bookingSuccess.hidden = true;
  $("#formError").textContent = "";
  if (serviceKey && serviceKey in services) $("#service").value = serviceKey;
  syncBookingFields();
  bookingOverlay.classList.add("open");
  bookingOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  setTimeout(() => $("#ownerName").focus({ preventScroll: true }), 80);
}

function closeBooking() {
  bookingOverlay.classList.remove("open");
  bookingOverlay.setAttribute("aria-hidden", "true");
  if (!reservationPanel.classList.contains("open")) document.body.classList.remove("modal-open");
  if (lastFocus) lastFocus.focus({ preventScroll: true });
}

function syncBookingFields() {
  const selected = servicePrices[$("#service").value];
  const checkOut = $("#checkOut");
  const isVisit = selected.type === "visit";
  checkOut.disabled = isVisit;
  checkOut.required = !isVisit;
  checkOut.closest("label").style.opacity = isVisit ? ".45" : "1";
  updateEstimate();
}

function updateEstimate() {
  const selected = servicePrices[$("#service").value];
  const nights = nightCount($("#checkIn").value, $("#checkOut").value);
  const total = selected.type === "visit" ? selected.price : Math.max(0, nights) * selected.price;
  const valid = selected.type === "visit" ? Boolean($("#checkIn").value) : nights > 0;
  $("#estimate").innerHTML = valid
    ? `<span>${selected.label}${selected.type === "night" ? ` · ${nights} night${nights === 1 ? "" : "s"}` : " · one visit"}</span><b>RM${total}</b>`
    : "<span>Estimated demo total</span><b>Choose valid dates</b>";
  return { selected, nights, total, valid };
}

function rememberCode(code) {
  const recent = [code, ...readList(RECENT_KEY).filter(item => item !== code)].slice(0, 4);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(recent)); } catch { /* Demo still works without recent shortcuts. */ }
}

function renderRecentCodes() {
  const recent = readList(RECENT_KEY);
  const container = $("#recentCodes");
  container.hidden = recent.length === 0;
  container.innerHTML = recent.map(code => `<button type="button" data-recent-code="${escapeHtml(code)}">${escapeHtml(code)}</button>`).join("");
}

function setPanelTab(tab) {
  const isTrack = tab === "track";
  $$('[data-panel-tab]').forEach(button => {
    const active = button.dataset.panelTab === tab;
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
  });
  $("#trackPanel").hidden = !isTrack;
  $("#deskPanel").hidden = isTrack;
  $("#panelTitle").textContent = isTrack ? "Find a catcation" : "Front desk demo";
  if (isTrack) renderRecentCodes();
  else renderDesk();
}

function openPanel(tab = "track", code = "") {
  lastFocus = document.activeElement;
  setPanelTab(tab);
  reservationPanel.classList.add("open");
  panelBackdrop.classList.add("open");
  reservationPanel.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  if (code) {
    trackingCode.value = code;
    trackReservation(code);
  }
  setTimeout(() => (tab === "track" ? trackingCode : $('[data-panel-tab="desk"]')).focus({ preventScroll: true }), 80);
}

function closePanel() {
  reservationPanel.classList.remove("open");
  panelBackdrop.classList.remove("open");
  reservationPanel.setAttribute("aria-hidden", "true");
  if (!bookingOverlay.classList.contains("open")) document.body.classList.remove("modal-open");
  if (lastFocus) lastFocus.focus({ preventScroll: true });
}

function trackReservation(rawCode) {
  const code = String(rawCode ?? trackingCode.value).trim().toUpperCase();
  trackingCode.value = code;
  const reservation = readReservations().find(item => item.id === code);
  if (!code || !reservation) {
    $("#trackingResult").innerHTML = `<div class="empty-state"><span>🙀</span><p>${code ? `No demo reservation matches <b>${escapeHtml(code)}</b> in this browser.` : "Enter the code from your demo reservation ticket."}</p></div>`;
    return;
  }
  rememberCode(code);
  renderRecentCodes();
  const confirmed = reservation.status === "confirmed";
  const declined = reservation.status === "declined";
  const dateText = reservation.kind === "visit" ? formatDate(reservation.checkIn) : `${formatDate(reservation.checkIn)} → ${formatDate(reservation.checkOut)}`;
  $("#trackingResult").innerHTML = `
    <article class="track-card">
      <div class="track-card-head"><div><span class="code">${escapeHtml(reservation.id)}</span><h3>🐱 ${escapeHtml(reservation.catName)}</h3></div><span class="status-pill ${reservation.status}">${statusLabel(reservation.status)}</span></div>
      <p class="track-meta">${escapeHtml(reservation.serviceLabel)}<br>${dateText} · RM${reservation.total}<br>${escapeHtml(reservation.personality)}</p>
      <div class="track-steps">
        <div class="track-step done"><i>✓</i><div><b>Request saved</b><small>Your demo ticket is ready.</small></div></div>
        <div class="track-step ${confirmed || declined ? "done" : ""}"><i>${declined ? "!" : confirmed ? "✓" : "2"}</i><div><b>${declined ? "New dates needed" : "Front desk review"}</b><small>${declined ? "This request was declined in the demo." : confirmed ? "Your demo stay was confirmed." : "Waiting for a demo decision."}</small></div></div>
        <div class="track-step ${confirmed ? "done" : ""}"><i>${confirmed ? "✓" : "3"}</i><div><b>Ready for happy paws</b><small>${confirmed ? "Pack their favourite food and comfort item." : "Unlocks after confirmation."}</small></div></div>
      </div>
    </article>`;
}

function renderDesk() {
  const reservations = readReservations();
  $("#totalStat").textContent = reservations.length;
  $("#pendingStat").textContent = reservations.filter(item => item.status === "pending").length;
  $("#confirmedStat").textContent = reservations.filter(item => item.status === "confirmed").length;
  $("#deskList").innerHTML = reservations.length ? reservations.slice().reverse().map(item => `
    <article class="desk-booking">
      <header><div><h3>🐱 ${escapeHtml(item.catName)}</h3><span class="code">${escapeHtml(item.id)}</span></div><span class="status-pill ${item.status}">${statusLabel(item.status)}</span></header>
      <p>${escapeHtml(item.serviceLabel)} · ${formatDate(item.checkIn)}${item.kind === "night" ? ` → ${formatDate(item.checkOut)}` : ""}<br>${escapeHtml(item.ownerName)} · RM${item.total}</p>
      ${item.status === "pending" ? `<div class="desk-actions"><button type="button" data-status="confirmed" data-id="${escapeHtml(item.id)}">Confirm stay</button><button type="button" data-status="declined" data-id="${escapeHtml(item.id)}">Decline</button></div>` : ""}
    </article>`).join("") : '<div class="empty-state"><span>🐾</span><p>No demo reservations yet. Add samples or make one from the booking form.</p></div>';
}

function setStatus(id, status) {
  const reservations = readReservations();
  const reservation = reservations.find(item => item.id === id);
  if (!reservation || reservation.status !== "pending") return;
  reservation.status = status;
  if (!saveReservations(reservations)) return;
  renderDesk();
  if (trackingCode.value.trim().toUpperCase() === id) trackReservation(id);
  showToast(`${reservation.catName}'s request is now ${statusLabel(status).toLowerCase()}.`);
}

function seedDemo() {
  const current = readReservations();
  if (current.length && !confirm("Add sample stays to the existing demo reservations?")) return;
  const samples = [
    { id: createCode(), ownerName: "Aina", catName: "Mochi", checkIn: dateString(3), checkOut: dateString(6), service: "stay", serviceLabel: "Playroom Stay", personality: "Curious explorer", notes: "Loves feather toys", nights: 3, total: 144, kind: "night", status: "pending", createdAt: Date.now() },
    { id: createCode(), ownerName: "Hafiz", catName: "Oyen", checkIn: dateString(7), checkOut: dateString(9), service: "stay-groom", serviceLabel: "Stay + Glow-Up", personality: "Professional napper", notes: "", nights: 2, total: 166, kind: "night", status: "confirmed", createdAt: Date.now() - 3600000 }
  ];
  if (saveReservations([...current, ...samples])) {
    samples.forEach(item => rememberCode(item.id));
    renderDesk();
    showToast("Two sample catcations added.");
  }
}

function clearDemo() {
  if (!confirm("Delete every Pet Spa & Hotel demo reservation stored in this browser?")) return;
  if (saveReservations([])) {
    try { localStorage.removeItem(RECENT_KEY); } catch { /* Ignore unavailable storage. */ }
    trackingCode.value = "";
    renderDesk();
    renderRecentCodes();
    $("#trackingResult").innerHTML = '<div class="empty-state"><span>🔎</span><p>Enter the code from your demo reservation ticket.</p></div>';
    showToast("Demo reservations cleared.");
  }
}

carouselToggle.addEventListener("click", () => setCarouselPaused(!carouselPaused));
heroDots.forEach(dot => dot.addEventListener("click", () => {
  const nextIndex = Number(dot.dataset.heroSlide);
  changeHeroImage(nextIndex);
  startHeroCarousel();
}));
document.addEventListener("visibilitychange", startHeroCarousel);
reducedMotionQuery.addEventListener("change", event => {
  if (event.matches) setCarouselPaused(true);
});

$$('[data-service-tab]').forEach(button => button.addEventListener("click", () => selectServiceTab(button.dataset.serviceTab)));
$("#serviceStage").addEventListener("click", event => {
  const button = event.target.closest("[data-book-service]");
  if (button) openBooking(button.dataset.bookService);
});

$$('[data-open-booking]').forEach(button => button.addEventListener("click", () => openBooking()));
$$('[data-close-booking]').forEach(button => button.addEventListener("click", closeBooking));
bookingOverlay.addEventListener("click", event => { if (event.target === bookingOverlay) closeBooking(); });

$$('[data-open-panel]').forEach(button => button.addEventListener("click", () => openPanel(button.dataset.openPanel)));
$("#panelClose").addEventListener("click", closePanel);
panelBackdrop.addEventListener("click", closePanel);
$$('[data-panel-tab]').forEach(button => button.addEventListener("click", () => setPanelTab(button.dataset.panelTab)));

$("#service").addEventListener("change", syncBookingFields);
[$("#checkIn"), $("#checkOut")].forEach(input => input.addEventListener("change", updateEstimate));
$("#checkIn").min = dateString();
$("#checkOut").min = dateString(1);
$("#checkIn").addEventListener("change", () => {
  if ($("#checkIn").value) {
    const nextDay = new Date(`${$("#checkIn").value}T12:00:00`);
    nextDay.setDate(nextDay.getDate() + 1);
    $("#checkOut").min = nextDay.toISOString().slice(0, 10);
  }
});

bookingForm.addEventListener("submit", event => {
  event.preventDefault();
  const calculation = updateEstimate();
  const ownerName = $("#ownerName").value.trim();
  const catName = $("#catName").value.trim();
  const checkIn = $("#checkIn").value;
  const checkOut = calculation.selected.type === "visit" ? checkIn : $("#checkOut").value;
  if (!ownerName || !catName || !calculation.valid || checkIn < dateString()) {
    $("#formError").textContent = "Please add your name, your cat's name and valid current or future dates.";
    return;
  }
  const reservation = {
    id: createCode(),
    ownerName,
    catName,
    checkIn,
    checkOut,
    service: $("#service").value,
    serviceLabel: calculation.selected.label,
    personality: $("#personality").value,
    notes: $("#notes").value.trim(),
    nights: calculation.selected.type === "night" ? calculation.nights : 0,
    total: calculation.total,
    kind: calculation.selected.type,
    status: "pending",
    createdAt: Date.now()
  };
  if (!saveReservations([...readReservations(), reservation])) return;
  rememberCode(reservation.id);
  bookingForm.hidden = true;
  bookingSuccess.hidden = false;
  bookingSuccess.innerHTML = `
    <div class="success-pop">🎉</div>
    <h3>${escapeHtml(catName)}'s request is saved!</h3>
    <p>Keep this browser-only code to track the demo stay.</p>
    <strong class="ticket-code" id="ticketCode">${escapeHtml(reservation.id)}</strong>
    <div class="success-actions"><button type="button" data-copy-ticket>Copy code</button><button type="button" data-track-ticket>Track this stay</button><button type="button" data-desk-ticket>Open front desk</button></div>`;
  bookingSuccess.focus();
  showToast("Demo reservation saved in this browser.");
});

bookingSuccess.addEventListener("click", async event => {
  if (event.target.closest("[data-copy-ticket]")) {
    const code = $("#ticketCode").textContent;
    try { await navigator.clipboard.writeText(code); showToast(`Copied ${code}`); }
    catch { showToast(`Copy blocked. Code: ${code}`); }
  }
  if (event.target.closest("[data-track-ticket]")) {
    const code = $("#ticketCode").textContent;
    closeBooking();
    openPanel("track", code);
  }
  if (event.target.closest("[data-desk-ticket]")) {
    closeBooking();
    openPanel("desk");
  }
});

$("#trackButton").addEventListener("click", () => trackReservation());
trackingCode.addEventListener("keydown", event => {
  if (event.key === "Enter") { event.preventDefault(); trackReservation(); }
});
$("#recentCodes").addEventListener("click", event => {
  const button = event.target.closest("[data-recent-code]");
  if (button) trackReservation(button.dataset.recentCode);
});
$("#deskList").addEventListener("click", event => {
  const button = event.target.closest("[data-status]");
  if (button) setStatus(button.dataset.id, button.dataset.status);
});
$("#seedButton").addEventListener("click", seedDemo);
$("#clearButton").addEventListener("click", clearDemo);

$("#menuButton").addEventListener("click", () => {
  const open = $("#navLinks").classList.toggle("open");
  $("#menuButton").setAttribute("aria-expanded", String(open));
});
$$('#navLinks a').forEach(link => link.addEventListener("click", () => {
  $("#navLinks").classList.remove("open");
  $("#menuButton").setAttribute("aria-expanded", "false");
}));

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  if (bookingOverlay.classList.contains("open")) closeBooking();
  else if (reservationPanel.classList.contains("open")) closePanel();
});

window.addEventListener("storage", () => {
  if (reservationPanel.classList.contains("open")) {
    renderDesk();
    if (trackingCode.value) trackReservation();
  }
});

$("#year").textContent = new Date().getFullYear();
renderService();
renderRecentCodes();
syncBookingFields();
updateHeroControls();
// Let the first hero image begin its slow zoom on load instead of sitting at full scale.
if (heroSlides.length && !reducedMotionQuery.matches) crossfadeSlides(null, heroSlides[heroIndex]);
setCarouselPaused(carouselPaused);
