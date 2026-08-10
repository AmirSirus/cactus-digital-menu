const state = {
  items: [],
  activeCategory: "all",
  query: ""
};

const elements = {
  searchInput: document.getElementById("searchInput"),
  filters: document.getElementById("filters"),
  menuGrid: document.getElementById("menuGrid"),
  emptyState: document.getElementById("emptyState"),
  statusMessage: document.getElementById("statusMessage"),
  backToTop: document.getElementById("backToTop")
};

const priceFormatter = new Intl.NumberFormat("fa-IR");

function normalizeText(value = "") {
  return String(value)
    .normalize("NFKC")
    .replace(/[ك]/g, "ک")
    .replace(/[يى]/g, "ی")
    .toLowerCase()
    .trim();
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatPrice(value) {
  const numericValue = Number(value) || 0;
  return `${priceFormatter.format(numericValue)} تومان`;
}

function createPlaceholder(title = "کاکتوس") {
  const safeTitle = escapeHtml(title).slice(0, 32);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" role="img" aria-label="${safeTitle}">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#1d1d27"/>
          <stop offset="100%" stop-color="#0d0d12"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stop-color="#ff5a54" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#ff5a54" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="800" height="500" rx="36" fill="url(#bg)"/>
      <rect width="800" height="500" rx="36" fill="url(#glow)"/>
      <circle cx="400" cy="240" r="120" fill="none" stroke="#e53935" stroke-width="6" stroke-opacity="0.28"/>
      <circle cx="400" cy="240" r="76" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.16"/>
      <path d="M385 300c-12-19-26-29-39-36 14-7 25-17 33-31 10 13 22 23 39 29-14 9-25 20-33 38Z" fill="#e53935" fill-opacity="0.9"/>
      <text x="400" y="360" text-anchor="middle" fill="#f5f5f7" font-size="28" font-family="Tahoma, Arial, sans-serif">کاکتوس</text>
      <text x="400" y="396" text-anchor="middle" fill="#b4b4bf" font-size="18" font-family="Tahoma, Arial, sans-serif">${safeTitle}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function resolveImageSource(value, title) {
  const trimmed = String(value ?? "").trim();
  return trimmed || createPlaceholder(title);
}

function uniqueCategories(items) {
  return [...new Set(items.map((item) => String(item.category || "").trim()).filter(Boolean))];
}

function renderFilters(categories) {
  const buttons = [
    { key: "all", label: "همه" },
    ...categories.map((category) => ({ key: category, label: category }))
  ];

  elements.filters.innerHTML = buttons
    .map(
      (button) => `
        <button
          class="filter-btn${button.key === state.activeCategory ? " is-active" : ""}"
          type="button"
          data-category="${escapeHtml(button.key)}"
          role="tab"
          aria-pressed="${button.key === state.activeCategory ? "true" : "false"}"
        >
          ${escapeHtml(button.label)}
        </button>
      `
    )
    .join("");

  elements.filters.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeCategory = button.dataset.category || "all";
      updateActiveFilterUI();
      renderMenu();
    });
  });
}

function updateActiveFilterUI() {
  elements.filters.querySelectorAll(".filter-btn").forEach((button) => {
    const isActive = (button.dataset.category || "all") === state.activeCategory;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function matchesQuery(item, query) {
  if (!query) return true;

  const haystack = normalizeText(
    [
      item.name,
      item.category,
      item.description,
      item.badge
    ].join(" ")
  );

  return haystack.includes(query);
}

function renderMenu() {
  const query = normalizeText(state.query);

  const filteredItems = state.items.filter((item) => {
    const matchesCategory =
      state.activeCategory === "all" || String(item.category || "") === state.activeCategory;
    return matchesCategory && matchesQuery(item, query);
  });

  elements.menuGrid.innerHTML = filteredItems
    .map((item) => {
      const imageSrc = resolveImageSource(item.image, item.name);
      const tagLabel = item.badge || item.category || "ویژه";
      const price = formatPrice(item.price);

      return `
        <article class="menu-card">
          <figure class="menu-card__media">
            <img
              src="${escapeHtml(imageSrc)}"
              alt="${escapeHtml(item.name)}"
              loading="lazy"
              decoding="async"
            />
            <span class="menu-card__badge">${escapeHtml(tagLabel)}</span>
          </figure>

          <div class="menu-card__body">
            <div class="menu-card__title-row">
              <div>
                <h2 class="menu-card__title">${escapeHtml(item.name)}</h2>
                <p class="menu-card__category">${escapeHtml(item.category || "")}</p>
              </div>
            </div>

            <p class="menu-card__description">${escapeHtml(item.description || "")}</p>

            <div class="menu-card__meta">
              <span class="menu-card__price"><strong>${price}</strong></span>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  bindImageFallbacks();

  const hasItems = filteredItems.length > 0;
  elements.emptyState.hidden = hasItems;
  elements.menuGrid.hidden = !hasItems;

  if (hasItems) {
    elements.statusMessage.textContent = "";
  } else {
    elements.statusMessage.textContent = "موردی برای نمایش پیدا نشد.";
  }
}

function bindImageFallbacks() {
  elements.menuGrid.querySelectorAll("img").forEach((imageElement) => {
    imageElement.addEventListener(
      "error",
      () => {
        if (imageElement.dataset.fallbackApplied === "true") return;
        imageElement.dataset.fallbackApplied = "true";
        imageElement.src = createPlaceholder(imageElement.alt || "کاکتوس");
      },
      { once: true }
    );
  });
}

async function loadMenu() {
  elements.statusMessage.textContent = "در حال بارگذاری منو...";
  try {
    const response = await fetch("menu.json", { cache: "no-cache" });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid menu format");
    }

    state.items = data;
    renderFilters(uniqueCategories(data));
    renderMenu();
    elements.statusMessage.textContent = "";
  } catch (error) {
    console.error("Failed to load menu.json:", error);
    elements.statusMessage.textContent = "بارگذاری منو با خطا مواجه شد.";

    elements.menuGrid.innerHTML = "";
    elements.menuGrid.hidden = true;
    elements.emptyState.hidden = false;
    elements.emptyState.querySelector("h2").textContent = "خطا در دریافت منو";
    elements.emptyState.querySelector("p").textContent =
      "فایل menu.json در دسترس نیست یا فرمت آن معتبر نیست.";
  }
}

function handleSearchInput(event) {
  state.query = event.target.value || "";
  renderMenu();
}

function setupBackToTop() {
  const toggleButton = () => {
    const shouldShow = window.scrollY > 320;
    elements.backToTop.classList.toggle("is-visible", shouldShow);
  };

  window.addEventListener("scroll", toggleButton, { passive: true });
  toggleButton();

  elements.backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

elements.searchInput.addEventListener("input", handleSearchInput);
setupBackToTop();
loadMenu();
