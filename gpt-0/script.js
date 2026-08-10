"use strict";

/*
 * منوی دیجیتال فست‌فود
 * تمام اطلاعات رستوران و آیتم‌های منو از menu.json خوانده می‌شود.
 */

const state = {
  config: null,
  items: [],
  activeCategory: "all",
  searchQuery: ""
};

const elements = {
  restaurantName: document.querySelector("#restaurant-name"),
  restaurantSlogan: document.querySelector("#restaurant-slogan"),
  heroTitle: document.querySelector("#hero-title"),
  heroDescription: document.querySelector("#hero-description"),
  footerRestaurantName: document.querySelector("#footer-restaurant-name"),
  footerAddress: document.querySelector("#footer-address"),

  headerCallLink: document.querySelector("#header-call-link"),
  heroCallLink: document.querySelector("#hero-call-link"),
  footerCallLink: document.querySelector("#footer-call-link"),
  headerInstagramLink: document.querySelector("#header-instagram-link"),
  footerInstagramLink: document.querySelector("#footer-instagram-link"),
  directionsLink: document.querySelector("#directions-link"),

  searchInput: document.querySelector("#search-input"),
  clearSearch: document.querySelector("#clear-search"),
  categoryFilters: document.querySelector("#category-filters"),
  menuGrid: document.querySelector("#menu-grid"),
  resultCount: document.querySelector("#result-count"),
  emptyState: document.querySelector("#empty-state"),
  errorState: document.querySelector("#error-state"),
  retryButton: document.querySelector("#retry-button"),
  backToTop: document.querySelector("#back-to-top")
};

document.addEventListener("DOMContentLoaded", initialize);

async function initialize() {
  bindEvents();
  await loadMenu();
}

function bindEvents() {
  elements.searchInput.addEventListener("input", handleSearch);

  elements.clearSearch.addEventListener("click", () => {
    elements.searchInput.value = "";
    state.searchQuery = "";
    updateClearButton();
    renderMenu();
    elements.searchInput.focus();
  });

  elements.retryButton.addEventListener("click", loadMenu);

  elements.backToTop.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });

  window.addEventListener("scroll", () => {
    elements.backToTop.hidden = window.scrollY < 500;
  });
}

async function loadMenu() {
  showLoadingState();

  try {
    const response = await fetch("menu.json", {
      cache: "no-cache"
    });

    if (!response.ok) {
      throw new Error(`خطای دریافت منو: ${response.status}`);
    }

    const data = await response.json();

    validateMenuData(data);

    state.config = data.restaurant;
    state.items = data.items;

    applyRestaurantInfo();
    renderCategoryFilters();
    renderMenu();
  } catch (error) {
    console.error(error);
    showErrorState();
  }
}

function validateMenuData(data) {
  if (!data || typeof data !== "object") {
    throw new Error("ساختار menu.json معتبر نیست.");
  }

  if (!data.restaurant || !Array.isArray(data.items)) {
    throw new Error("بخش‌های restaurant و items در menu.json الزامی هستند.");
  }
}

function applyRestaurantInfo() {
  const restaurant = state.config;

  document.title = restaurant.pageTitle || restaurant.name;

  setText(elements.restaurantName, restaurant.name);
  setText(elements.restaurantSlogan, restaurant.slogan);
  setText(elements.heroTitle, restaurant.heroTitle);
  setText(elements.heroDescription, restaurant.heroDescription);
  setText(elements.footerRestaurantName, restaurant.name);
  setText(elements.footerAddress, restaurant.address);

  const phone = restaurant.phone || "";
  const phoneHref = `tel:${phone.replace(/\s+/g, "")}`;

  elements.headerCallLink.href = phoneHref;
  elements.heroCallLink.href = phoneHref;
  elements.footerCallLink.href = phoneHref;

  elements.headerInstagramLink.href = restaurant.instagram;
  elements.footerInstagramLink.href = restaurant.instagram;
  elements.directionsLink.href = restaurant.mapUrl;
}

function renderCategoryFilters() {
  const categories = state.config.categories || [];

  elements.categoryFilters.replaceChildren();

  const allButton = createCategoryButton(
    "all",
    "همه",
    state.activeCategory === "all"
  );

  elements.categoryFilters.appendChild(allButton);

  categories.forEach((category) => {
    const button = createCategoryButton(
      category.id,
      category.title,
      state.activeCategory === category.id
    );

    elements.categoryFilters.appendChild(button);
  });
}

function createCategoryButton(id, title, isActive) {
  const button = document.createElement("button");

  button.type = "button";
  button.className = "category-button";
  button.textContent = title;
  button.dataset.category = id;
  button.setAttribute("role", "tab");
  button.setAttribute("aria-selected", String(isActive));

  if (isActive) {
    button.classList.add("active");
  }

  button.addEventListener("click", () => {
    state.activeCategory = id;
    renderCategoryFilters();
    renderMenu();
  });

  return button;
}

function handleSearch(event) {
  state.searchQuery = normalizeText(event.target.value);
  updateClearButton();
  renderMenu();
}

function updateClearButton() {
  elements.clearSearch.hidden = state.searchQuery.length === 0;
}

