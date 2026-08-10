/**
 * Toast Notification Component
 * Renders brief, auto-dismissing notifications in the global toast container.
 */
export const Toast = {
  success(message) {
    this.show(message, 'success', '✓');
  },
  danger(message) {
    this.show(message, 'danger', '✕');
  },
  info(message) {
    this.show(message, 'info', 'ℹ');
  },
  show(message, type = 'info', icon = 'ℹ') {
    const root = document.getElementById('toast-root');
    if (!root) return;

    const toastEl = document.createElement('div');
    toastEl.className = `toast-item ${type}`;
    toastEl.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-msg">${message}</span>
    `;

    root.appendChild(toastEl);

    // Transition out
    const dismissTimer = setTimeout(() => {
      toastEl.classList.add('fadeOut');
    }, 2700);

    toastEl.addEventListener('animationend', (e) => {
      // Only remove when the fadeOut animation finishes
      if (e.animationName === 'slideOut') {
        toastEl.remove();
      }
    });

    // Manual tap to dismiss
    toastEl.addEventListener('click', () => {
      clearTimeout(dismissTimer);
      toastEl.classList.add('fadeOut');
    });
  }
};
