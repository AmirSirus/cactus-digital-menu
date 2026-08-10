// --- State Management ---
let menuData = [];
let currentFilter = 'all';
let searchQuery = '';

// --- DOM Elements ---
const menuGrid = document.getElementById('menuGrid');
const searchInput = document.getElementById('searchInput');
const categoryButtons = document.querySelectorAll('.cat-btn');
const resultsCount = document.getElementById('resultsCount');
const backToTopBtn = document.getElementById('backToTop');

// --- Helper: Format Price to Persian ---
const formatPrice = (price) => {
    return price.toLocaleString('fa-IR') + ' تومان';
};

// --- Helper: Handle Image Error (Placeholder) ---
const handleImageError = (imgElement) => {
    // A subtle placeholder image from Placehold.co tailored for dark theme
    imgElement.src = 'https://placehold.co/500x400/1e1e1e/aaaaaa?text=تصویر+موجود+نیست&font=Vazirmatn';
};

// --- Fetch Data from JSON ---
const fetchMenu = async () => {
    try {
        const response = await fetch('menu.json');
        if (!response.ok) throw new Error('Network response was not ok');
        menuData = await response.json();
        renderMenu();
    } catch (error) {
        console.error('Error fetching menu:', error);
        menuGrid.innerHTML = `<div class="loader">خطا در بارگذاری منو. لطفا صفحه را رفرش کنید.</div>`;
    }
};

// --- Render Menu Cards ---
const renderMenu = () => {
    // 1. Filter and Search Logic
    const filteredData = menuData.filter(item => {
        const matchesCategory = currentFilter === 'all' || item.category === currentFilter;
        const matchesSearch = item.name.includes(searchQuery) || item.description.includes(searchQuery);
        return matchesCategory && matchesSearch;
    });

    // 2. Update Results Count
    resultsCount.textContent = filteredData.length.toLocaleString('fa-IR');

    // 3. Generate HTML
    if (filteredData.length === 0) {
        menuGrid.innerHTML = `<div class="loader">موردی یافت نشد.</div>`;
        return;
    }

    menuGrid.innerHTML = filteredData.map(item => {
        const isAvailable = item.available;
        const availabilityClass = isAvailable ? '' : 'out-of-stock';
        
        // Badges HTML
        let badgesHtml = item.badges.map(b => `<span class="badge">${b}</span>`).join('');
        if (!isAvailable) {
            badgesHtml += `<span class="badge oos">ناموجود</span>`;
        }

        return `
            <article class="card ${availabilityClass}">
                <div class="card-img-wrapper">
                    <img class="card-img" 
                         src="${item.image}" 
                         alt="${item.name}" 
                         loading="lazy"
                         onerror="handleImageError(this)">
                    <div class="badges">
                        ${badgesHtml}
                    </div>
                </div>
                <div class="card-content">
                    <h2 class="card-title">${item.name}</h2>
                    <p class="card-desc">${item.description}</p>
                    <div class="card-footer">
                        <span class="card-price">${formatPrice(item.price)}</span>
                    </div>
                </div>
            </article>
        `;
    }).join('');
};

// --- Event Listeners ---

// Search
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    renderMenu();
});

// Category Filter
categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all
        categoryButtons.forEach(b => b.classList.remove('active'));
        // Add to clicked
        btn.classList.add('active');
        // Update filter state and render
        currentFilter = btn.getAttribute('data-filter');
        
        // Scroll slightly to top of grid
        window.scrollTo({ top: document.querySelector('.categories-nav').offsetTop, behavior: 'smooth' });
        
        renderMenu();
    });
});

// Back to Top functionality using IntersectionObserver for performance
const handleScroll = () => {
    if (window.scrollY > 300) {
        backToTopBtn.classList.add('show');
    } else {
        backToTopBtn.classList.remove('show');
    }
};
window.addEventListener('scroll', handleScroll);

backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// --- Initialize ---
document.addEventListener('DOMContentLoaded', fetchMenu);
