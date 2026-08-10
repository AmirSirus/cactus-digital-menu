const prototypes = [
    { id: 'claude-0', label: 'Claude 0', family: 'Claude', path: '../../claude-0/', title: 'منوی دیجیتال | فست‌فود کاکتوس' },
    { id: 'claude-1', label: 'Claude 1', family: 'Claude', path: '../../claude-1/', title: 'کاکتوس | منوی دیجیتال فست‌فود' },
    { id: 'claude-2', label: 'Claude 2', family: 'Claude', path: '../../claude-2/', title: 'منوی دیجیتال کاکتوس | Cactus Fast Food' },
    { id: 'gpt-0', label: 'GPT-0', family: 'GPT', path: '../../gpt-0/', title: 'منوی دیجیتال فست‌فود' },
    { id: 'gpt-1', label: 'GPT-1', family: 'GPT', path: '../../gpt-1/', title: 'منوی دیجیتال کاکتوس | Cactus Fast Food' },
    { id: 'gpt-2', label: 'GPT-2', family: 'GPT', path: '../../gpt-2/', title: 'کاکتوس | منوی دیجیتال فست‌فود' },
    { id: 'gemini', label: 'Gemini', family: 'Google', path: '../../gemini/', title: 'منوی دیجیتال فست‌فود' },
    { id: 'p-c01', label: 'Pre-Beta C0.1', family: 'Pre-Beta', path: '../../pre-beta/claude-0.1/', title: 'منوی دیجیتال | فست‌فود کاکتوس' },
    { id: 'p-c11', label: 'Pre-Beta C1.1', family: 'Pre-Beta', path: '../../pre-beta/claude-1.1/', title: 'کاکتوس | منوی دیجیتال فست‌فود' },
    { id: 'p-c12', label: 'Pre-Beta C1.2', family: 'Pre-Beta', path: '../../pre-beta/claude-1.2/', title: 'کاکتوس | منوی دیجیتال فست‌فود' },
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