/**
 * ProductDetailsModal Component
 * Shows details, specs, rating, and description for a selected product.
 * Appends to the DOM and animate-in.
 */
export function ProductDetailsModal({ product, onAddToCart, onClose }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';

  // Build specs rows
  let specsHTML = '';
  if (product.specs) {
    specsHTML = `
      <div class="details-specs">
        <h4 class="details-specs-title">Specifications</h4>
        ${Object.entries(product.specs).map(([key, val]) => `
          <div class="details-spec-row">
            <span class="details-spec-label">${key}</span>
            <span class="details-spec-value">${val}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  const stockClass = product.stock > 5 ? 'in-stock' : 'low-stock';
  const stockText = product.stock > 5 ? 'In Stock' : `Low Stock (Only ${product.stock} units left)`;

  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3 style="font-family: var(--font-display); font-size: 1.25rem;">Details</h3>
        <button class="modal-close" aria-label="Close Details Modal">&times;</button>
      </div>
      <div class="details-layout">
        <!-- Image Panel -->
        <div class="details-image-pane">
          ${product.image 
            ? `<img class="details-image" src="${product.image}" alt="${product.title}">` 
            : `
              <div class="details-image-bg" style="background: ${product.gradient}"></div>
              <span class="details-image-icon">${product.imageIcon}</span>
            `
          }
        </div>
        <!-- Info Panel -->
        <div class="details-info-pane">
          <div class="details-meta">
            <span class="details-category">${product.category}</span>
            <span class="details-stock-badge ${stockClass}">${stockText}</span>
          </div>
          <h2 class="details-title">${product.title}</h2>
          <div class="details-rating-bar">
            <span>★</span>
            <span class="details-rating-text">${product.rating.toFixed(1)} <span style="color: var(--text-light);">${product.reviews} reviews</span></span>
          </div>
          <div class="details-price">₹${product.price.toLocaleString('en-IN')}</div>
          <p class="details-description">${product.description}</p>
          
          ${specsHTML}

          <div class="details-actions">
            <button class="btn-primary add-to-cart-action-btn">
              <span>🛒</span> Add to Bag
            </button>
            <button class="btn-secondary close-action-btn">Close</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Animate close function
  const close = () => {
    overlay.classList.remove('active');
    overlay.addEventListener('transitionend', (e) => {
      if (e.propertyName === 'opacity') {
        overlay.remove();
        if (onClose) onClose();
      }
    });
  };

  // Event Listeners
  overlay.querySelector('.modal-close').addEventListener('click', close);
  overlay.querySelector('.close-action-btn').addEventListener('click', close);
  overlay.querySelector('.add-to-cart-action-btn').addEventListener('click', () => {
    onAddToCart(product);
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      close();
    }
  });

  return overlay;
}
