/* ============================================================
   Cactus Digital Menu — Vanilla JS
   Loads data from menu.json, renders cards,
   handles live search + category filter + UI helpers.
   ============================================================ */

"use strict";

// --- Configuration ---
const CONFIG = {
  dataUrl: "menu.json",
  currency: "تومان",
  allLabel: "همه",
};

// --- App State ---
const state = {
  items: [],          // full menu
  categories: [],     // unique category list
  activeCategory: CONFIG.allLabel,
  searchTerm: "",
};

// --- DOM references ---
const els = {
  grid: document.getElementById("menuGrid"),
  filters: document.getElementById("filters"),
  search: document.getElementById("searchInput"),
  stateBox: document.getElementById("stateBox"),
  stateText: document.getElementById("stateText"),
  backToTop: document.getElementById("backToTop"),
  year: document.getElementById("year"),
};

/* ---------- Utilities ---------- */

// Format numbers with Persian thousands separators.
function formatPrice(value) {
  if (value == null || value === "") return "";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString("fa-IR");
}

// Escape HTML to prevent broken markup / injection from JSON data.
function escapeHtml(str = "") {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Debounce to keep live search smooth.
function debounce(fn, delay = 180) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Normalize Persian/Arabic characters for reliable search.
function normalize(text = "") {
  return text
    .toString()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, " ") // ZWNJ -> space
    .trim()
    .toLowerCase();
}

/* ---------- Data loading ---------- */

async function loadMenu() {
  showState("در حال بارگذاری منو...");
  try {
    const res = await fetch(CONFIG.dataUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const items = Array.isArray(data) ? data : data.items || [];

    state.items = items;
    state.categories = [CONFIG.allLabel, ...new Set(items.map((i) => i.category).filter(Boolean))];

    hideState();
    renderFilters();
    render();
  } catch (err) {
    console.error("Menu load failed:", err);
    showState("خطا در بارگذاری منو. لطفاً صفحه را دوباره باز کنید.");
  }
}

/* ---------- Rendering ---------- */

function renderFilters() {
  els.filters.innerHTML = state.categories
    .map(
      (cat) => `
      <button class="chip ${cat === state.activeCategory ? "is-active" : ""}"
              data-category="${escapeHtml(cat)}"
              aria-pressed="${cat === state.activeCategory}">
        ${escapeHtml(cat)}
      </button>`
    )
    .join("");
}

function getFilteredItems() {
  const term = normalize(state.searchTerm);

  return state.items.filter((item) => {
    const matchCategory =
      state.activeCategory === CONFIG.allLabel || item.category === state.activeCategory;

    const haystack = normalize(`${item.name || ""} ${item.description || ""}`);
    const matchSearch = !term || haystack.includes(term);

    return matchCategory && matchSearch;
  });
}

function cardTemplate(item) {
  const name = escapeHtml(item.name || "بدون نام");
  const desc = escapeHtml(item.description || "");
  const price = formatPrice(item.price);

  // Tags / badges
  const tagsHtml = Array.isArray(item.tags) && item.tags.length
    ? `<div class="tags">${item.tags
        .map((t) => `<span class="tag ${tagClass(t)}">${escapeHtml(t)}</span>`)
        .join("")}</div>`
    : "";

  // Image with graceful fallback
  const media = item.image
    ? `<img class="card__img" src="${escapeHtml(item.image)}" alt="${name}" loading="lazy"
           onerror="this.replaceWith(fallbackNode())">`
    : fallbackHtml();

  return `
    <article class="card">
      <div class="card__media">${media}</div>
      <div class="card__body">
        <div class="card__head">
          <h3 class="card__name">${name}</h3>
        </div>
        ${desc ? `<p class="card__desc">${desc}</p>` : ""}
        <div class="card__footer">
          ${tagsHtml}
          ${price ? `<span class="card__price">${price} <small>${CONFIG.currency}</small></span>` : ""}
        </div>
      </div>
    </article>`;
}

// Map known tag keywords to color classes.
function tagClass(tag) {
  const t = normalize(tag);
  if (/(تند|spicy)/.test(t)) return "tag--spicy";
  if (/(جدید|new)/.test(t)) return "tag--new";
  if (/(پرطرفدار|محبوب|hot|ویژه)/.test(t)) return "tag--hot";
  if (/(گیاهی|veg)/.test(t)) return "tag--veg";
  return "";
}

// Fallback placeholder markup (SVG cactus icon on hatched bg).
function fallbackHtml() {
  return `
    <div class="card__img--fallback" role="img" aria-label="تصویر موجود نیست">
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor"
           stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22V8"/><path d="M12 12H9a3 3 0 0 1-3-3V7"/>
        <path d="M12 14h3a3 3 0 0 0 3-3V9"/><path d="M9.5 22h5"/>
      </svg>
    </div>`;
}

// DOM node version, used by <img onerror>.
function fallbackNode() {
  const wrap = document.createElement("div");
  wrap.innerHTML = fallbackHtml().trim();
  return wrap.firstChild;
}
// expose for inline handler
window.fallbackNode = fallbackNode;

function render() {
  const items = getFilteredItems();

  if (!items.length) {
    els.grid.innerHTML = "";
    showState("موردی یافت نشد. عبارت دیگری را امتحان کنید.");
    return;
  }

  hideState();
  els.grid.innerHTML = items.map(cardTemplate).join("");
}

/* ---------- State box (loading / empty / error) ---------- */

function showState(message) {
  els.stateText.textContent = message;
  els.stateBox.hidden = false;
}
function hideState() {
  els.stateBox.hidden = true;
}

/* ---------- Event handlers ---------- */

function handleFilterClick(e) {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  state.activeCategory = btn.dataset.category;
  renderFilters();
  render();
}

const handleSearch = debounce((e) => {
  state.searchTerm = e.target.value;
  render();
}, 160);

function handleScroll() {
  els.backToTop.hidden = false;
  els.backToTop.classList.toggle("is-visible", window.scrollY > 400);
}

function scrollTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------- Init ---------- */

function init() {
  els.year.textContent = new Date().getFullYear();

  els.filters.addEventListener("click", handleFilterClick);
  els.search.addEventListener("input", handleSearch);
  window.addEventListener("scroll", handleScroll, { passive: true });
  els.backToTop.addEventListener("click", scrollTop);

  loadMenu();
}

document.addEventListener("DOMContentLoaded", init);
