import { mockProducts } from './data/products.js';
import { ProductCard } from './components/ProductCard.js';
import { ProductDetailsModal } from './components/ProductDetailsModal.js';
import { CartDrawer } from './components/CartManager.js';
import { CheckoutWizard } from './components/CheckoutWizard.js';
import { OrderHistory } from './components/OrderHistory.js';
import { Toast } from './components/Toast.js';

// --- State Properties ---
let activeTab = 'shop'; // 'shop' | 'orders'
let selectedCategory = 'all'; // 'all' | 'tech' | 'apparel' | 'accessories' | 'decor'
let searchQuery = '';
let currentTheme = 'dark'; // 'dark' | 'light'

let cart = [];
let activePromo = null;
let orders = [];

// Available Coupon Codes
const PROMO_CODES = {
  'WELCOME10': { code: 'WELCOME10', type: 'percent', value: 10 },
  'AURA20': { code: 'AURA20', type: 'percent', value: 20 },
  'SUPER50': { code: 'SUPER50', type: 'percent', value: 50 }
};

// Drawer instance
let activeCartDrawer = null;

// DOM Cached Refs
let appRoot = null;
let mainContentArea = null;
let searchInput = null;
let headerActionsArea = null;
let categoryFiltersArea = null;
let headerTitleText = null;
let headerSubtitleText = null;

// --- Initialize App ---
function init() {
  appRoot = document.getElementById('app');

  // 1. Load configuration from localStorage
  currentTheme = localStorage.getItem('aura_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);

  try {
    const storedCart = localStorage.getItem('aura_cart');
    cart = storedCart ? JSON.parse(storedCart) : [];
  } catch (e) {
    cart = [];
  }

  try {
    const storedOrders = localStorage.getItem('aura_orders');
    orders = storedOrders ? JSON.parse(storedOrders) : [];
  } catch (e) {
    orders = [];
  }

  // 2. Render Main Grid Shell
  renderShell();

  // 3. Setup Global Elements Listeners
  bindEvents();

  // 4. Switch to Initial View
  switchTab(activeTab);
}

// --- Render Core App Shell ---
function renderShell() {
  appRoot.innerHTML = `
    <div class="app-container">
      <!-- Sidebar Panel (Desktop) -->
      <aside class="sidebar">
        <div>
          <a href="#" class="brand-wrapper" id="brand-home-link">
            <div class="brand-logo">A</div>
            <span class="brand-name">Aura</span>
          </a>
          
          <ul class="sidebar-nav">
            <li class="nav-item active" data-tab="shop">
              <span class="nav-icon">🛍️</span>
              <span class="nav-text">Shop Boutique</span>
            </li>
            <li class="nav-item" data-tab="orders">
              <span class="nav-icon">📦</span>
              <span class="nav-text">Order History</span>
            </li>
          </ul>
        </div>
        
        <div class="sidebar-footer">
          <button class="theme-toggle-btn" aria-label="Toggle Aura color theme">
            <span class="theme-icon">${currentTheme === 'dark' ? '☀️' : '🌙'}</span>
            <span class="theme-text">${currentTheme === 'dark' ? 'Light View' : 'Dark View'}</span>
          </button>
        </div>
      </aside>

      <!-- Main Workspace Section -->
      <main class="main-workspace">
        <header class="main-header">
          <div class="header-title">
            <h1 id="header-title-text">Curated Boutique</h1>
            <p id="header-subtitle-text">Explore modern high-end lifestyle tech, apparel, and home decor.</p>
          </div>
          
          <div class="header-actions" id="main-header-actions">
            <div class="search-wrapper">
              <span class="search-icon">🔍</span>
              <input type="text" class="search-input" id="global-search-bar" placeholder="Search our collection...">
              <button class="search-clear-btn" id="global-search-clear" aria-label="Clear search" style="display: none;">&times;</button>
            </div>
            
            <button class="cart-trigger-btn" id="header-cart-btn" aria-label="Open Shopping Bag">
              <span>🛒</span>
              <span class="cart-badge" id="header-cart-badge">0</span>
            </button>
          </div>
        </header>

        <!-- Category Tags Selector -->
        <div class="filters-bar" id="category-filters-container">
          <button class="filter-btn active" data-category="all">All Items</button>
          <button class="filter-btn" data-category="tech">Technology</button>
          <button class="filter-btn" data-category="apparel">Apparel</button>
          <button class="filter-btn" data-category="accessories">Accessories</button>
          <button class="filter-btn" data-category="decor">Home Decor</button>
        </div>

        <!-- Dynamic Main Panel Content -->
        <div id="workspace-dynamic-content"></div>
      </main>
    </div>

    <!-- Mobile Bottom Navigation Bar -->
    <nav class="mobile-nav-bar">
      <div class="mobile-nav-item active" data-tab="shop">
        <span>🛍️</span>
        <span>Shop</span>
      </div>
      <div class="mobile-nav-item" id="mobile-cart-trigger">
        <span style="position: relative;">
          🛒
          <span class="cart-badge" id="mobile-cart-badge">0</span>
        </span>
        <span>Bag</span>
      </div>
      <div class="mobile-nav-item" data-tab="orders">
        <span>📦</span>
        <span>Orders</span>
      </div>
    </nav>
  `;

  // Connect local DOM caching
  mainContentArea = document.getElementById('workspace-dynamic-content');
  searchInput = document.getElementById('global-search-bar');
  headerActionsArea = document.getElementById('main-header-actions');
  categoryFiltersArea = document.getElementById('category-filters-container');
  headerTitleText = document.getElementById('header-title-text');
  headerSubtitleText = document.getElementById('header-subtitle-text');

  updateCartBadge();
}

// --- Sync state helper ---
function syncCartData() {
  localStorage.setItem('aura_cart', JSON.stringify(cart));
  updateCartBadge();
  if (activeCartDrawer) {
    activeCartDrawer.update(cart, activePromo);
  }
}

// --- Cart Badges Updates ---
function updateCartBadge() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badgeIds = ['header-cart-badge', 'mobile-cart-badge'];
  badgeIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = count;
      el.style.display = count === 0 ? 'none' : 'flex';
    }
  });
}

