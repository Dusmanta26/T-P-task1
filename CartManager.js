/**
 * CartManager (Cart Drawer) Component
 * Slides in from the right. Lists cart items, allows editing quantities, 
 * applying coupon codes, and displays pricing summary.
 */
export function CartDrawer({ cartItems, activePromo, onUpdateQty, onRemoveItem, onApplyPromo, onRemovePromo, onCheckout, onClose }) {
  const overlay = document.createElement('div');
  overlay.className = 'drawer-overlay';

  const drawer = document.createElement('div');
  drawer.className = 'drawer';
  overlay.appendChild(drawer);

  // Render the current state in the drawer
  const render = () => {
    // Calculate prices
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    let discount = 0;
    if (activePromo) {
      if (activePromo.type === 'percent') {
        discount = subtotal * (activePromo.value / 100);
      } else if (activePromo.type === 'flat') {
        discount = activePromo.value;
      }
    }
    const subtotalAfterDiscount = Math.max(0, subtotal - discount);
    const tax = subtotalAfterDiscount * 0.08;
    const shipping = subtotalAfterDiscount > 2000 || subtotalAfterDiscount === 0 ? 0 : 150.00;
    const total = subtotalAfterDiscount + tax + shipping;

    const isEmpty = cartItems.length === 0;

    drawer.innerHTML = `
      <div class="drawer-header">
        <h3 class="drawer-title" style="font-family: var(--font-display);">Shopping Bag (${cartItems.reduce((sum, i) => sum + i.quantity, 0)})</h3>
        <button class="drawer-close" aria-label="Close Shopping Bag Drawer">&times;</button>
      </div>

      <div class="drawer-content">
        ${isEmpty ? `
          <div class="cart-empty">
            <span class="cart-empty-icon">🛍️</span>
            <h3 style="font-family: var(--font-display);">Your bag is empty</h3>
            <p style="color: var(--text-light); font-size: 0.9rem; margin-top: 0.25rem;">Add some premium products to get started!</p>
            <button class="btn-secondary start-shopping-btn" style="margin-top: 1.5rem; width: 100%;">Start Browsing</button>
          </div>
        ` : `
          <div class="cart-items-list" style="display: flex; flex-direction: column; gap: 1rem;">
            ${cartItems.map(item => `
              <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-image" style="background: ${item.gradient}; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
                  ${item.image 
                    ? `<img src="${item.image}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;">`
                    : `<span style="font-size: 1.5rem;">${item.imageIcon}</span>`
                  }
                </div>
                <div class="cart-item-details">
                  <h4 class="cart-item-title">${item.title}</h4>
                  <span class="cart-item-price">₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
                </div>
                <div class="cart-item-controls">
                  <button class="qty-btn dec" aria-label="Decrease Quantity">-</button>
                  <span class="qty-val">${item.quantity}</span>
                  <button class="qty-btn inc" aria-label="Increase Quantity">+</button>
                </div>
                <button class="cart-item-remove" aria-label="Remove Product Item">✕</button>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      ${isEmpty ? '' : `
        <div class="drawer-footer">
          <!-- Free Delivery Progress Indicator -->
          <div class="delivery-progress-container">
            ${subtotalAfterDiscount > 2000 ? `
              <div class="delivery-progress-status success">
                <span>🎉 You get <strong>Free Standard Delivery</strong>!</span>
              </div>
            ` : `
              <div class="delivery-progress-status">
                <span>Add <strong>₹${(2000 - subtotalAfterDiscount).toLocaleString('en-IN')}</strong> more for Free Delivery!</span>
                <div class="delivery-progress-bar-bg">
                  <div class="delivery-progress-bar-fill" style="width: ${Math.min(100, (subtotalAfterDiscount / 2000) * 100)}%;"></div>
                </div>
              </div>
            `}
          </div>

          <!-- Promo Code Row -->
          ${activePromo ? `
            <div class="promo-active-tag">
              <span>Applied Promo: <strong>${activePromo.code}</strong> (-₹${discount.toLocaleString('en-IN')})</span>
              <button class="remove-promo-action-btn" aria-label="Remove Promo Code">✕</button>
            </div>
          ` : `
            <div class="promo-wrapper">
              <input type="text" class="promo-input" placeholder="Promo Code (e.g. WELCOME10)" id="promo-code-input">
              <button class="promo-btn" id="apply-promo-btn">Apply</button>
            </div>
          `}

          <!-- Available Coupon Offers Badges -->
          ${!activePromo ? `
            <div class="available-coupons-section">
              <span class="coupons-title">Available Offers (Click to Apply):</span>
              <div class="coupons-badges-list">
                <button class="coupon-badge-card" data-code="WELCOME10">
                  <span class="badge-code">WELCOME10</span>
                  <span class="badge-desc">10% OFF</span>
                </button>
                <button class="coupon-badge-card" data-code="AURA20">
                  <span class="badge-code">AURA20</span>
                  <span class="badge-desc">20% OFF</span>
                </button>
                <button class="coupon-badge-card" data-code="SUPER50">
                  <span class="badge-code">SUPER50</span>
                  <span class="badge-desc">50% OFF</span>
                </button>
              </div>
            </div>
          ` : ''}

          <!-- Price Summary Card -->
          <div class="price-summary">
            <div class="price-row">
              <span>Subtotal</span>
              <span>₹${subtotal.toLocaleString('en-IN')}</span>
            </div>
            ${discount > 0 ? `
              <div class="price-row discount">
                <span>Promo Discount</span>
                <span>-₹${discount.toLocaleString('en-IN')}</span>
              </div>
            ` : ''}
            <div class="price-row">
              <span>Shipping</span>
              <span>${shipping === 0 ? 'Free' : `₹${shipping.toLocaleString('en-IN')}`}</span>
            </div>
            <div class="price-row">
              <span>Sales Tax (8%)</span>
              <span>₹${tax.toLocaleString('en-IN')}</span>
            </div>
            <div class="price-row total">
              <span>Total</span>
              <span>₹${total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button class="checkout-btn" ${isEmpty ? 'disabled' : ''}>
            Checkout
          </button>
        </div>
      `}
    `;

    // Event Handlers for cart elements
    if (!isEmpty) {
      drawer.querySelectorAll('.cart-item').forEach(itemEl => {
        const id = parseInt(itemEl.getAttribute('data-id'), 10);
        
        itemEl.querySelector('.qty-btn.dec').addEventListener('click', () => {
          onUpdateQty(id, -1);
        });
        
        itemEl.querySelector('.qty-btn.inc').addEventListener('click', () => {
          onUpdateQty(id, 1);
        });

        itemEl.querySelector('.cart-item-remove').addEventListener('click', () => {
          onRemoveItem(id);
        });
      });

      // Promo codes
      if (activePromo) {
        drawer.querySelector('.remove-promo-action-btn').addEventListener('click', () => {
          onRemovePromo();
        });
      } else {
        const applyBtn = drawer.querySelector('#apply-promo-btn');
        const promoInput = drawer.querySelector('#promo-code-input');
        
        const apply = () => {
          const code = promoInput.value.trim().toUpperCase();
          if (code) {
            onApplyPromo(code);
          }
        };

        applyBtn.addEventListener('click', apply);
        promoInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') apply();
        });

        // Click coupon cards to apply
        drawer.querySelectorAll('.coupon-badge-card').forEach(cardEl => {
          cardEl.addEventListener('click', () => {
            const code = cardEl.getAttribute('data-code');
            onApplyPromo(code);
          });
        });
      }

      // Checkout handler
      drawer.querySelector('.checkout-btn').addEventListener('click', () => {
        close();
        onCheckout();
      });
    } else {
      drawer.querySelector('.start-shopping-btn').addEventListener('click', close);
    }

    // Close buttons
    drawer.querySelector('.drawer-close').addEventListener('click', close);
  };

  // Close animation handler
  const close = () => {
    overlay.classList.remove('active');
    drawer.classList.remove('active');
    overlay.addEventListener('transitionend', (e) => {
      if (e.propertyName === 'opacity') {
        overlay.remove();
        if (onClose) onClose();
      }
    });
  };

  // Open drawer and append to body
  const open = () => {
    document.body.appendChild(overlay);
    // Force paint reflow
    overlay.offsetHeight;
    overlay.classList.add('active');
    drawer.classList.add('active');
    render();
  };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  return {
    open,
    close,
    update: (newItems, newPromo) => {
      cartItems = newItems;
      activePromo = newPromo;
      render();
    }
  };
}
