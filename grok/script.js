// script.js
let menuData = [];
let cart = [];
let currentCategory = 'all';
let searchTerm = '';

async function loadMenu() {
    try {
        const response = await fetch('menu.json');
        const data = await response.json();
        menuData = data.items;
        renderMenu();
        updateCartCount();
    } catch (error) {
        console.error('خطا در بارگذاری منو:', error);
        document.getElementById('menu-grid').innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #ef4444;">
                ❌ خطا در بارگذاری منو. لطفاً فایل menu.json را بررسی کنید.
            </div>
        `;
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

function renderMenu(filteredItems = menuData) {
    const container = document.getElementById('menu-grid');
    container.innerHTML = '';

    const resultsCount = document.getElementById('results-count');
    resultsCount.textContent = `${filteredItems.length} آیتم یافت شد`;

    if (filteredItems.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; color: var(--text-secondary);">
                😕 متأسفانه چیزی یافت نشد.<br>دسته‌بندی یا کلیدواژه را تغییر دهید.
            </div>
        `;
        return;
    }

    filteredItems.forEach(item => {
        const card = document.createElement('div');
        card.className = `card ${!item.available ? 'out-of-stock' : ''}`;
        card.innerHTML = `
            <div class="card-image">
                <img src="${item.image}" alt="${item.name}" 
                     onerror="this.src='https://picsum.photos/id/29/600/400'">
                ${item.tags && item.tags.length > 0 ? 
                    `<div class="tags">${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
                ${!item.available ? `<span class="out-badge">ناموجود</span>` : ''}
            </div>
            <div class="card-info">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <div class="card-footer">
                    <span class="price">${item.price.toLocaleString('fa-IR')} تومان</span>
                    <button ${!item.available ? 'disabled' : ''} 
                            onclick="addToCart(${item.id})">
                        ${item.available ? 'اضافه به سبد' : 'موجود نیست'}
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function filterMenu() {
    let filtered = menuData;

    if (currentCategory !== 'all') {
        filtered = filtered.filter(item => item.category === currentCategory);
    }

    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(item => 
            item.name.toLowerCase().includes(term) || 
            item.description.toLowerCase().includes(term)
        );
    }

    renderMenu(filtered);
}

function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('search-input');
    const debouncedSearch = debounce((value) => {
        searchTerm = value;
        filterMenu();
    }, 300);

    searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });

    // Category filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            filterMenu();
        });
    });
}

function addToCart(id) {
    const item = menuData.find(i => i.id === id);
    if (!item) return;

    if (!item.available) {
        alert('متأسفانه این محصول در حال حاضر موجود نیست.');
        return;
    }

    cart.push(item);
    updateCartCount();
    alert(`✅ ${item.name} به سبد اضافه شد!`);
}

function updateCartCount() {
    const countEl = document.getElementById('cart-count');
    countEl.textContent = cart.length;
}

function renderCart() {
    const cartContainer = document.getElementById('cart-items');
    cartContainer.innerHTML = '';

    let total = 0;

    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                سبد خرید شما خالی است.<br>از منو چیز بخرید!
            </div>
        `;
        return;
    }

    cart.forEach((item, index) => {
        total += item.price;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <div class="cart-item-price">${item.price.toLocaleString('fa-IR')} تومان</div>
            </div>
            <button onclick="removeFromCart(${index})" style="background:none;border:none;color:#ef4444;font-size:1.5rem;cursor:pointer;">✕</button>
        `;
        cartContainer.appendChild(div);
    });

    document.getElementById('cart-total').textContent = `${total.toLocaleString('fa-IR')} تومان`;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartCount();
    renderCart();
    filterMenu(); // refresh menu to enable out-of-stock items if they were added
}

function openCart() {
    renderCart();
    document.getElementById('cart-sidebar').classList.add('open');
}

function closeCart() {
    document.getElementById('cart-sidebar').classList.remove('open');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadMenu();
    setupEventListeners();

    // Cart button
    document.getElementById('cart-btn').addEventListener('click', openCart);
    document.getElementById('close-cart').addEventListener('click', closeCart);

    // Back to top
    const backToTop = document.querySelector('.back-to-top');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 600) {
            backToTop.style.opacity = '1';
        } else {
            backToTop.style.opacity = '0.6';
        }
    });

    // Close cart when clicking outside
    document.getElementById('cart-sidebar').addEventListener('click', (e) => {
        if (e.target === document.getElementById('cart-sidebar')) {
            closeCart();
        }
    });
});
