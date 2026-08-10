/**
 * ProductCard Component
 * Renders an individual product in the store grid.
 * Clicking the card opens details; clicking the "+" button adds it directly to the cart.
 */
export function ProductCard({ product, onAddToCart, onViewDetails }) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.setAttribute('data-id', product.id);

  const imageHTML = product.image 
    ? `<img class="product-image" src="${product.image}" alt="${product.title}" loading="lazy">`
    : `
      <div class="product-image-gradient" style="background: ${product.gradient}"></div>
      <span class="product-image-icon">${product.imageIcon}</span>
    `;

  card.innerHTML = `
    <div class="product-image-container">
      ${imageHTML}
      <span class="product-category-badge">${product.category}</span>
    </div>
    <div class="product-info">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span class="product-rating">★ ${product.rating.toFixed(1)} <span class="product-rating-count">(${product.reviews})</span></span>
        ${product.stock <= 3 ? `<span style="font-size: 0.75rem; color: #ffd166; font-weight: 700;">Only ${product.stock} left!</span>` : ''}
      </div>
      <h3 class="product-title">${product.title}</h3>
      <p class="product-desc">${product.description}</p>
      <div class="product-footer">
        <span class="product-price">₹${product.price.toLocaleString('en-IN')}</span>
        <button class="add-cart-btn" aria-label="Add to cart" title="Add to Cart">
          <span style="font-size: 1.25rem; font-weight: 600;">+</span>
        </button>
      </div>
    </div>
  `;

  // Attach event handlers
  card.addEventListener('click', (e) => {
    const addBtn = card.querySelector('.add-cart-btn');
    if (addBtn && addBtn.contains(e.target)) {
      e.stopPropagation();
      onAddToCart(product);
    } else {
      onViewDetails(product.id);
    }
  });

  return card;
}