function getFilteredItems() {
  return state.items.filter((item) => {
    const matchesCategory =
      state.activeCategory === "all" ||
      item.category === state.activeCategory;

    const searchableText = normalizeText([
      item.name,
      item.description,
      item.category,
      ...(item.badges || [])
    ].join(" "));

    const matchesSearch =
      state.searchQuery.length === 0 ||
      searchableText.includes(state.searchQuery);

    return matchesCategory && matchesSearch;
  });
}

function renderMenu() {
  const filteredItems = getFilteredItems();

  elements.menuGrid.setAttribute("aria-busy", "false");
  elements.menuGrid.replaceChildren();

  elements.resultCount.textContent =
    `${toPersianNumber(filteredItems.length)} مورد`;

  elements.emptyState.hidden = filteredItems.length !== 0;

  if (filteredItems.length === 0) {
    return;
  }

  const fragment = document.createDocumentFragment();

  filteredItems.forEach((item) => {
    fragment.appendChild(createMenuCard(item));
  });

  elements.menuGrid.appendChild(fragment);
}

function createMenuCard(item) {
  const article = document.createElement("article");
  article.className = "menu-card";

  if (!item.available) {
    article.classList.add("is-unavailable");
  }

  const imageWrapper = document.createElement("div");
  imageWrapper.className = "card-image-wrapper";

  const image = document.createElement("img");
  image.className = "card-image";
  image.src = item.image;
  image.alt = item.imageAlt || item.name;
  image.loading = "lazy";

  image.addEventListener("error", () => {
    image.src = createPlaceholderImage(item.name);
    image.alt = `تصویر در دسترس نیست: ${item.name}`;
  }, { once: true });

  const badges = document.createElement("div");
  badges.className = "card-badges";

  (item.badges || []).forEach((badgeText, index) => {
    const badge = document.createElement("span");
    badge.className = "badge";

    if (index === 0) {
      badge.classList.add("badge-highlight");
    }

    badge.textContent = badgeText;
    badges.appendChild(badge);
  });

  if (!item.available) {
    const unavailableBadge = document.createElement("span");
    unavailableBadge.className = "badge badge-danger";
    unavailableBadge.textContent = "ناموجود";
    badges.appendChild(unavailableBadge);
  }

  imageWrapper.append(image, badges);

  const body = document.createElement("div");
  body.className = "card-body";

  const titleRow = document.createElement("div");
  titleRow.className = "card-title-row";

  const title = document.createElement("h3");
  title.className = "card-title";
  title.textContent = item.name;

  const price = document.createElement("span");
  price.className = "card-price";
  price.textContent = formatPrice(item.price, item.currency);

  titleRow.append(title, price);

  const description = document.createElement("p");
  description.className = "card-description";
  description.textContent = item.description;

  const footer = document.createElement("div");
  footer.className = "card-footer";

  const availability = document.createElement("span");
  availability.className = "availability";

  if (!item.available) {
    availability.classList.add("unavailable");
  }

  availability.textContent = item.available ? "موجود" : "فعلاً موجود نیست";

  const category = document.createElement("span");
  category.className = "category-label";
  category.textContent = getCategoryTitle(item.category);

  footer.append(availability, category);
  body.append(titleRow, description, footer);
  article.append(imageWrapper, body);

  return article;
}

function getCategoryTitle(categoryId) {
  const category = (state.config.categories || []).find(
    (item) => item.id === categoryId
  );

  return category ? category.title : categoryId;
}

function formatPrice(price, currency = "تومان") {
  if (price === null || price === undefined || price === "") {
    return "تماس بگیرید";
  }

  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return `${price} ${currency}`;
  }

  return `${toPersianNumber(numericPrice.toLocaleString("fa-IR"))} ${currency}`;
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("fa-IR")
    .replace(/ي/g, "ی")
    .replace(/ى/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, " ")
    .replace(/\s+/g, " ");
}

function toPersianNumber(value) {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[digit]);
}

function createPlaceholderImage(title) {
  const safeTitle = String(title)
    .replace(/[<>&"]/g, "")
    .slice(0, 28);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
      <rect width="800" height="500" fill="#242424"/>
      <circle cx="400" cy="210" r="78" fill="#ff5a1f" opacity=".9"/>
      <text x="400" y="235" fill="white" font-size="86" text-anchor="middle">🍽</text>
      <text x="400" y="390" fill="#d1d1d1" font-size="30" text-anchor="middle"
            font-family="Tahoma, Arial">${safeTitle}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function showLoadingState() {
  elements.errorState.hidden = true;
  elements.emptyState.hidden = true;
  elements.menuGrid.hidden = false;
  elements.menuGrid.setAttribute("aria-busy", "true");

  elements.menuGrid.innerHTML = `
    <div class="loading-state">
      <span class="loading-spinner" aria-hidden="true"></span>
      <p>در حال دریافت منو...</p>
    </div>
  `;
};

function showErrorState() {
  elements.menuGrid.hidden = true;
  elements.emptyState.hidden = true;
  elements.errorState.hidden = false;
  elements.resultCount.textContent = "خطا در دریافت اطلاعات";
}

function setText(element, value) {
  if (element && value !== undefined && value !== null) {
    element.textContent = value;
  }
}
