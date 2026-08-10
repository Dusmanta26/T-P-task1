/**
 * OrderHistory Component
 * Lists completed customer transactions from localStorage.
 * Handles empty states, time-based mock shipping statuses, and receipt simulations.
 */
export function OrderHistory({ orders, onReturnToShop }) {
  const container = document.createElement('div');
  container.className = 'orders-container';

  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div class="no-orders">
        <span class="no-orders-icon">📦</span>
        <h3 style="font-family: var(--font-display);">No orders placed yet</h3>
        <p style="color: var(--text-light); font-size: 0.9rem; margin-top: 0.25rem;">You haven't checked out any orders during this session.</p>
        <button class="btn-primary start-shopping-btn" style="margin-top: 1.5rem; max-width: 240px; width: 100%;">Browse Shop</button>
      </div>
    `;

    container.querySelector('.start-shopping-btn').addEventListener('click', onReturnToShop);
    return container;
  }

  // Sort orders descending by time
  const sorted = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));

  container.innerHTML = sorted.map(order => {
    const dateFormatted = new Date(order.date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Simulates shipping updates (completed after 90 seconds)
    const elapsed = Date.now() - new Date(order.date).getTime();
    const isDelivered = elapsed > 90000; 
    const statusText = isDelivered ? 'Delivered' : 'In Transit';
    const statusColor = isDelivered ? 'var(--status-success)' : '#ffd166';
    const statusBg = isDelivered ? 'var(--status-success-bg)' : 'rgba(255, 209, 102, 0.1)';

    return `
      <div class="order-card" data-id="${order.id}">
        <div class="order-header">
          <div class="order-meta-info">
            <div class="meta-col">
              <span class="meta-label">Order Placed</span>
              <span class="meta-value">${dateFormatted}</span>
            </div>
            <div class="meta-col">
              <span class="meta-label">Total Bill</span>
              <span class="meta-value" style="color: var(--accent);">₹${order.pricing.total.toLocaleString('en-IN')}</span>
            </div>
            <div class="meta-col">
              <span class="meta-label">Ship To</span>
              <span class="meta-value">${order.shipping.fullName}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 1rem;">
            <span class="order-status" style="background-color: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusColor};">
              ${statusText}
            </span>
            <button class="btn-secondary download-invoice-btn" data-id="${order.id}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: var(--radius-sm);">
              Receipt
            </button>
          </div>
        </div>
 
        <div class="order-body">
          ${order.items.map(item => `
            <div class="order-product-row">
              <div class="order-product-details">
                <span class="order-product-icon" style="background: ${item.gradient}; display: inline-flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
                  ${item.image 
                    ? `<img src="${item.image}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;">`
                    : item.imageIcon
                  }
                </span>
                <div>
                  <h5 class="order-product-title">${item.title}</h5>
                  <span class="order-product-qty">Quantity: ${item.quantity}</span>
                </div>
              </div>
              <span class="order-product-price">₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  // Invoice click downloads
  container.querySelectorAll('.download-invoice-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const orderId = e.target.getAttribute('data-id');
      import('./Toast.js').then(({ Toast }) => {
        Toast.success(`Downloading PDF Invoice for ${orderId}...`);
      });
    });
  });

  return container;
}
