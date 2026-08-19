const prototypes = [
    { id: 'menu-1', label: 'منوی اول', family: 'white', path: 'cactus-menu/', title: 'منوی دیجیتال | فست‌فود کاکتوس' },
    { id: 'menu-2', label: 'منوی دوم', family: 'green', path: 'cactus-menu-V1.1/', title: 'کاکتوس | منوی دیجیتال فست‌فود' },
    { id: 'menu-3', label: 'منوی سوم', family: 'green', path: 'cactus-menu-V1.2/', title: 'منوی دیجیتال کاکتوس | Cactus Fast Food' },
    { id: 'menu-4', label: 'منوی چهارم', family: 'red+green', path: 'cactus-menu-V1.2.1/', title: 'منوی دیجیتال فست‌فود' },
    { id: 'menu-5', label: 'منوی پنجم', family: 'red+green', path: 'cactus-menu-V1.2.2/', title: 'منوی دیجیتال کاکتوس | Cactus Fast Food' },
    { id: 'menu-6', label: 'منوی شیشم', family: 'red+green+dark', path: 'cactus-menu-V1.2.3/', title: 'کاکتوس | منوی دیجیتال فست‌فود' },
    { id: 'menu-7', label: 'منوی هفتم', family: 'red+green+dark', path: 'cactus-menu-V1.3/', title: 'منوی دیجیتال فست‌فود' },
];

const grid = document.getElementById('grid');
const filterGroup = document.getElementById('familyFilters');
const searchInput = document.getElementById('searchInput');
const resultCount = document.getElementById('resultCount');
const modal = document.getElementById('modal');
const modalFrame = document.getElementById('modalFrame');
const modalTitle = document.getElementById('modalTitle');
const modalPath = document.getElementById('modalPath');
const modalOpen = document.getElementById('modalOpen');
const frameWrap = document.getElementById('frameWrap');
const emptyState = document.getElementById('emptyState');

let currentFilter = 'همه';

function render(data) {
    grid.innerHTML = '';
    if (data.length === 0) {
        emptyState.hidden = false;
    } else {
        emptyState.hidden = true;
        data.forEach(p => {
            const card = document.createElement('div');
            card.className = 'proto-card';
            card.innerHTML = `
        <span class="badge">${p.family}</span>
        <h3>${p.label}</h3>
        <p>${p.title}</p>
      `;
            card.onclick = () => openModal(p);
            grid.appendChild(card);
        });
    }
    resultCount.textContent = `نمایش ${data.length} از ${prototypes.length} پروتوتایپ`;
}

function filterAndSearch() {
    const query = searchInput.value.toLowerCase();
    const filtered = prototypes.filter(p => {
        const matchFamily = currentFilter === 'همه' || p.family === currentFilter;
        const matchSearch = p.label.toLowerCase().includes(query) || p.title.toLowerCase().includes(query);
        return matchFamily && matchSearch;
    });
    render(filtered);
}

function openModal(p) {
    modalTitle.textContent = p.title;
    modalPath.textContent = p.path;
    modalFrame.src = p.path;
    modalOpen.href = p.path;
    modal.hidden = false;
    document.body.classList.add('modal-open');
}

document.querySelectorAll('[data-viewport]').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('[data-viewport]').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        frameWrap.className = 'frame-wrap ' + btn.dataset.viewport;
    };
});

document.getElementById('modalClose').onclick = () => {
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    modalFrame.src = 'about:blank';
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) document.getElementById('modalClose').click();
});

const families = ['همه', ...new Set(prototypes.map(p => p.family))];
families.forEach(f => {
    const count = prototypes.filter(p => p.family === f).length;
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (f === 'همه' ? ' is-active' : '');
    btn.innerHTML = `${f} <span class="count">${f === 'همه' ? prototypes.length : count}</span>`;
    btn.onclick = () => {
        currentFilter = f;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        filterAndSearch();
    };
    filterGroup.appendChild(btn);
});

searchInput.oninput = filterAndSearch;
render(prototypes);