// --- Tab Router Switching ---
function switchTab(tabName) {
  activeTab = tabName;
  searchQuery = '';
  if (searchInput) searchInput.value = '';

  // Synchronize CSS active status on menus
  const desktopItems = appRoot.querySelectorAll('.sidebar-nav .nav-item');
  desktopItems.forEach(item => {
    if (item.getAttribute('data-tab') === tabName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  const mobileItems = appRoot.querySelectorAll('.mobile-nav-bar .mobile-nav-item');
  mobileItems.forEach(item => {
    if (item.getAttribute('data-tab') === tabName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Render view template
  if (tabName === 'shop') {
    headerTitleText.textContent = 'Curated Boutique';
    headerSubtitleText.textContent = 'Explore modern high-end lifestyle tech, apparel, and home decor.';
    headerActionsArea.style.display = 'flex';
    categoryFiltersArea.style.display = 'flex';
    renderProductGrid();
  } else {
    headerTitleText.textContent = 'Order History';
    headerSubtitleText.textContent = 'Track and review your completed Aura purchases.';
    headerActionsArea.style.display = 'none';
    categoryFiltersArea.style.display = 'none';
    renderOrders();
  }
}

// --- Render Product Grid (Shop View) ---
function renderProductGrid() {
  mainContentArea.innerHTML = '';
  
  const gridEl = document.createElement('div');
  gridEl.className = 'product-grid';

  // Filter items
  const filtered = mockProducts.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (searchQuery.trim() !== '') {
    const banner = document.createElement('div');
    banner.className = 'search-results-banner';
    banner.innerHTML = `
      <span>Showing <strong>${filtered.length}</strong> ${filtered.length === 1 ? 'product' : 'products'} matching "<strong>${searchQuery}</strong>"</span>
    `;
    mainContentArea.appendChild(banner);
  }

  if (filtered.length === 0) {
    mainContentArea.innerHTML += `
      <div style="text-align: center; padding: 4rem 2rem; color: var(--text-secondary); width: 100%;">
        <span style="font-size: 3rem;">🔍</span>
        <h3 style="margin-top: 1rem; font-family: var(--font-display);">No items match your search</h3>
        <p style="font-size: 0.9rem; color: var(--text-light); margin-top: 0.25rem;">Try adjusting your keywords or category filters.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(prod => {
    const card = ProductCard({
      product: prod,
      onAddToCart: handleAddToCart,
      onViewDetails: handleOpenDetails
    });
    gridEl.appendChild(card);
  });

  mainContentArea.appendChild(gridEl);
}

// --- Render Orders List (Orders View) ---
function renderOrders() {
  mainContentArea.innerHTML = '';
  const ordersEl = OrderHistory({
    orders: orders,
    onReturnToShop: () => switchTab('shop')
  });
  mainContentArea.appendChild(ordersEl);
}

// --- Cart Actions ---
function handleAddToCart(product) {
  // Check if item is already in cart
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    if (existing.quantity >= product.stock) {
      Toast.danger(`Cannot add more. Only ${product.stock} items available in stock.`);
      return;
    }
    existing.quantity++;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      quantity: 1,
      imageIcon: product.imageIcon,
      image: product.image || null,
      gradient: product.gradient,
      stock: product.stock
    });
  }

  Toast.success(`Added ${product.title} to your bag!`);
  syncCartData();
}

function handleUpdateQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  const newQty = item.quantity + delta;
  if (newQty <= 0) {
    handleRemoveItem(productId);
    return;
  }

  // Stock check
  if (delta > 0 && newQty > item.stock) {
    Toast.danger(`Sorry, only ${item.stock} units are currently available.`);
    return;
  }

  item.quantity = newQty;
  syncCartData();
}

function handleRemoveItem(productId) {
  const item = cart.find(i => i.id === productId);
  cart = cart.filter(i => i.id !== productId);
  if (item) {
    Toast.info(`Removed ${item.title} from your bag.`);
  }
  syncCartData();
}

// --- Promo Action Handlers ---
function handleApplyPromo(code) {
  const match = PROMO_CODES[code.toUpperCase()];
  if (match) {
    activePromo = match;
    Toast.success(`Promo Code "${code}" applied successfully!`);
    syncCartData();
  } else {
    Toast.danger(`Invalid coupon code. Try WELCOME10 or AURA20.`);
  }
}

function handleRemovePromo() {
  activePromo = null;
  Toast.info("Coupon code removed.");
  syncCartData();
}

// --- Details Modal Trigger ---
function handleOpenDetails(productId) {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) return;

  const modal = ProductDetailsModal({
    product: product,
    onAddToCart: (p) => {
      handleAddToCart(p);
    },
    onClose: null
  });
  document.getElementById('modal-root').appendChild(modal);
}

// --- Cart Drawer Trigger ---
function handleOpenCart() {
  activeCartDrawer = CartDrawer({
    cartItems: cart,
    activePromo: activePromo,
    onUpdateQty: handleUpdateQty,
    onRemoveItem: handleRemoveItem,
    onApplyPromo: handleApplyPromo,
    onRemovePromo: handleRemovePromo,
    onCheckout: handleOpenCheckout,
    onClose: () => {
      activeCartDrawer = null;
    }
  });
  activeCartDrawer.open();
}

// --- Checkout Modal Trigger ---
function handleOpenCheckout() {
  if (cart.length === 0) {
    Toast.danger("Your shopping bag is empty!");
    return;
  }

  const wiz = CheckoutWizard({
    cartItems: cart,
    activePromo: activePromo,
    onOrderPlaced: handleOrderPlacedSuccess,
    onClose: null
  });
  wiz.open();
}

// --- Success Order Handler ---
function handleOrderPlacedSuccess(newOrder) {
  // 1. Save order to state & local storage
  orders.push(newOrder);
  localStorage.setItem('aura_orders', JSON.stringify(orders));

  // 2. Clear cart
  cart = [];
  activePromo = null;
  localStorage.removeItem('aura_cart');
  
  // 3. Refresh badges & views
  updateCartBadge();
  switchTab('orders');
}

// --- Bind Global Events ---
function bindEvents() {
  // Sidebar tab clicking
  const desktopItems = appRoot.querySelectorAll('.sidebar-nav .nav-item');
  desktopItems.forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  // Logo home click
  const logoLink = document.getElementById('brand-home-link');
  if (logoLink) {
    logoLink.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('shop');
    });
  }

  // Mobile tab clicking
  const mobileNav = appRoot.querySelector('.mobile-nav-bar');
  if (mobileNav) {
    mobileNav.addEventListener('click', (e) => {
      const tabEl = e.target.closest('[data-tab]');
      if (tabEl) {
        const tab = tabEl.getAttribute('data-tab');
        switchTab(tab);
      }
      
      const cartTriggerEl = e.target.closest('#mobile-cart-trigger');
      if (cartTriggerEl) {
        handleOpenCart();
      }
    });
  }

  // Theme toggle click
  const themeToggle = appRoot.querySelector('.theme-toggle-btn');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', currentTheme);
      localStorage.setItem('aura_theme', currentTheme);

      // Update button state text & icons
      themeToggle.querySelector('.theme-icon').textContent = currentTheme === 'dark' ? '☀️' : '🌙';
      themeToggle.querySelector('.theme-text').textContent = currentTheme === 'dark' ? 'Light View' : 'Dark View';

      Toast.success(`Theme updated to ${currentTheme === 'dark' ? 'Nocturnal Black' : 'Warm Alabaster'}`);
    });
  }

  // Search input typing and clear button handler
  const searchClearBtn = document.getElementById('global-search-clear');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (searchClearBtn) {
        searchClearBtn.style.display = searchQuery ? 'flex' : 'none';
      }
      renderProductGrid();
    });
  }
  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
      searchQuery = '';
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      searchClearBtn.style.display = 'none';
      renderProductGrid();
    });
  }

  // Cart button click
  const cartBtn = document.getElementById('header-cart-btn');
  if (cartBtn) {
    cartBtn.addEventListener('click', handleOpenCart);
  }

  // Category filter buttons clicking
  if (categoryFiltersArea) {
    categoryFiltersArea.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (btn) {
        // Toggle active button style
        categoryFiltersArea.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Apply category filter
        selectedCategory = btn.getAttribute('data-category');
        renderProductGrid();
      }
    });
  }
}

// Boot application
window.addEventListener('DOMContentLoaded', init);
