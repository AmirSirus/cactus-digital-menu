/* ===================================================
   کاکتوس - منطق منوی دیجیتال
   خواندن داده از menu.json + فیلتر + جستجوی زنده
   =================================================== */

"use strict";

/* ---------- انتخاب المان‌های DOM ---------- */
const els = {
  grid: document.getElementById("menuGrid"),
  filters: document.getElementById("filters"),
  search: document.getElementById("searchInput"),
  loader: document.getElementById("loader"),
  empty: document.getElementById("emptyState"),
  backToTop: document.getElementById("backToTop"),
};

/* ---------- وضعیت اپلیکیشن ---------- */
const state = {
  items: [],          // همه آیتم‌های منو
  activeCategory: "all", // دسته‌ی فعال
  query: "",          // متن جستجو
};

/* تصویر جایگزین وقتی لینک تصویر خراب باشد (SVG درون‌خطی، بدون درخواست شبکه) */
const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23202020'/%3E%3Ctext x='50%25' y='55%25' font-size='90' text-anchor='middle' fill='%23e11d2a' opacity='0.5'%3E%F0%9F%8C%B5%3C/text%3E%3C/svg%3E";

/* ---------- ابزار: فرمت قیمت با جداکننده هزارگان فارسی ---------- */
function formatPrice(value) {
  if (value == null || value === "") return "";
  return Number(value).toLocaleString("fa-IR");
}

/* ---------- ابزار: جلوگیری از تزریق HTML (امنیت) ---------- */
function escapeHTML(str = "") {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- ساخت کارت یک غذا ---------- */
function createCard(item) {
  const hasImage = item.image && item.image.trim() !== "";
  const badge = item.badge
    ? `<span class="badge">${escapeHTML(item.badge)}</span>`
    : "";

  const article = document.createElement("article");
  article.className = "card";
  article.setAttribute("role", "listitem");

  article.innerHTML = `
    <div class="card-media ${hasImage ? "" : "placeholder"}">
      ${
        hasImage
          ? `<img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}" loading="lazy" />`
          : ""
      }
    </div>
    <div class="card-body">
      <h3 class="card-title">${escapeHTML(item.name)}</h3>
      <p class="card-desc">${escapeHTML(item.description || "")}</p>
      <div class="card-footer">
        <span class="card-price">${formatPrice(item.price)} <small>تومان</small></span>
        ${badge}
      </div>
    </div>
  `;

  /* fallback تصویر: اگر لینک خراب بود، placeholder نمایش داده می‌شود */
  const img = article.querySelector("img");
  if (img) {
    img.addEventListener("error", () => {
      img.src = PLACEHOLDER;
      img.closest(".card-media").classList.add("placeholder-fallback");
    });
  }

  return article;
}

/* ---------- رندر لیست غذاها بر اساس فیلتر و جستجو ---------- */
function render() {
  const q = state.query.trim().toLowerCase();

  const filtered = state.items.filter((item) => {
    // تطبیق دسته‌بندی
    const matchCategory =
      state.activeCategory === "all" || item.category === state.activeCategory;

    // تطبیق متن جستجو در نام و توضیح
    const haystack = `${item.name} ${item.description || ""}`.toLowerCase();
    const matchQuery = q === "" || haystack.includes(q);

    return matchCategory && matchQuery;
  });

  els.grid.innerHTML = "";

  // مدیریت حالت خالی
  els.empty.classList.toggle("hidden", filtered.length !== 0);

  // درج کارت‌ها با DocumentFragment برای کارایی بهتر
  const fragment = document.createDocumentFragment();
  filtered.forEach((item) => fragment.appendChild(createCard(item)));
  els.grid.appendChild(fragment);
}

/* ---------- ساخت دکمه‌های دسته‌بندی به‌صورت پویا ---------- */
function buildFilters() {
  // استخراج دسته‌های یکتا از داده‌ها
  const categories = ["all", ...new Set(state.items.map((i) => i.category).filter(Boolean))];

  const labels = { all: "همه" }; // برچسب فارسی برای «همه»

  els.filters.innerHTML = "";
  categories.forEach((cat, index) => {
    const btn = document.createElement("button");
    btn.className = "filter-btn" + (index === 0 ? " active" : "");
    btn.textContent = labels[cat] || cat;
    btn.dataset.category = cat;
    btn.setAttribute("role", "tab");

    btn.addEventListener("click", () => {
      state.activeCategory = cat;
      // به‌روزرسانی کلاس فعال
      els.filters.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      render();
    });

    els.filters.appendChild(btn);
  });
}

/* ---------- جستجوی زنده با debounce برای کاهش رندرهای اضافی ---------- */
function debounce(fn, delay = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

els.search.addEventListener(
  "input",
  debounce((e) => {
    state.query = e.target.value;
    render();
  })
);

/* ---------- دکمه بازگشت به بالا ---------- */
window.addEventListener("scroll", () => {
  els.backToTop.classList.toggle("show", window.scrollY > 400);
});
els.backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* ---------- بارگذاری داده‌ها از menu.json ---------- */
async function loadMenu() {
  try {
    const res = await fetch("menu.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    state.items = Array.isArray(data.items) ? data.items : [];

    els.loader.classList.add("hidden");
    buildFilters();
    render();
  } catch (err) {
    // نمایش پیام خطای دوستانه به کاربر
    console.error("خطا در بارگذاری منو:", err);
    els.loader.textContent = "خطا در بارگذاری منو. لطفاً صفحه را دوباره باز کنید.";
  }
}

/* ---------- شروع اپلیکیشن ---------- */
loadMenu();
