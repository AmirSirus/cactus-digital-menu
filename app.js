/**
 * app.js — منطق منوی دیجیتال کاکتوس
 * -----------------------------------
 * جریان داده تک‌مسیره: state → render()
 * هر تعامل (جستجو و فیلتر) فقط state را تغییر می‌دهد و سپس render فراخوانی می‌شود.
 */

"use strict";

/* ============================================================
   ۱) ثابت‌ها و پیکربندی
   ============================================================ */
const MENU_URL = "menu.json";
const SEARCH_DEBOUNCE_MS = 120;
const DEFAULT_CURRENCY = "تومان";
const PLACEHOLDER_LOGO = "assets/logo.svg";

// قالب‌بندی عدد فارسی (بدون واحد؛ واحد جداگانه افزوده می‌شود)
const numberFormatter = new Intl.NumberFormat("fa-IR");

/* ============================================================
   ۲) State — تنها منبع حقیقت برنامه
   ============================================================ */
const state = {
  items: [],
  activeCategory: "all",
  query: "",
};

/* ============================================================
   ۳) انتخاب عناصر DOM
   ============================================================ */
const dom = {
  searchInput: document.getElementById("searchInput"),
  filters: document.getElementById("filters"),
  menuGrid: document.getElementById("menuGrid"),
  emptyState: document.getElementById("emptyState"),
  statusMessage: document.getElementById("statusMessage"),
  backToTop: document.getElementById("backToTop"),
};

// نقشه‌ی id آیتم → عنصر کارت، برای رندر افزایشی (بدون بازسازی کل grid)
const cardElements = new Map();

/* ============================================================
   ۴) ابزارهای متن و ایمنی
   ============================================================ */

// نرمال‌سازی متن فارسی برای جستجوی مقاوم (یکسان‌سازی ک/ی عربی و عادی)
function normalize(text = "") {
  return String(text)
    .normalize("NFKC")
    .replace(/ك/g, "ک")
    .replace(/[يى]/g, "ی")
    .trim()
    .toLowerCase();
}

// جلوگیری از تزریق HTML هنگام درج داده‌ی JSON در DOM
function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatPrice(price, currency = DEFAULT_CURRENCY) {
  if (typeof price !== "number" || Number.isNaN(price)) return "";
  return `${numberFormatter.format(price)} ${currency}`;
}

/* ============================================================
   ۵) تصویر پیش‌فرض (placeholder) و fallback
   ============================================================ */
function hasImage(src) {
  return typeof src === "string" && src.trim().length > 0;
}

function createImagePlaceholder(item) {
  const placeholder = document.createElement("div");
  placeholder.className = "menu-card__placeholder";
  placeholder.setAttribute("role", "img");
  placeholder.setAttribute("aria-label", `تصویر ${item.name}`);

  const logo = document.createElement("img");
  logo.className = "menu-card__placeholder-logo";
  logo.src = PLACEHOLDER_LOGO;
  logo.alt = "";
  logo.setAttribute("aria-hidden", "true");

  const title = document.createElement("span");
  title.className = "menu-card__placeholder-title";
  title.textContent = item.name;

  placeholder.append(logo, title);
  return placeholder;
}

function createMediaContent(item) {
  if (!hasImage(item.image)) return createImagePlaceholder(item);

  const img = document.createElement("img");
  img.className = "menu-card__image";
  img.src = item.image.trim();
  img.alt = item.name;
  img.loading = "lazy";
  img.width = 400;
  img.height = 300;
  img.addEventListener(
    "error",
    () => {
      img.replaceWith(createImagePlaceholder(item));
    },
    { once: true }
  );
  return img;
}

/* ============================================================
   ۶) ساخت عناصر کارت (یک بار برای هر آیتم)
   ============================================================ */
function createCard(item, index) {
  const card = document.createElement("article");
  card.className = "menu-card";
  card.dataset.id = item.id;

  card.innerHTML = `
    <div class="menu-card__media">
      ${item.badge ? `<span class="menu-card__badge menu-card__badge--${index % 4}">${escapeHtml(item.badge)}</span>` : ""}
    </div>
    <div class="menu-card__body">
      <h3 class="menu-card__title">${escapeHtml(item.name)}</h3>
      <p class="menu-card__category">${escapeHtml(item.category)}</p>
      <p class="menu-card__desc">${escapeHtml(item.description || "")}</p>
      <p class="menu-card__price">${formatPrice(item.price, item.currency)}</p>
    </div>
  `;

  card.querySelector(".menu-card__media").prepend(createMediaContent(item));

  return card;
}

