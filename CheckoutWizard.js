/**
 * CheckoutWizard Component
 * Multi-step form flow (Shipping -> Payment with Credit Card Visualizer -> Review -> Order Confirmed).
 * Appends to modal root, runs validations, and triggers callback upon final completion.
 */
export function CheckoutWizard({ cartItems, activePromo, onOrderPlaced, onClose }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';

  const modal = document.createElement('div');
  modal.className = 'modal-card wizard-layout';
  overlay.appendChild(modal);

  let step = 1; // 1: Shipping, 2: Payment, 3: Review, 4: Success
  
  let shippingData = {
    fullName: '',
    email: '',
    address: '',
    city: '',
    zip: '',
    method: 'standard' // 'standard' | 'express'
  };
  
  let paymentData = {
    method: 'card', // 'card' | 'upi' | 'netbanking' | 'cod'
    cardHolder: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    upiId: '',
    bank: ''
  };

  let generatedOrderId = '';

  // Pricing calculations
  const calculatePricing = () => {
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
    
    let shipping = 0;
    if (subtotalAfterDiscount > 0) {
      if (shippingData.method === 'express') {
        shipping = 350.00;
      } else {
        shipping = subtotalAfterDiscount > 2000 ? 0 : 150.00;
      }
    }
    
    const total = subtotalAfterDiscount + tax + shipping;

    return {
      subtotal,
      discount,
      shipping,
      tax,
      total
    };
  };

  const render = () => {
    let title = 'Checkout';
    if (step === 4) title = 'Order Confirmed';
    
    modal.innerHTML = `
      <div class="modal-header">
        <h3 style="font-family: var(--font-display); font-size: 1.25rem;">${title}</h3>
        ${step < 4 ? `<button class="modal-close" aria-label="Close Checkout">&times;</button>` : ''}
      </div>

      <!-- Steps header indicators -->
      ${step < 4 ? `
        <div class="wizard-steps-header">
          <div class="wizard-step-node ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}">
            <div class="step-circle">1</div>
            <span>Shipping</span>
          </div>
          <div class="wizard-step-node ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}">
            <div class="step-circle">2</div>
            <span>Payment</span>
          </div>
          <div class="wizard-step-node ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}">
            <div class="step-circle">3</div>
            <span>Review</span>
          </div>
        </div>
      ` : ''}

      <div class="wizard-content">
        ${renderStepContent()}
      </div>

      ${step < 4 ? `
        <div class="wizard-footer">
          <button class="btn-wizard-nav prev" id="wiz-prev-btn" ${step === 1 ? 'disabled' : ''}>Back</button>
          <button class="btn-wizard-nav next" id="wiz-next-btn">${step === 3 ? 'Confirm Order' : 'Continue'}</button>
        </div>
      ` : ''}
    `;

    // Bind event handlers
    if (step < 4) {
      modal.querySelector('.modal-close').addEventListener('click', close);
      modal.querySelector('#wiz-prev-btn').addEventListener('click', prevStep);
      modal.querySelector('#wiz-next-btn').addEventListener('click', nextStep);
      bindStepEvents();
    } else {
      modal.querySelector('#wiz-done-btn').addEventListener('click', () => {
        const orderInfo = {
          id: generatedOrderId,
          items: [...cartItems],
          pricing: calculatePricing(),
          shipping: { ...shippingData },
          date: new Date().toISOString()
        };
        onOrderPlaced(orderInfo);
        close();
      });
    }
  };

  const renderStepContent = () => {
    const prices = calculatePricing();
    
    switch (step) {
      case 1:
        return `
          <form id="shipping-form" class="form-grid" onsubmit="event.preventDefault();">
            <div class="form-group full-width">
              <label class="form-label" for="ship-name">Full Name</label>
              <input type="text" id="ship-name" class="form-input" placeholder="e.g. Liam Anderson" value="${shippingData.fullName}" required>
            </div>
            <div class="form-group full-width">
              <label class="form-label" for="ship-email">Email Address</label>
              <input type="email" id="ship-email" class="form-input" placeholder="e.g. liam@aura.com" value="${shippingData.email}" required>
            </div>
            <div class="form-group full-width">
              <label class="form-label" for="ship-address">Street Address</label>
              <input type="text" id="ship-address" class="form-input" placeholder="e.g. 742 Evergreen Terrace" value="${shippingData.address}" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="ship-city">City</label>
              <input type="text" id="ship-city" class="form-input" placeholder="e.g. Springfield" value="${shippingData.city}" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="ship-zip">Zip / Postal Code</label>
              <input type="text" id="ship-zip" class="form-input" placeholder="e.g. 90210" value="${shippingData.zip}" required>
            </div>
            
            <div class="form-group full-width" style="margin-top: 0.75rem;">
              <label class="form-label">Shipping Method</label>
              <div style="display: flex; gap: 1rem; margin-top: 0.25rem;">
                <label style="flex: 1; border: 1px solid ${shippingData.method === 'standard' ? 'var(--accent)' : 'var(--border-color)'}; background: ${shippingData.method === 'standard' ? 'var(--bg-secondary)' : 'transparent'}; padding: 1rem; border-radius: var(--radius-md); cursor: pointer; display: flex; flex-direction: column; gap: 0.25rem; transition: var(--transition-fast);">
                  <input type="radio" name="shipping-method" value="standard" ${shippingData.method === 'standard' ? 'checked' : ''} style="display: none;">
                  <div style="font-weight: 700; display: flex; justify-content: space-between; font-size: 0.95rem;">
                    <span>Standard Shipping</span>
                    <span>${prices.subtotal - prices.discount > 2000 ? 'Free' : '₹150.00'}</span>
                  </div>
                  <span style="font-size: 0.75rem; color: var(--text-secondary);">3-5 Business Days</span>
                </label>
                <label style="flex: 1; border: 1px solid ${shippingData.method === 'express' ? 'var(--accent)' : 'var(--border-color)'}; background: ${shippingData.method === 'express' ? 'var(--bg-secondary)' : 'transparent'}; padding: 1rem; border-radius: var(--radius-md); cursor: pointer; display: flex; flex-direction: column; gap: 0.25rem; transition: var(--transition-fast);">
                  <input type="radio" name="shipping-method" value="express" ${shippingData.method === 'express' ? 'checked' : ''} style="display: none;">
                  <div style="font-weight: 700; display: flex; justify-content: space-between; font-size: 0.95rem;">
                    <span>Express Delivery</span>
                    <span>₹350.00</span>
                  </div>
                  <span style="font-size: 0.75rem; color: var(--text-secondary);">1-2 Business Days</span>
                </label>
              </div>
            </div>
          </form>
        `;
      
      case 2:
        let visualContent = '';
        
        if (paymentData.method === 'card') {
          const displayNum = paymentData.cardNumber || '•••• •••• •••• ••••';
          const displayHolder = paymentData.cardHolder || 'Cardholder Name';
          const displayExp = paymentData.cardExpiry || 'MM/YY';
          
          visualContent = `
            <!-- Credit Card Visualizer -->
            <div class="card-visualizer-container">
              <div class="credit-card-mock">
                <div class="card-logo-row">
                  <div class="card-chip"></div>
                  <div class="card-network">AURA</div>
                </div>
                <div class="card-number-display">${displayNum}</div>
                <div class="card-details-row">
                  <div class="meta-col">
                    <span style="font-size: 0.55rem; opacity: 0.7; font-weight: 700;">Card Holder</span>
                    <span class="card-holder-display">${displayHolder}</span>
                  </div>
                  <div class="meta-col" style="align-items: flex-end;">
                    <span style="font-size: 0.55rem; opacity: 0.7; font-weight: 700;">Expires</span>
                    <span class="card-expiry-display">${displayExp}</span>
                  </div>
                </div>
              </div>
            </div>

            <form id="payment-form" class="form-grid" onsubmit="event.preventDefault();">
              <div class="form-group full-width">
                <label class="form-label" for="pay-name">Cardholder Name</label>
                <input type="text" id="pay-name" class="form-input" placeholder="e.g. Liam Anderson" value="${paymentData.cardHolder}" required>
              </div>
              <div class="form-group full-width">
                <label class="form-label" for="pay-number">Card Number</label>
                <input type="text" id="pay-number" class="form-input" placeholder="4111 2222 3333 4444" maxlength="19" value="${paymentData.cardNumber}" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="pay-expiry">Expiry Date</label>
                <input type="text" id="pay-expiry" class="form-input" placeholder="MM/YY" maxlength="5" value="${paymentData.cardExpiry}" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="pay-cvv">CVV</label>
                <input type="password" id="pay-cvv" class="form-input" placeholder="•••" maxlength="4" value="${paymentData.cardCvv}" required>
              </div>
            </form>
          `;
        } else if (paymentData.method === 'upi') {
          visualContent = `
            <div class="upi-container" style="display: flex; flex-direction: column; gap: 1.25rem; align-items: center; padding: 1.25rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-secondary); width: 100%;">
              <div class="upi-qr-wrapper" style="width: 150px; height: 150px; background: #ffffff; padding: 0.75rem; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm);">
                <!-- Simulated QR Code using CSS grid -->
                <div style="width: 100%; height: 100%; display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(4, 1fr); gap: 6px;">
                  <div style="background: #0f172a; border-radius: 2px;"></div>
                  <div style="background: #0f172a; border-radius: 2px;"></div>
                  <div style="background: transparent;"></div>
                  <div style="background: #0f172a; border-radius: 2px;"></div>
                  <div style="background: transparent;"></div>
                  <div style="background: #0f172a; border-radius: 2px;"></div>
                  <div style="background: #0f172a; border-radius: 2px;"></div>
                  <div style="background: transparent;"></div>
                  <div style="background: #0f172a; border-radius: 2px;"></div>
                  <div style="background: transparent;"></div>
                  <div style="background: #0f172a; border-radius: 2px;"></div>
                  <div style="background: #0f172a; border-radius: 2px;"></div>
                  <div style="background: #0f172a; border-radius: 2px;"></div>
                  <div style="background: #0f172a; border-radius: 2px;"></div>
                  <div style="background: transparent;"></div>
                  <div style="background: #0f172a; border-radius: 2px;"></div>
                </div>
              </div>
              <span style="font-size: 0.8rem; color: var(--text-secondary); text-align: center; line-height: 1.4;">Scan QR Code using any UPI App (GPay, PhonePe, Paytm, BHIM)</span>
              
              <div style="width: 100%; height: 1px; background-color: var(--border-color);"></div>
              
              <div class="form-group full-width" style="margin-top: 0.25rem; width: 100%;">
                <label class="form-label" for="pay-upi-id">Or Pay via UPI ID (VPA)</label>
                <div style="display: flex; gap: 0.5rem; width: 100%;">
                  <input type="text" id="pay-upi-id" class="form-input" placeholder="e.g. liam@okaxis" value="${paymentData.upiId || ''}" style="flex: 1;" required>
                  <button type="button" class="btn-secondary" id="verify-upi-btn" style="padding: 0.75rem 1.25rem; font-size: 0.85rem; border-radius: var(--radius-md); white-space: nowrap;">Verify VPA</button>
                </div>
              </div>
            </div>
          `;
        } else if (paymentData.method === 'netbanking') {
          const banks = [
            { id: 'sbi', name: 'State Bank of India', icon: '🏛️' },
            { id: 'hdfc', name: 'HDFC Bank', icon: '🏦' },
            { id: 'icici', name: 'ICICI Bank', icon: '💎' },
            { id: 'axis', name: 'Axis Bank', icon: '📈' },
            { id: 'kotak', name: 'Kotak Mahindra', icon: '👑' }
          ];
          
          visualContent = `
            <div class="netbanking-container" style="display: flex; flex-direction: column; gap: 1rem; width: 100%;">
              <label class="form-label">Select Your Bank</label>
              <div class="banks-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
                ${banks.map(bank => {
                  const isSelected = paymentData.bank === bank.id;
                  return `
                    <button type="button" class="bank-select-card ${isSelected ? 'active' : ''}" data-bank-id="${bank.id}" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid ${isSelected ? 'var(--accent)' : 'var(--border-color)'}; background: ${isSelected ? 'var(--bg-secondary)' : 'var(--bg-card)'}; color: var(--text-primary); cursor: pointer; text-align: left; transition: var(--transition-fast); font-weight: 600; font-size: 0.85rem; font-family: var(--font-body); width: 100%; height: 50px;">
                      <span style="font-size: 1.25rem; display: flex; align-items: center;">${bank.icon}</span>
                      <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${bank.name}</span>
                    </button>
                  `;
                }).join('')}
              </div>
              <div class="form-group" style="margin-top: 0.5rem; width: 100%;">
                <label class="form-label" for="pay-bank-other">Or select other bank</label>
                <select id="pay-bank-other" class="form-input" style="width: 100%; cursor: pointer;">
                  <option value="">-- Select Bank --</option>
                  <option value="pnb" ${paymentData.bank === 'pnb' ? 'selected' : ''}>Punjab National Bank</option>
                  <option value="bob" ${paymentData.bank === 'bob' ? 'selected' : ''}>Bank of Baroda</option>
                  <option value="canara" ${paymentData.bank === 'canara' ? 'selected' : ''}>Canara Bank</option>
                  <option value="yes" ${paymentData.bank === 'yes' ? 'selected' : ''}>Yes Bank</option>
                  <option value="idbi" ${paymentData.bank === 'idbi' ? 'selected' : ''}>IDBI Bank</option>
                </select>
              </div>
            </div>
          `;
        } else if (paymentData.method === 'cod') {
          visualContent = `
            <div class="cod-container" style="display: flex; flex-direction: column; gap: 1rem; padding: 1.5rem; border: 1px dashed var(--border-color); border-radius: var(--radius-md); background: rgba(58, 134, 200, 0.03); text-align: center; align-items: center; width: 100%;">
              <span style="font-size: 3rem;">💵</span>
              <h4 style="font-family: var(--font-display); font-size: 1.15rem; color: var(--text-primary);">Cash on Delivery Selected</h4>
              <p style="font-size: 0.9rem; color: var(--text-secondary); max-width: 320px; line-height: 1.5;">You can pay in cash or scan the delivery executive's UPI QR code when your shipment arrives at your doorstep.</p>
              <div style="background: var(--bg-secondary); padding: 0.75rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); width: 100%; font-size: 0.85rem; font-weight: 700; color: var(--accent); display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                🚚 No additional handling fees!
              </div>
            </div>
          `;
        }

        return `
          <!-- Payment Method Tabs -->
          <div class="payment-tabs-wrapper" style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; overflow-x: auto; padding-bottom: 0.25rem; scrollbar-width: none;">
            <button type="button" class="pay-tab-btn ${paymentData.method === 'card' ? 'active' : ''}" data-method="card" style="flex: 1; padding: 0.65rem 0.5rem; font-size: 0.75rem; font-weight: 700; border-radius: var(--radius-sm); border: 1px solid ${paymentData.method === 'card' ? 'var(--accent)' : 'var(--border-color)'}; background: ${paymentData.method === 'card' ? 'var(--accent)' : 'transparent'}; color: ${paymentData.method === 'card' ? '#ffffff' : 'var(--text-secondary)'}; cursor: pointer; white-space: nowrap; transition: var(--transition-fast);">
              💳 Card
            </button>
            <button type="button" class="pay-tab-btn ${paymentData.method === 'upi' ? 'active' : ''}" data-method="upi" style="flex: 1; padding: 0.65rem 0.5rem; font-size: 0.75rem; font-weight: 700; border-radius: var(--radius-sm); border: 1px solid ${paymentData.method === 'upi' ? 'var(--accent)' : 'var(--border-color)'}; background: ${paymentData.method === 'upi' ? 'var(--accent)' : 'transparent'}; color: ${paymentData.method === 'upi' ? '#ffffff' : 'var(--text-secondary)'}; cursor: pointer; white-space: nowrap; transition: var(--transition-fast);">
              📱 UPI
            </button>
            <button type="button" class="pay-tab-btn ${paymentData.method === 'netbanking' ? 'active' : ''}" data-method="netbanking" style="flex: 1; padding: 0.65rem 0.5rem; font-size: 0.75rem; font-weight: 700; border-radius: var(--radius-sm); border: 1px solid ${paymentData.method === 'netbanking' ? 'var(--accent)' : 'var(--border-color)'}; background: ${paymentData.method === 'netbanking' ? 'var(--accent)' : 'transparent'}; color: ${paymentData.method === 'netbanking' ? '#ffffff' : 'var(--text-secondary)'}; cursor: pointer; white-space: nowrap; transition: var(--transition-fast);">
              🏛️ NetBanking
            </button>
            <button type="button" class="pay-tab-btn ${paymentData.method === 'cod' ? 'active' : ''}" data-method="cod" style="flex: 1; padding: 0.65rem 0.5rem; font-size: 0.75rem; font-weight: 700; border-radius: var(--radius-sm); border: 1px solid ${paymentData.method === 'cod' ? 'var(--accent)' : 'var(--border-color)'}; background: ${paymentData.method === 'cod' ? 'var(--accent)' : 'transparent'}; color: ${paymentData.method === 'cod' ? '#ffffff' : 'var(--text-secondary)'}; cursor: pointer; white-space: nowrap; transition: var(--transition-fast);">
              💵 COD
            </button>
          </div>

          <div class="payment-dynamic-container" style="width: 100%;">
            ${visualContent}
          </div>
        `;

      case 3:
        let paymentSummaryHTML = '';
        if (paymentData.method === 'card') {
          paymentSummaryHTML = `
            <p style="font-weight: 700; margin-bottom: 0.25rem;">Credit/Debit Card</p>
            <p style="font-size: 0.9rem; color: var(--text-secondary);">Card: •••• ${paymentData.cardNumber.slice(-4)}</p>
            <p style="font-size: 0.9rem; color: var(--text-secondary);">Holder: ${paymentData.cardHolder}</p>
          `;
        } else if (paymentData.method === 'upi') {
          paymentSummaryHTML = `
            <p style="font-weight: 700; margin-bottom: 0.25rem;">UPI / Instant Transfer</p>
            <p style="font-size: 0.9rem; color: var(--text-secondary);">UPI ID: ${paymentData.upiId || 'No UPI ID provided'}</p>
          `;
        } else if (paymentData.method === 'netbanking') {
          paymentSummaryHTML = `
            <p style="font-weight: 700; margin-bottom: 0.25rem;">Net Banking</p>
            <p style="font-size: 0.9rem; color: var(--text-secondary);">Bank: ${paymentData.bank.toUpperCase()}</p>
          `;
        } else if (paymentData.method === 'cod') {
          paymentSummaryHTML = `
            <p style="font-weight: 700; margin-bottom: 0.25rem;">Cash on Delivery (COD)</p>
            <p style="font-size: 0.9rem; color: var(--text-secondary);">Pay at delivery time.</p>
          `;
        }

        return `
          <div style="display: flex; flex-direction: column; gap: 1.5rem;">
            <!-- Address & Payment Summary Columns -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
              <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; background-color: var(--bg-secondary);">
                <h4 style="font-family: var(--font-display); font-size: 1rem; margin-bottom: 0.5rem; color: var(--accent);">Shipping Address</h4>
                <p style="font-weight: 700; margin-bottom: 0.25rem;">${shippingData.fullName}</p>
                <p style="font-size: 0.9rem; color: var(--text-secondary);">${shippingData.address}, ${shippingData.city}, ${shippingData.zip}</p>
                <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.25rem;">Email: ${shippingData.email}</p>
                <p style="font-size: 0.85rem; font-weight: 700; margin-top: 0.5rem; color: var(--accent-secondary);">Delivery Method: ${shippingData.method === 'express' ? 'Express (1-2 days)' : 'Standard (3-5 days)'}</p>
              </div>
              <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; background-color: var(--bg-secondary);">
                <h4 style="font-family: var(--font-display); font-size: 1rem; margin-bottom: 0.5rem; color: var(--accent);">Payment Method</h4>
                ${paymentSummaryHTML}
              </div>
            </div>

            <!-- Items list -->
            <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem;">
              <h4 style="font-family: var(--font-display); font-size: 1rem; color: var(--accent); margin-bottom: 0.75rem;">Items</h4>
              <div style="max-height: 140px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem;">
                ${cartItems.map(item => `
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                      <span style="font-size: 1.25rem; width: 36px; height: 36px; background: ${item.gradient}; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
                        ${item.image 
                          ? `<img src="${item.image}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;">`
                          : item.imageIcon
                        }
                      </span>
                      <div>
                        <div style="font-weight: 600;">${item.title}</div>
                        <div style="font-size: 0.8rem; color: var(--text-light);">Qty: ${item.quantity} &times; ₹${item.price.toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                    <span style="font-weight: 700;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Cost Summary -->
            <div style="background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem;">
              <div class="price-summary">
                <div class="price-row">
                  <span>Subtotal</span>
                  <span>₹${prices.subtotal.toLocaleString('en-IN')}</span>
                </div>
                ${prices.discount > 0 ? `
                  <div class="price-row discount">
                    <span>Promo Discount</span>
                    <span>-₹${prices.discount.toLocaleString('en-IN')}</span>
                  </div>
                ` : ''}
                <div class="price-row">
                  <span>Shipping</span>
                  <span>${prices.shipping === 0 ? 'Free' : `₹${prices.shipping.toLocaleString('en-IN')}`}</span>
                </div>
                <div class="price-row">
                  <span>Sales Tax (8%)</span>
                  <span>₹${prices.tax.toLocaleString('en-IN')}</span>
                </div>
                <div class="price-row total" style="border-top: 1px solid var(--border-color); padding-top: 0.75rem; margin-top: 0.25rem;">
                  <span>Total Amount</span>
                  <span>₹${prices.total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        `;

      case 4:
        const est = new Date();
        est.setDate(est.getDate() + (shippingData.method === 'express' ? 2 : 5));
        const estStr = est.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

        return `
          <div class="success-panel">
            <div class="success-icon">✓</div>
            <h2 style="font-family: var(--font-display); font-size: 1.75rem;">Order Placed Successfully!</h2>
            <p style="color: var(--text-secondary); max-width: 420px; font-size: 0.95rem; line-height: 1.5;">Thank you for shopping at Aura. We have sent an email receipt to <strong>${shippingData.email}</strong> with order verification details.</p>
            <div class="order-id-tag">${generatedOrderId}</div>
            <div style="border-top: 1px solid var(--border-color); width: 100%; max-width: 320px; padding-top: 1rem; margin-top: 0.5rem; font-size: 0.9rem;">
              <span style="color: var(--text-secondary);">Estimated Arrival Date</span>
              <div style="font-weight: 700; color: var(--status-success); font-size: 1.15rem; margin-top: 0.25rem;">${estStr}</div>
            </div>
            <button class="btn-primary" id="wiz-done-btn" style="width: 100%; max-width: 250px; margin-top: 1.5rem;">Continue Shopping</button>
          </div>
        `;
    }
  };

  const bindStepEvents = () => {
    if (step === 1) {
      const radioContainer = modal.querySelector('form');
      if (radioContainer) {
        radioContainer.addEventListener('change', (e) => {
          if (e.target.name === 'shipping-method') {
            shippingData.method = e.target.value;
            render();
          }
        });
      }
    } else if (step === 2) {
      // 1. Bind tab switching
      modal.querySelectorAll('.pay-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          paymentData.method = btn.getAttribute('data-method');
          render();
        });
      });

      // 2. Bind dynamic fields depending on method
      if (paymentData.method === 'card') {
        const payName = modal.querySelector('#pay-name');
        const payNumber = modal.querySelector('#pay-number');
        const payExpiry = modal.querySelector('#pay-expiry');
        const payCvv = modal.querySelector('#pay-cvv');

        payName.addEventListener('input', (e) => {
          paymentData.cardHolder = e.target.value;
          const display = modal.querySelector('.card-holder-display');
          if (display) display.textContent = paymentData.cardHolder || 'Cardholder Name';
        });

        payNumber.addEventListener('input', (e) => {
          let value = e.target.value.replace(/\D/g, '');
          let formatted = '';
          for (let i = 0; i < value.length && i < 16; i++) {
            if (i > 0 && i % 4 === 0) formatted += ' ';
            formatted += value[i];
          }
          e.target.value = formatted;
          paymentData.cardNumber = formatted;
          
          const display = modal.querySelector('.card-number-display');
          if (display) display.textContent = formatted || '•••• •••• •••• ••••';
        });

        payExpiry.addEventListener('input', (e) => {
          let value = e.target.value.replace(/\D/g, '');
          let formatted = '';
          if (value.length > 0) {
            formatted = value.substring(0, 2);
            if (value.length > 2) {
              formatted += '/' + value.substring(2, 4);
            }
          }
          e.target.value = formatted;
          paymentData.cardExpiry = formatted;
          
          const display = modal.querySelector('.card-expiry-display');
          if (display) display.textContent = formatted || 'MM/YY';
        });

        payCvv.addEventListener('input', (e) => {
          paymentData.cardCvv = e.target.value.replace(/\D/g, '');
          e.target.value = paymentData.cardCvv;
        });
      } else if (paymentData.method === 'upi') {
        const upiInput = modal.querySelector('#pay-upi-id');
        const verifyBtn = modal.querySelector('#verify-upi-btn');
        
        if (upiInput) {
          upiInput.addEventListener('input', (e) => {
            paymentData.upiId = e.target.value.trim();
          });
        }
        
        if (verifyBtn) {
          verifyBtn.addEventListener('click', () => {
            const upiVal = upiInput.value.trim();
            if (/^[\w.-]+@[\w.-]+$/.test(upiVal)) {
              verifyBtn.textContent = 'Verified ✓';
              verifyBtn.style.backgroundColor = 'var(--status-success)';
              verifyBtn.style.borderColor = 'var(--status-success)';
              verifyBtn.style.color = '#ffffff';
            } else {
              import('./Toast.js').then(({ Toast }) => {
                Toast.danger('Invalid UPI ID format (e.g. name@upi)');
              });
            }
          });
        }
      } else if (paymentData.method === 'netbanking') {
        modal.querySelectorAll('.bank-select-card').forEach(card => {
          card.addEventListener('click', () => {
            paymentData.bank = card.getAttribute('data-bank-id');
            render();
          });
        });
        
        const otherBankSelect = modal.querySelector('#pay-bank-other');
        if (otherBankSelect) {
          otherBankSelect.addEventListener('change', (e) => {
            paymentData.bank = e.target.value;
            render();
          });
        }
      }
    }
  };

  const validateForm = () => {
    if (step === 1) {
      const form = modal.querySelector('#shipping-form');
      if (!form) return { valid: false, message: 'Form not found.' };
      
      const name = form.querySelector('#ship-name').value.trim();
      const email = form.querySelector('#ship-email').value.trim();
      const address = form.querySelector('#ship-address').value.trim();
      const city = form.querySelector('#ship-city').value.trim();
      const zip = form.querySelector('#ship-zip').value.trim();

      if (!name || !email || !address || !city || !zip) {
        return { valid: false, message: 'Please fill in all shipping fields.' };
      }
      if (!/\S+@\S+\.\S+/.test(email)) {
        return { valid: false, message: 'Please enter a valid email address.' };
      }

      shippingData.fullName = name;
      shippingData.email = email;
      shippingData.address = address;
      shippingData.city = city;
      shippingData.zip = zip;
      return { valid: true };
    }

    if (step === 2) {
      if (paymentData.method === 'card') {
        const form = modal.querySelector('#payment-form');
        if (!form) return { valid: false, message: 'Form not found.' };

        const name = form.querySelector('#pay-name').value.trim();
        const number = form.querySelector('#pay-number').value.replace(/\s/g, '');
        const expiry = form.querySelector('#pay-expiry').value.trim();
        const cvv = form.querySelector('#pay-cvv').value.trim();

        if (!name || !number || !expiry || !cvv) {
          return { valid: false, message: 'Please complete all credit card fields.' };
        }
        if (number.length < 16) {
          return { valid: false, message: 'Card number must be 16 digits.' };
        }
        if (!/^\d\d\/\d\d$/.test(expiry)) {
          return { valid: false, message: 'Expiry must be in MM/YY format.' };
        }
        if (cvv.length < 3) {
          return { valid: false, message: 'CVV must be 3 or 4 digits.' };
        }

        paymentData.cardHolder = name;
        paymentData.cardNumber = form.querySelector('#pay-number').value;
        paymentData.cardExpiry = expiry;
        paymentData.cardCvv = cvv;
        return { valid: true };
      } else if (paymentData.method === 'upi') {
        const upiVal = paymentData.upiId;
        if (!upiVal) {
          return { valid: false, message: 'Please enter your UPI ID.' };
        }
        if (!/^[\w.-]+@[\w.-]+$/.test(upiVal)) {
          return { valid: false, message: 'Please enter a valid UPI ID (e.g. name@upi).' };
        }
        return { valid: true };
      } else if (paymentData.method === 'netbanking') {
        if (!paymentData.bank) {
          return { valid: false, message: 'Please select a bank for Net Banking.' };
        }
        return { valid: true };
      } else if (paymentData.method === 'cod') {
        return { valid: true };
      }
    }

    return { valid: true };
  };

  const nextStep = () => {
    const valResult = validateForm();
    if (!valResult.valid) {
      import('./Toast.js').then(({ Toast }) => {
        Toast.danger(valResult.message);
      });
      return;
    }

    if (step < 3) {
      step++;
      render();
    } else if (step === 3) {
      // Simulate backend payment authorization
      const nextBtn = modal.querySelector('#wiz-next-btn');
      if (nextBtn) {
        nextBtn.disabled = true;
        nextBtn.textContent = 'Processing Payment...';
      }

      setTimeout(() => {
        // Generate random Order ID
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numPart = Math.floor(100000 + Math.random() * 900000);
        const charPart = alphabet.charAt(Math.floor(Math.random() * 26)) + alphabet.charAt(Math.floor(Math.random() * 26));
        generatedOrderId = `AU-${charPart}${numPart}`;

        step = 4;
        import('./Toast.js').then(({ Toast }) => {
          Toast.success("Payment authorized successfully!");
        });
        render();
      }, 1800);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      step--;
      render();
    }
  };

  const close = () => {
    overlay.classList.remove('active');
    modal.style.transform = 'scale(0.9)';
    overlay.addEventListener('transitionend', (e) => {
      if (e.propertyName === 'opacity') {
        overlay.remove();
        if (onClose) onClose();
      }
    });
  };

  const open = () => {
    document.getElementById('modal-root').appendChild(overlay);
    // Force layout repaint
    overlay.offsetHeight;
    overlay.classList.add('active');
    render();
  };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && step < 4) {
      close();
    }
  });

  return {
    open,
    close
  };
}
