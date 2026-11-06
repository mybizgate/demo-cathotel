"use strict";

const KEY = "cathotel_modern_bookings_v1";
const rates = { "Snuggle Nook": 35, "Purrfect Playground": 55, "Royal Whiskers": 85 };
const $ = id => document.getElementById(id);
let lastTrigger = null;
let toastTimer = null;

function read() {
  try {
    const bookings = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(bookings) ? bookings : [];
  } catch {
    return [];
  }
}

function save(bookings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(bookings));
    return true;
  } catch {
    alert("Browser storage is unavailable. Enable local storage to use this demo.");
    return false;
  }
}

function days(start, end) {
  if (!start || !end) return 0;
  return Math.round((Date.parse(end + "T12:00:00Z") - Date.parse(start + "T12:00:00Z")) / 86400000);
}

function todayString(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}

function createReference() {
  const token = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return "PS-" + token.toUpperCase();
}

function switchView(view) {
  const isOwner = view === "owner";
  $("consumer").classList.toggle("hidden", isOwner);
  $("owner").classList.toggle("active", isOwner);
  $("consumer-tab").classList.toggle("active", !isOwner);
  $("owner-tab").classList.toggle("active", isOwner);
  $("consumer-tab").setAttribute("aria-pressed", String(!isOwner));
  $("owner-tab").setAttribute("aria-pressed", String(isOwner));
  $("mobile-dock").hidden = isOwner;
  closeMenu();
  if (isOwner) render();
  window.scrollTo({ top: 0, behavior: "smooth" });
  setTimeout(() => $(isOwner ? "owner" : "consumer").focus({ preventScroll: true }), 250);
}

function toggleMenu() {
  const isOpen = $("mobile-menu").classList.toggle("open");
  $("menu-toggle").setAttribute("aria-expanded", String(isOpen));
  $("menu-toggle").setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  $("menu-toggle").textContent = isOpen ? "✕" : "☰";
}

function closeMenu() {
  $("mobile-menu").classList.remove("open");
  $("menu-toggle").setAttribute("aria-expanded", "false");
  $("menu-toggle").setAttribute("aria-label", "Open navigation");
  $("menu-toggle").textContent = "☰";
}

function openOverlay(id, focusId) {
  lastTrigger = document.activeElement;
  $(id).classList.add("open");
  document.body.classList.add("modal-open");
  setTimeout(() => $(focusId).focus(), 50);
}

function closeOverlay(id) {
  $(id).classList.remove("open");
  if (!document.querySelector(".overlay.open")) document.body.classList.remove("modal-open");
  if (lastTrigger && typeof lastTrigger.focus === "function") lastTrigger.focus();
}

function openBooking(suite) {
  $("booking-form").hidden = false;
  $("booking-success").hidden = true;
  $("booking-error").textContent = "";
  if (suite) $("suite").value = suite;
  updateTotal();
  openOverlay("booking-overlay", "cat-name");
}

function closeBooking() {
  closeOverlay("booking-overlay");
}

function openTracker() {
  $("tracking-result").textContent = "";
  openOverlay("tracker-overlay", "tracking-id");
}

function closeTracker() {
  closeOverlay("tracker-overlay");
}

function trackBooking() {
  const reference = $("tracking-id").value.trim().toUpperCase();
  const booking = read().find(item => item.id === reference);
  $("tracking-result").innerHTML = booking
    ? '<div class="success-card"><h3>🐱 ' + escapeHtml(booking.cat) + '</h3><p>' + escapeHtml(booking.suite) + ' · ' + escapeHtml(booking.checkIn) + ' to ' + escapeHtml(booking.checkOut) + '</p><p>Status: <b>' + statusLabel(booking.status) + '</b><br>Reference: ' + escapeHtml(booking.id) + '</p></div>'
    : '<p>No matching booking was found in this browser. Create a demo booking first, or check the reference and try again.</p>';
}

function updateTotal() {
  const nightCount = days($("check-in").value, $("check-out").value);
  $("booking-total").textContent = nightCount > 0
    ? "RM" + (nightCount * rates[$("suite").value]) + " · " + nightCount + " night" + (nightCount === 1 ? "" : "s")
    : "Select valid dates";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function statusLabel(status) {
  return status === "confirmed" ? "Confirmed" : status === "rejected" ? "Rejected" : "Pending";
}

function showToast(message) {
  clearTimeout(toastTimer);
  $("toast").textContent = message;
  $("toast").classList.add("show");
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2600);
}