/* ============================================================
   ۷) فیلترینگ
   ============================================================ */
function matchesQuery(item, q) {
  if (!q) return true;
  const haystack = normalize(
    [item.name, item.category, item.description, item.badge].filter(Boolean).join(" ")
  );
  return haystack.includes(q);
}

function matchesCategory(item, category) {
  if (category === "all") return true;
  return item.category === category;
}

function getVisibleItems() {
  const q = normalize(state.query);
  return state.items.filter(
    (item) => matchesCategory(item, state.activeCategory) && matchesQuery(item, q)
  );
}

/* ============================================================
   ۸) رندر فیلترها (دسته‌ها)
   ============================================================ */
function renderFilters() {
  const categories = [...new Set(state.items.map((i) => i.category))];
  const tabs = [
    { key: "all", label: "همه" },
    ...categories.map((c) => ({ key: c, label: c })),
  ];

  dom.filters.innerHTML = tabs
    .map(
      (t) => `
      <button type="button" class="filter-btn ${
        t.key === state.activeCategory ? "is-active" : ""
      }" aria-pressed="${t.key === state.activeCategory}"
              data-category="${escapeHtml(t.key)}">${escapeHtml(t.label)}</button>`
    )
    .join("");
}

/* ============================================================
   ۹) رندر افزایشی منو — قلب بهینه‌سازی
   ============================================================ */
function render() {
  // نخستین بار: کارت‌ها ساخته و در نقشه ذخیره می‌شوند
  if (cardElements.size === 0 && state.items.length > 0) {
    const fragment = document.createDocumentFragment();
    for (const [index, item] of state.items.entries()) {
      const card = createCard(item, index);
      cardElements.set(item.id, card);
      fragment.appendChild(card);
    }
    dom.menuGrid.appendChild(fragment);
  }

  // فیلتر و نمایش/پنهان‌سازی به‌جای بازسازی
  const visible = getVisibleItems();
  const visibleIds = new Set(visible.map((i) => i.id));

  for (const [id, card] of cardElements) {
    const show = visibleIds.has(id);
    card.hidden = !show;
  }

  // empty state و اعلام نتیجه به screen reader
  const count = visible.length;
  dom.emptyState.hidden = count > 0;
  dom.statusMessage.textContent =
    count > 0 ? `${numberFormatter.format(count)} مورد یافت شد.` : "موردی یافت نشد.";
}

/* ============================================================
   ۱۰) رویدادها
   ============================================================ */
function setupSearch() {
  let timer;
  dom.searchInput.addEventListener("input", (e) => {
    clearTimeout(timer);
    const value = e.target.value;
    timer = setTimeout(() => {
      state.query = value;
      render();
    }, SEARCH_DEBOUNCE_MS);
  });
}

function setupFilters() {
  // event delegation روی کانتینر فیلترها
  dom.filters.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    state.activeCategory = btn.dataset.category;
    renderFilters();
    render();
  });
}

function setupBackToTop() {
  if (!dom.backToTop) return;
  window.addEventListener(
    "scroll",
    () => {
      dom.backToTop.classList.toggle("is-visible", window.scrollY > 400);
    },
    { passive: true }
  );
  dom.backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ============================================================
   ۱۱) بارگذاری داده
   ============================================================ */
async function loadMenu() {
  try {
    const response = await fetch(MENU_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("فرمت داده نامعتبر است");

    state.items = data;
    renderFilters();
    render();
  } catch (error) {
    console.error("خطا در بارگذاری منو:", error);
    dom.statusMessage.textContent =
      "فایل menu.json در دسترس نیست یا فرمت آن معتبر نیست.";
    dom.emptyState.hidden = false;
  }
}

/* ============================================================
   ۱۲) راه‌اندازی
   ============================================================ */
function init() {
  setupSearch();
  setupFilters();
  setupBackToTop();
  loadMenu();
}

init();
