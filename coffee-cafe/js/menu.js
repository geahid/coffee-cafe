// ============================================================
// MENU.JS — Menu Page Logic
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const tableParam = urlParams.get('table');
  if (tableParam) {
    localStorage.setItem('brewhaus_table', tableParam);
    showToast(`📍 Ordering for Table ${tableParam}`, 'info', 4000);
    const tableBanner = document.getElementById('table-banner');
    if (tableBanner) {
      tableBanner.textContent = `Table ${tableParam}`;
      tableBanner.parentElement.style.display = 'flex';
    }
  }

  renderMenu('all');
  initCategoryFilter();
  initSearch();
});

function renderMenu(category = 'all', searchQuery = '') {
  const grid = document.getElementById('menu-grid');
  if (!grid) return;

  let items = MENU_ITEMS;
  if (category !== 'all') items = items.filter(i => i.category === category);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    items = items.filter(i => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
  }

  if (items.length === 0) {
    grid.innerHTML = `<div class="no-results"><span>☕</span><p>No items found for "${searchQuery}"</p></div>`;
    return;
  }

  grid.innerHTML = items.map((item, idx) => `
    <div class="menu-card" style="animation-delay: ${idx * 0.05}s" data-id="${item.id}">
      ${item.popular ? '<span class="popular-badge">⭐ Popular</span>' : ''}
      <div class="menu-card-emoji">${item.emoji}</div>
      <div class="menu-card-body">
        <h3 class="menu-card-name">${item.name}</h3>
        <p class="menu-card-desc">${item.description}</p>
        <div class="menu-card-footer">
          <span class="menu-card-price">$${item.price.toFixed(2)}</span>
          <button class="btn-add-cart" onclick="handleAddToCart('${item.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Animate cards in
  requestAnimationFrame(() => {
    grid.querySelectorAll('.menu-card').forEach(card => card.classList.add('visible'));
  });
}

function handleAddToCart(itemId) {
  const item = MENU_ITEMS.find(i => i.id === itemId);
  if (!item) return;
  addToCart(item);
  const btn = document.querySelector(`[data-id="${itemId}"] .btn-add-cart`);
  if (btn) {
    btn.textContent = '✓ Added!';
    btn.classList.add('added');
    setTimeout(() => {
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add`;
      btn.classList.remove('added');
    }, 1500);
  }
}

function initCategoryFilter() {
  const btns = document.querySelectorAll('.category-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.category;
      const searchQuery = document.getElementById('menu-search')?.value || '';
      renderMenu(cat, searchQuery);
    });
  });
}

function initSearch() {
  const searchInput = document.getElementById('menu-search');
  if (!searchInput) return;
  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const activeCategory = document.querySelector('.category-btn.active')?.dataset.category || 'all';
      renderMenu(activeCategory, searchInput.value);
    }, 300);
  });
}

window.handleAddToCart = handleAddToCart;