function render() {
  const bookings = read();
  $("stat-all").textContent = bookings.length;
  $("stat-pending").textContent = bookings.filter(item => item.status === "pending").length;
  $("stat-confirmed").textContent = bookings.filter(item => item.status === "confirmed").length;
  $("stat-revenue").textContent = "RM" + bookings.filter(item => item.status === "confirmed").reduce((sum, item) => sum + item.total, 0);
  $("booking-list").innerHTML = bookings.length
    ? bookings.slice().reverse().map(item => '<article class="booking-row"><div><div class="booking-main"><b>🐱 ' + escapeHtml(item.cat) + '</b><span class="status ' + item.status + '">' + statusLabel(item.status) + '</span></div><small>' + escapeHtml(item.id) + ' · ' + escapeHtml(item.suite) + '<br>' + escapeHtml(item.checkIn) + ' → ' + escapeHtml(item.checkOut) + ' · RM' + item.total + ' · ' + item.nights + ' night(s)</small></div>' + (item.status === "pending" ? '<div class="actions"><button type="button" onclick="setStatus(\'' + item.id + '\',\'confirmed\')">✓ Confirm</button><button type="button" class="reject" onclick="setStatus(\'' + item.id + '\',\'rejected\')">✕ Reject</button></div>' : '') + '</article>').join("")
    : '<div class="empty">No bookings yet. Add samples or create a request from the pet-parent view.</div>';
}

function setStatus(id, status) {
  const bookings = read();
  const booking = bookings.find(item => item.id === id);
  if (!booking || booking.status !== "pending") return;
  const overlaps = status === "confirmed" && bookings.some(item => item.id !== id && item.status === "confirmed" && item.suite === booking.suite && item.checkIn < booking.checkOut && booking.checkIn < item.checkOut);
  if (overlaps) {
    alert("This suite already has a confirmed overlapping stay. Choose different dates or reject the request.");
    return;
  }
  booking.status = status;
  save(bookings);
  render();
  showToast(booking.cat + " is now " + statusLabel(status).toLowerCase() + ".");
}

function resetDemo() {
  if (confirm("Delete all simulated bookings stored in this browser?")) {
    save([]);
    render();
    showToast("Demo bookings cleared.");
  }
}

function seedDemo() {
  const bookings = read();
  if (bookings.length && !confirm("Add sample bookings to your existing demo data?")) return;
  const samples = [
    ["Mochi", "Snuggle Nook", 2, 4, "pending"],
    ["Oyen", "Purrfect Playground", 3, 6, "confirmed"],
    ["Luna", "Royal Whiskers", 7, 9, "pending"]
  ].map(([cat, suite, start, end, status]) => ({
    id: createReference(),
    cat,
    suite,
    checkIn: todayString(start),
    checkOut: todayString(end),
    nights: end - start,
    total: (end - start) * rates[suite],
    note: "Sample booking",
    status,
    createdAt: new Date().toISOString()
  }));
  save([...bookings, ...samples]);
  render();
  showToast("Three sample bookings added.");
}

["check-in", "check-out", "suite"].forEach(id => $(id).addEventListener("change", updateTotal));

$("booking-form").addEventListener("submit", event => {
  event.preventDefault();
  const cat = $("cat-name").value.trim();
  const suite = $("suite").value;
  const checkIn = $("check-in").value;
  const checkOut = $("check-out").value;
  const nightCount = days(checkIn, checkOut);
  if (!cat || nightCount <= 0 || checkIn < todayString()) {
    $("booking-error").textContent = "Please enter a cat name and choose valid current or future dates.";
    return;
  }
  const reference = createReference();
  const booking = {
    id: reference,
    cat,
    suite,
    checkIn,
    checkOut,
    nights: nightCount,
    total: nightCount * rates[suite],
    note: $("note").value.trim(),
    status: "pending",
    createdAt: new Date().toISOString()
  };
  if (!save([...read(), booking])) return;
  $("booking-form").hidden = true;
  $("booking-success").hidden = false;
  $("booking-success").innerHTML = '<div class="success-card"><h3>Booking request received!</h3><p>Save this reference: <b>' + reference + '</b></p><p>Your request is pending. Open the owner dashboard to confirm it, then track the same reference from the pet-parent view.</p></div><br><button class="btn full-button" type="button" onclick="closeBooking();switchView(\'owner\')">Open owner dashboard →</button>';
  $("booking-success").focus();
});

$("booking-overlay").addEventListener("click", event => {
  if (event.target === $("booking-overlay")) closeBooking();
});

$("tracker-overlay").addEventListener("click", event => {
  if (event.target === $("tracker-overlay")) closeTracker();
});

$("tracking-id").addEventListener("keydown", event => {
  if (event.key === "Enter") trackBooking();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeMenu();
    if ($("booking-overlay").classList.contains("open")) closeBooking();
    if ($("tracker-overlay").classList.contains("open")) closeTracker();
  }
});

window.addEventListener("storage", () => {
  render();
  if ($("tracker-overlay").classList.contains("open") && $("tracking-id").value) trackBooking();
});

const minimumDate = todayString();
$("check-in").min = minimumDate;
$("check-out").min = minimumDate;
render();
