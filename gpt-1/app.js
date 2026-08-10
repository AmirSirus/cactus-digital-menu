"use strict";

const CONFIG = {
  menuFile: "menu.json",
  allCategoryLabel: "همه",
  currencyLabel: "تومان",
  fallbackAlt: "تصویر غذا در دسترس نیست"
};

const state = {
  menuItems: [],
  selectedCategory: CONFIG.allCategoryLabel,
  searchTerm: ""
};

const elements = {
  menuGrid: document.getElementById("menuGrid"),
  categoryFilters: document.getElementById("categoryFilters"),
  searchInput: document.getElementById("searchInput"),
  clearSearchBtn: document.getElementById("clearSearchBtn"),
  loadingState: document.getElementById("loadingState"),
  errorState: document.getElementById("errorState"),
  emptyState: document.getElementById("emptyState"),
  retryBtn: document.getElementById("retryBtn"),
  backToTopBtn: document.getElementById("backToTopBtn")
};

document.addEventListener("DOMContentLoaded", init);

function init() {
  bindEvents();
  loadMenu();
}

function bindEvents() {
  elements.searchInput.addEventListener("input", handleSearchInput);
  elements.clearSearchBtn.addEventListener("click", clearSearch);
  elements.retryBtn.addEventListener("click", loadMenu);
  elements.backToTopBtn.addEventListener("click", scrollToTop);

  window.addEventListener("scroll", handleBackToTopVisibility, { passive: true });
}

async function loadMenu() {
  setLoadingState(true);
  setErrorState(false);
  setEmptyState(false);
  clearMenuGrid();

  try {
    const response = await fetch(CONFIG.menuFile, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Failed to load menu file. Status: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("menu.json must contain an array of menu items.");
    }

    state.menuItems = normalizeMenuItems(data);
    renderCategories();
    renderMenu();
  } catch (error) {
    console.error(error);
    setErrorState(true);
  } finally {
    setLoadingState(false);
  }
}

function normalizeMenuItems(items) {
  return items
    .filter((item) => item && typeof item === "object")
    .map((item, index) => ({
      id: item.id ?? `item-${index + 1}`,
      name: toSafeString(item.name),
      category: toSafeString(item.category) || "سایر",
      description: toSafeString(item.description),
      price: item.price,
      image: toSafeString(item.image),
      badges: normalizeBadges(item.badges ?? item.tags ?? item.badge ?? item.tag)
    }))
    .filter((item) => item.name && item.category);
}

function normalizeBadges(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map(toSafeString).filter(Boolean);
  }

  const badge = toSafeString(value);
  return badge ? [badge] : [];
}

function renderCategories() {
  const categories = [
    CONFIG.allCategoryLabel,
    ...new Set(state.menuItems.map((item) => item.category))
  ];

  elements.categoryFilters.replaceChildren();

  categories.forEach((category) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "category-btn";
    button.textContent = category;
    button.dataset.category = category;
    button.setAttribute("role", "listitem");
    button.setAttribute("aria-pressed", String(category === state.selectedCategory));

    if (category === state.selectedCategory) {
      button.classList.add("is-active");
    }

    button.addEventListener("click", () => {
      state.selectedCategory = category;
      updateActiveCategoryButton();
      renderMenu();
    });

    elements.categoryFilters.appendChild(button);
  });
}

function renderMenu() {
  const items = getFilteredItems();

  clearMenuGrid();

  if (items.length === 0) {
    setEmptyState(true);
    return;
  }

  setEmptyState(false);

  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    fragment.appendChild(createMenuCard(item));
  });

  elements.menuGrid.appendChild(fragment);
}

function getFilteredItems() {
  const search = normalizeSearchText(state.searchTerm);

  return state.menuItems.filter((item) => {
    const matchesCategory =
      state.selectedCategory === CONFIG.allCategoryLabel ||
      item.category === state.selectedCategory;

    const searchableText = normalizeSearchText(
      `${item.name} ${item.description} ${item.category} ${item.badges.join(" ")}`
    );

    const matchesSearch = !search || searchableText.includes(search);

    return matchesCategory && matchesSearch;
  });
}

function createMenuCard(item) {
  const article = document.createElement("article");
  article.className = "menu-card";
  article.setAttribute("aria-label", item.name);

  const media = createCardMedia(item);
  const body = createCardBody(item);

  article.append(media, body);

  return article;
}

