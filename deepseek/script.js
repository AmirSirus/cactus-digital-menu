// ==================== script.js ====================
// منوی دیجیتال فست‌فود - تمام عملکردها با وانیلا جاوااسکریپت

// ---------- پیکربندی (در صورت نیاز این مقادیر را تغییر دهید) ----------
const MENU_URL = 'menu.json';   // مسیر فایل JSON

// ---------- متغیرهای سراسری ----------
let allItems = [];               // کل آیتم‌های منو
let currentCategory = 'all';     // دسته‌بندی فعال
let currentSearchTerm = '';      // متن جستجو

// ارجاع به عناصر DOM
const menuGrid = document.getElementById('menuGrid');
const searchInput = document.getElementById('searchInput');
const categoryFilters = document.getElementById('categoryFilters');
const resultsCount = document.getElementById('count');
const backToTopBtn = document.getElementById('backToTop');

// ---------- توابع کمکی ----------

// ساخت یک کارت غذا (DOM Element)
function createFoodCard(item) {
    // عنصر اصلی کارت
    const card = document.createElement('div');
    card.className = 'food-card';

    // عکس و وضعیت موجودی
    const imgContainer = document.createElement('div');
    imgContainer.className = 'card-img-container';

    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.name;
    img.loading = 'lazy';   // بارگذاری تنبل برای عملکرد بهتر
    // مدیریت خطای بارگذاری عکس
    img.onerror = () => {
        img.style.display = 'none';
        imgContainer.classList.add('img-placeholder');
        imgContainer.innerHTML = '🍽️';  // جایگزین با آیکون
    };

    imgContainer.appendChild(img);

    // برچسب وضعیت موجودی
    const availBadge = document.createElement('div');
    availBadge.className = `availability-badge ${item.available ? 'available' : 'unavailable'}`;
    availBadge.textContent = item.available ? 'موجود' : 'ناموجود';
    imgContainer.appendChild(availBadge);

    card.appendChild(imgContainer);

    // بدنه کارت
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    // نام
    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = item.name;
    cardBody.appendChild(title);

    // توضیحات (در صورت وجود)
    if (item.description) {
        const desc = document.createElement('p');
        desc.className = 'card-desc';
        desc.textContent = item.description;
        cardBody.appendChild(desc);
    }

    // فوتر: قیمت + برچسب‌ها
    const footer = document.createElement('div');
    footer.className = 'card-footer';

    const price = document.createElement('span');
    price.className = 'card-price';
    price.textContent = `${item.price.toLocaleString()} تومان`;
    footer.appendChild(price);

    // برچسب‌های اضافی (تگ‌ها)
    if (item.badges && item.badges.length > 0) {
        const badgesContainer = document.createElement('div');
        badgesContainer.className = 'badges';
        item.badges.forEach(badgeText => {
            const badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = badgeText;
            badgesContainer.appendChild(badge);
        });
        footer.appendChild(badgesContainer);
    }

    cardBody.appendChild(footer);
    card.appendChild(cardBody);

    return card;
}

// رندر کردن منو براساس فیلترها و جستجو
function renderMenu() {
    // فیلتر کردن آیتم‌ها
    let filteredItems = allItems;

    // فیلتر دسته‌بندی
    if (currentCategory !== 'all') {
        filteredItems = filteredItems.filter(item => item.category === currentCategory);
    }

    // فیلتر جستجو (متن جستجو را بر روی نام، توضیحات و برچسب‌ها اعمال می‌کنیم)
    if (currentSearchTerm.trim() !== '') {
        const term = currentSearchTerm.trim().toLowerCase();
        filteredItems = filteredItems.filter(item => {
            const haystack = [
                item.name,
                item.description || '',
                ...(item.badges || []),
                item.category
            ].join(' ').toLowerCase();
            return haystack.includes(term);
        });
    }

    // به‌روزرسانی تعداد نتایج
    resultsCount.textContent = filteredItems.length;

    // خالی کردن محتوای فعلی
    menuGrid.innerHTML = '';

    if (filteredItems.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = 'هیچ آیتمی یافت نشد. 😕';
        menuGrid.appendChild(empty);
    } else {
        filteredItems.forEach(item => {
            menuGrid.appendChild(createFoodCard(item));
        });
    }
}

// استخراج دسته‌بندی‌های یکتا از منو و ساخت دکمه‌های فیلتر
function buildCategoryFilters() {
    const categories = [...new Set(allItems.map(item => item.category))];
    // دکمه "همه" به عنوان پیش‌فرض
    const filtersContainer = categoryFilters;
    filtersContainer.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.className = 'category-btn active';
    allBtn.setAttribute('role', 'tab');
    allBtn.setAttribute('aria-selected', 'true');
    allBtn.textContent = 'همه';
    allBtn.dataset.category = 'all';
    filtersContainer.appendChild(allBtn);

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.setAttribute('role', 'tab');
        btn.dataset.category = cat;
        btn.textContent = cat;
        filtersContainer.appendChild(btn);
    });

    // گوش دهید به کلیک‌ها
    filtersContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.category-btn');
        if (!btn) return;

        // فعال‌سازی دکمه کلیک‌شده
        document.querySelectorAll('.category-btn').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        currentCategory = btn.dataset.category;
        renderMenu();
    });
}

// جستجوی زنده با debounce ساده
let debounceTimer;
function handleSearchInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        currentSearchTerm = searchInput.value;
        renderMenu();
    }, 300);
}

// کنترل دکمه بازگشت به بالا
function handleScroll() {
    if (window.scrollY > 300) {
        backToTopBtn.classList.add('visible');
    } else {
        backToTopBtn.classList.remove('visible');
    }
}

// اسکرول نرم به بالای صفحه
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- بارگذاری اولیه ----------
async function init() {
    try {
        const response = await fetch(MENU_URL);
        if (!response.ok) {
            throw new Error(`خطا در بارگذاری منو: ${response.status}`);
        }
        const data = await response.json();
        // اعتبارسنجی ساده ساختار JSON
        if (!Array.isArray(data)) {
            throw new Error('ساختار JSON باید یک آرایه باشد.');
        }
        allItems = data;
        buildCategoryFilters();
        renderMenu();
    } catch (error) {
        console.error(error);
        menuGrid.innerHTML = `<div class="empty-state">❌ خطا در بارگذاری منو. جزئیات بیشتر در کنسول.</div>`;
    }
}

// ---------- الحاق Event Listeners ----------
searchInput.addEventListener('input', handleSearchInput);
window.addEventListener('scroll', handleScroll, { passive: true });
backToTopBtn.addEventListener('click', scrollToTop);

// شروع برنامه
init();
