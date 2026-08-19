/* =====================================================================
   Cactus Digital Menu — Application Logic
   ساختار: State → DOM refs → Utils → Data selection → Render → Events → Init
   الگو: state-driven؛ منبع حقیقت داده «state» است و UI از آن مشتق می‌شود.
   ===================================================================== */

"use strict";

/* ---------- 1) State ----------
   تنها منبع حقیقت. هر تغییر باید render را صدا بزند تا UI هم‌گام بماند. */
const state = {
  items: [],           // آیتم‌های خام از menu.json
  activeCategory: "all", // دسته‌ی فعال ("all" = همه)
  query: "",           // متن جستجو
};

/* ---------- 2) DOM References ----------
   یک‌بار در ابتدا گرفته می‌شوند تا از query تکراری جلوگیری شود. */
const el = {
  search: document.getElementById("searchInput"),
  filters: document.getElementById("filters"),
  grid: document.getElementById("menuGrid"),
  status: document.getElementById("statusMessage"),
  empty: document.getElementById("emptyState"),
  backToTop: document.getElementById("backToTop"),
};

/* فرمت قیمت بر اساس محلی فارسی؛ یک‌بار ساخته می‌شود (بهینه). */
const priceFormatter = new Intl.NumberFormat("fa-IR");
const PLACEHOLDER_IMAGE = "assets/logo.svg";

/* ---------- 3) Utilities ---------- */

/**
 * نرمال‌سازی متن برای جستجوی مقاوم:
 * یکسان‌سازی «ی/ك» عربی به فارسی، حذف فاصله‌های اضافی و lowercase.
 * توسعه‌ی آینده: در صورت نیاز حذف اعراب هم اینجا اضافه شود.
 */
function normalizeText(value = "") {
  return value
    .toString()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .trim()
    .toLowerCase();
}

/** تبدیل عدد قیمت به رشته‌ی فارسی همراه واحد. */
function formatPrice(price) {
  return `${priceFormatter.format(price)} تومان`;
}

/** منبع تصویر معتبر یا لوگوی برند به‌عنوان placeholder. */
function resolveImageSource(item) {
  const source = typeof item.image === "string" ? item.image.trim() : "";
  return source || PLACEHOLDER_IMAGE;
}

/** اعمال placeholder یکسان برای تصویرهای خالی یا خراب. */
function applyPlaceholderImage(img) {
  img.src = PLACEHOLDER_IMAGE;
  img.classList.add("menu-card__image--placeholder");
}

/** استخراج دسته‌های یکتا از آیتم‌ها (برای ساخت فیلترها). */
function uniqueCategories(items) {
  return [...new Set(items.map((item) => item.category))];
}

/* ---------- 4) Data selection ----------
   منطق فیلتر + جستجو یکجا. تنها نقطه‌ای که تصمیم می‌گیرد چه آیتمی دیده شود.
   مزیت: تست‌پذیر و مستقل از DOM. */
function matchesQuery(item, normalizedQuery) {
  if (!normalizedQuery) return true;
  const haystack = normalizeText(
    `${item.name} ${item.category} ${item.description} ${item.badge}`
  );
  return haystack.includes(normalizedQuery);
}

function getVisibleItems() {
  const normalizedQuery = normalizeText(state.query);
  return state.items.filter((item) => {
    const inCategory =
      state.activeCategory === "all" || item.category === state.activeCategory;
    return inCategory && matchesQuery(item, normalizedQuery);
  });
}

/* ---------- 5) Rendering ---------- */

/**
 * ساخت یک کارت به‌صورت امن با createElement + textContent.
 * چرا نه innerHTML؟ چون textContent به‌طور ذاتی جلوی XSS را می‌گیرد و
 * دیگر نیازی به escape دستی نیست.
 */