function createCardMedia(item) {
  const media = document.createElement("div");
  media.className = "card-media";

  const img = document.createElement("img");
  img.loading = "lazy";
  img.decoding = "async";
  img.alt = item.name;
  img.src = item.image || "";

  const placeholder = document.createElement("div");
  placeholder.className = "image-placeholder";
  placeholder.setAttribute("aria-label", CONFIG.fallbackAlt);

  const placeholderMark = document.createElement("div");
  placeholderMark.className = "placeholder-mark";

  const icon = document.createElement("span");
  icon.textContent = "🌵";

  const text = document.createElement("span");
  text.textContent = "Cactus";

  placeholderMark.append(icon, text);
  placeholder.appendChild(placeholderMark);

  if (!item.image) {
    img.hidden = true;
    placeholder.classList.add("is-visible");
  }

  img.addEventListener("error", () => {
    img.hidden = true;
    placeholder.classList.add("is-visible");
  });

  media.append(img, placeholder);

  return media;
}

function createCardBody(item) {
  const body = document.createElement("div");
  body.className = "card-body";

  const top = document.createElement("div");
  top.className = "card-top";

  const title = document.createElement("h3");
  title.className = "card-title";
  title.textContent = item.name;

  top.appendChild(title);

  const description = document.createElement("p");
  description.className = "card-description";
  description.textContent = item.description || "توضیحی برای این آیتم ثبت نشده است.";

  const footer = document.createElement("div");
  footer.className = "card-footer";

  const price = createPriceElement(item.price);
  const badges = createBadgesElement(item.badges);

  footer.append(price, badges);
  body.append(top, description, footer);

  return body;
}

function createPriceElement(priceValue) {
  const price = document.createElement("div");
  price.className = "price";
  price.setAttribute("aria-label", `قیمت ${formatPrice(priceValue)} ${CONFIG.currencyLabel}`);

  const number = document.createElement("span");
  number.className = "price-number";
  number.textContent = formatPrice(priceValue);

  const currency = document.createElement("span");
  currency.className = "price-currency";
  currency.textContent = CONFIG.currencyLabel;

  price.append(number, currency);

  return price;
}

function createBadgesElement(badges) {
  const wrapper = document.createElement("div");
  wrapper.className = "badges";

  badges.forEach((badgeText) => {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = badgeText;
    wrapper.appendChild(badge);
  });

  return wrapper;
}

function updateActiveCategoryButton() {
  const buttons = elements.categoryFilters.querySelectorAll(".category-btn");

  buttons.forEach((button) => {
    const isActive = button.dataset.category === state.selectedCategory;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function handleSearchInput(event) {
  state.searchTerm = event.target.value;
  elements.clearSearchBtn.classList.toggle("is-visible", Boolean(state.searchTerm.trim()));
  renderMenu();
}

function clearSearch() {
  state.searchTerm = "";
  elements.searchInput.value = "";
  elements.clearSearchBtn.classList.remove("is-visible");
  elements.searchInput.focus();
  renderMenu();
}

function handleBackToTopVisibility() {
  const shouldShow = window.scrollY > 420;
  elements.backToTopBtn.classList.toggle("is-visible", shouldShow);
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function setLoadingState(isVisible) {
  elements.loadingState.hidden = !isVisible;
}

function setErrorState(isVisible) {
  elements.errorState.hidden = !isVisible;
}

function setEmptyState(isVisible) {
  elements.emptyState.hidden = !isVisible;
}

function clearMenuGrid() {
  elements.menuGrid.replaceChildren();
}

function toSafeString(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function normalizeSearchText(value) {
  return toSafeString(value)
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[۰-۹]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
    .replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit))
    .replace(/\s+/g, " ")
    .trim();
}

function formatPrice(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return toPersianDigits(value.toLocaleString("en-US"));
  }

  const safeValue = toSafeString(value);

  if (!safeValue) {
    return "ثبت نشده";
  }

  const numericValue = Number(safeValue.replace(/[^\d]/g, ""));

  if (Number.isFinite(numericValue) && numericValue > 0) {
    return toPersianDigits(numericValue.toLocaleString("en-US"));
  }

  return toPersianDigits(safeValue);
}

function toPersianDigits(value) {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  return String(value).replace(/\d/g, (digit) => persianDigits[digit]);
}
