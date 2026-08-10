/**
 * منوی دیجیتال فست‌فود — منطق برنامه
 * ------------------------------------------------
 * وظایف:
 *  1. خواندن داده از menu.json
 *  2. ساخت دکمه‌های دسته‌بندی
 *  3. رندر کارت‌های غذا
 *  4. فیلتر دسته‌بندی + جستجوی زنده
 *  5. شمارش نتایج، مدیریت خطای عکس، دکمه‌های ارتباطی
 *
 * نکته: هیچ داده‌ای اینجا hardcode نشده؛ همه‌چیز از menu.json می‌آید.
 */

"use strict";

/* ====== وضعیت سراسری برنامه (State) ====== */
const state = {
  items: [],            // همه آیتم‌های غذا
  info: {},             // اطلاعات رستوران (تماس، آدرس، ...)
  activeCategory: "all", // دسته فعال
  searchQuery: "",       // متن جستجو
};

/* ====== انتخاب المان‌های DOM ====== */
const els = {
  menu: document.getElementById("menu"),
  categories: document.getElementById("categories"),
  search: document.getElementById("searchInput"),
  resultCount: document.getElementById("resultCount"),
  emptyState: document.getElementById("emptyState"),
  errorState: document.getElementById("errorState"),
  footerHours: document.getElementById("footerHours"),
  callBtn: document.getElementById("callBtn"),
  mapBtn: document.getElementById("mapBtn"),
  instaBtn: document.getElementById("instaBtn"),
  backToTop: document.getElementById("backToTop"),
};

/* ====== نقطه شروع ====== */
init();

async function init() {
  try {
    const res = await fetch("menu.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // ذخیره در state (با مقدار پیش‌فرض امن)
    state.items = Array.isArray(data.items) ? data.items : [];
    state.info = data.info || {};

    renderRestaurantInfo();
    buildCategories();
    render();
    attachEvents();
  } catch (err) {
    console.error("خطا در بارگذاری منو:", err);
    els.errorState.hidden = false;
    els.menu.hidden = true;
  }
}

/* ============================================================
   اطلاعات رستوران: دکمه‌های ارتباطی و ساعت کاری
   ============================================================ */
function renderRestaurantInfo() {
  const { phone, mapUrl, instagram, hours } = state.info;

  if (phone) els.callBtn.href = `tel:${phone}`;
  if (mapUrl) els.mapBtn.href = mapUrl;
  if (instagram) els.instaBtn.href = instagram;
  if (hours) els.footerHours.textContent = `ساعت کاری: ${hours}`;
}

/* ============================================================
   ساخت دکمه‌های دسته‌بندی به‌صورت داینامیک
   ============================================================ */
function buildCategories() {
  // استخراج دسته‌های یکتا از خود داده‌ها
  const unique = [...new Set(state.items.map((i) => i.category))];
  const categories = ["all", ...unique];

  els.categories.innerHTML = categories
    .map((cat) => {
      const label = cat === "all" ? "همه" : cat;
      const active = cat === state.activeCategory ? "is-active" : "";
      return `<button class="category-btn ${active}"
                data-category="${escapeHtml(cat)}"
                aria-pressed="${cat === state.activeCategory}">
                ${escapeHtml(label)}
              </button>`;
    })
    .join("");
}

/* ============================================================
   فیلتر: ترکیب دسته‌بندی فعال + متن جستجو
   ============================================================ */
function getFilteredItems() {
  const q = state.searchQuery.trim().toLowerCase();

  return state.items.filter((item) => {
    const matchCat =
      state.activeCategory === "all" || item.category === state.activeCategory;

    const matchSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      (item.desc || "").toLowerCase().includes(q);

    return matchCat && matchSearch;
  });
}

/* ============================================================
   رندر اصلی: کارت‌ها + شمارنده + حالت خالی
   ============================================================ */
function render() {
  const items = getFilteredItems();

  // شمارنده نتایج
  els.resultCount.textContent = `${toFa(items.length)} مورد یافت شد`;

  // حالت خالی
  els.emptyState.hidden = items.length !== 0;

  // ساخت کارت‌ها
  els.menu.innerHTML = items.map(cardTemplate).join("");
}

/* ============================================================
   قالب یک کارت غذا
   ============================================================ */
function cardTemplate(item) {
  const available = item.available !== false; // پیش‌فرض: موجود

  // بَج‌ها
  const badges = (item.badges || [])
    .map((b) => `<span class="badge">${escapeHtml(b)}</span>`)
    .join("");

  // برچسب موجودی
  const stock = available
    ? `<span class="stock stock--in">موجود</span>`
    : `<span class="stock stock--out">ناموجود</span>`;

  // عکس با مدیریت خطا (onerror → placeholder)
  const img = item.image
    ? `<img src="${escapeHtml(item.image)}"
           alt="${escapeHtml(item.name)}"
           class="card__img"
           loading="lazy"
           onerror="this.outerHTML='<div class=\\'card__img card__img--placeholder\\'>🍔</div>'" />`
    : `<div class="card__img card__img--placeholder">🍔</div>`;

  // قیمت با جداکننده هزارگان و ارقام فارسی
  const price =
    typeof item.price === "number"
      ? `${toFa(item.price.toLocaleString("en-US"))} <span>تومان</span>`
      : "—";

  return `
    <article class="card ${available ? "" : "is-unavailable"}">
      <div class="card__img-wrap">${img}</div>
      <div class="card__body">
        <div class="card__header">
          <h2 class="card__name">${escapeHtml(item.name)}</h2>
          ${stock}
        </div>
        ${badges ? `<div class="badges">${badges}</div>` : ""}
        ${item.desc ? `<p class="card__desc">${escapeHtml(item.desc)}</p>` : ""}
        <div class="card__footer">
          <span class="card__price">${price}</span>
        </div>
      </div>
    </article>`;
}

/* ============================================================
   رویدادها
   ============================================================ */
function attachEvents() {
  // کلیک روی دسته‌بندی (Event Delegation)
  els.categories.addEventListener("click", (e) => {
    const btn = e.target.closest(".category-btn");
    if (!btn) return;

    state.activeCategory = btn.dataset.category;

    // به‌روزرسانی حالت فعال دکمه‌ها
    els.categories.querySelectorAll(".category-btn").forEach((b) => {
      const isActive = b === btn;
      b.classList.toggle("is-active", isActive);
      b.setAttribute("aria-pressed", isActive);
    });

    render();
  });

  // جستجوی زنده (با debounce برای کارایی)
  els.search.addEventListener("input", debounce((e) => {
    state.searchQuery = e.target.value;
    render();
  }, 200));

  // بازگشت به بالا: نمایش/پنهان‌سازی بر اساس اسکرول
  window.addEventListener("scroll", () => {
    els.backToTop.hidden = window.scrollY < 300;
  });

  els.backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ============================================================
   توابع کمکی (Utilities)
   ============================================================ */

// تبدیل ارقام انگلیسی به فارسی
function toFa(input) {
  return String(input).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
}

// جلوگیری از تزریق HTML (XSS) هنگام درج داده‌های JSON
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}

// تاخیر در اجرا برای کاهش دفعات رندر هنگام تایپ
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