function createMenuCard(item) {
  const card = document.createElement("article");
  card.className = "menu-card";

  // رسانه + بج
  const media = document.createElement("div");
  media.className = "menu-card__media";

  const img = document.createElement("img");
  const imageSource = resolveImageSource(item);
  img.src = imageSource;
  img.alt = item.name;
  img.loading = "lazy"; // بهبود performance هنگام اسکرول
  img.className = "menu-card__image";
  if (imageSource === PLACEHOLDER_IMAGE) {
    img.classList.add("menu-card__image--placeholder");
  }
  // fallback مستقیم روی همین img؛ بدون افزودن listener سراسری تکراری.
  img.addEventListener("error", () => {
    applyPlaceholderImage(img);
  }, { once: true });

  media.appendChild(img);

  if (item.badge) {
    const badge = document.createElement("span");
    badge.className = "menu-card__badge";
    badge.textContent = item.badge;
    media.appendChild(badge);
  }

  // بدنه
  const body = document.createElement("div");
  body.className = "menu-card__body";

  const title = document.createElement("h3");
  title.className = "menu-card__title";
  title.textContent = item.name;

  const category = document.createElement("span");
  category.className = "menu-card__category";
  category.textContent = item.category;

  const description = document.createElement("p");
  description.className = "menu-card__description";
  description.textContent = item.description;

  const meta = document.createElement("div");
  meta.className = "menu-card__meta";

  const price = document.createElement("span");
  price.className = "menu-card__price";
  price.textContent = formatPrice(item.price);

  meta.appendChild(price);
  body.append(title, category, description, meta);
  card.append(media, body);

  return card;
}

/** رندر شبکه‌ی منو بر اساس آیتم‌های قابل‌نمایش. */
function renderMenu() {
  const visible = getVisibleItems();

  // پاک‌سازی و بازسازی (DocumentFragment برای کاهش reflow).
  const fragment = document.createDocumentFragment();
  visible.forEach((item) => fragment.appendChild(createMenuCard(item)));

  el.grid.replaceChildren(fragment);

  // مدیریت حالت خالی و پیام وضعیت (a11y: از طریق aria-live اعلام می‌شود).
  const isEmpty = visible.length === 0;
  el.empty.hidden = !isEmpty;
  el.status.textContent = isEmpty
    ? "نتیجه‌ای برای نمایش وجود ندارد."
    : `${priceFormatter.format(visible.length)} مورد نمایش داده شد.`;
}

/** به‌روزرسانی ظاهر دکمه‌ی فیلتر فعال + وضعیت aria. */
function updateActiveFilterUI() {
  const buttons = el.filters.querySelectorAll(".filter-btn");
  buttons.forEach((btn) => {
    const isActive = btn.dataset.category === state.activeCategory;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });
}

/** ساخت دکمه‌های فیلتر (شامل «همه» + دسته‌های یکتا). */
function renderFilters() {
  const categories = ["all", ...uniqueCategories(state.items)];

  const fragment = document.createDocumentFragment();
  categories.forEach((category) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "filter-btn";
    btn.dataset.category = category;
    btn.textContent = category === "all" ? "همه" : category;
    btn.addEventListener("click", () => {
      state.activeCategory = category;
      updateActiveFilterUI();
      renderMenu();
    });
    fragment.appendChild(btn);
  });

  el.filters.replaceChildren(fragment);
  updateActiveFilterUI();
}

/* ---------- 6) Events ---------- */

/**
 * debounce ساده برای جستجو تا با هر کلید render سنگین اجرا نشود.
 * توسعه‌ی آینده: اگر داده خیلی بزرگ شد، این مقدار قابل تنظیم است.
 */
function debounce(fn, delay = 180) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const handleSearchInput = debounce((event) => {
  state.query = event.target.value;
  renderMenu();
});

/** نمایش/پنهان‌سازی دکمه‌ی بازگشت به بالا و اسکرول نرم. */
function setupBackToTop() {
  const toggle = () => {
    el.backToTop.classList.toggle("is-visible", window.scrollY > 400);
  };
  window.addEventListener("scroll", toggle, { passive: true });
  el.backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  toggle();
}

/* ---------- 7) Init ---------- */

/**
 * بارگذاری داده از menu.json با مدیریت خطای کاربرپسند.
 * خطاها به فارسی و داخل status نمایش داده می‌شوند تا کاربر سردرگم نشود.
 */
async function loadMenu() {
  try {
    const response = await fetch("menu.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("فرمت داده نامعتبر است.");

    state.items = data;
    renderFilters();
    renderMenu();
  } catch (error) {
    console.error("خطا در بارگذاری منو:", error);
    el.status.textContent = "خطا در بارگذاری منو. لطفاً صفحه را دوباره باز کنید.";
    el.empty.hidden = false;
  }
}

function init() {
  el.search.addEventListener("input", handleSearchInput);
  setupBackToTop();
  loadMenu();
}

// defer در HTML تضمین می‌کند DOM آماده است؛ اما این محافظ اضافی هم بی‌ضرر است.
document.addEventListener("DOMContentLoaded", init);
