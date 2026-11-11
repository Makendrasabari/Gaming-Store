/**
 * STACKLY GAMING STORE - MAIN JAVASCRIPT (main.js)
 * Global Cart Engine (Multi-click Quantity Increment, Navbar Quantity Badge),
 * Premium Right-to-Left Heading Animations, Hero Slideshow (2s), Modals
 */

/* ==========================================================================
   1. GLOBAL STACKLY CART ENGINE
   ========================================================================== */
window.closeCartDrawer = function (e) {
  if (window.StacklyCart && typeof window.StacklyCart.close === 'function') {
    window.StacklyCart.close(e);
  }
};

window.StacklyCart = {
  _initialized: false,
  _isOpen: false,
  _lastToggle: 0,

  getCart() {
    try {
      return JSON.parse(localStorage.getItem('stackly_cart') || '[]');
    } catch (e) {
      return [];
    }
  },

  saveCart(cart) {
    localStorage.setItem('stackly_cart', JSON.stringify(cart));
    this.render();
    this.updateBadges();
  },

  getTotalQty() {
    const cart = this.getCart();
    return cart.reduce((sum, item) => sum + (parseInt(item.qty, 10) || 1), 0);
  },

  isOpen() {
    const drawer = document.querySelector('.cart-drawer, #cart-drawer');
    return drawer ? drawer.classList.contains('active') : this._isOpen;
  },

  open() {
    this._isOpen = true;
    ensureGlobalCartDrawer();

    const drawers = document.querySelectorAll('.cart-drawer, #cart-drawer');
    drawers.forEach(d => {
      d.classList.add('active');
      d.setAttribute('aria-hidden', 'false');
    });

    const overlays = document.querySelectorAll('.cart-drawer-overlay, #cart-overlay');
    overlays.forEach(o => {
      o.classList.add('active');
      o.setAttribute('aria-hidden', 'false');
    });

    document.body.classList.add('cart-open');
    document.documentElement.classList.add('cart-open');

    this.render();
    this.updateBadges();

    if (window.lenis && typeof window.lenis.stop === 'function') {
      window.lenis.stop();
    }
  },

  close(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();

    this._isOpen = false;

    const drawers = document.querySelectorAll('.cart-drawer, #cart-drawer');
    drawers.forEach(d => {
      d.classList.remove('active');
      d.setAttribute('aria-hidden', 'true');
    });

    const overlays = document.querySelectorAll('.cart-drawer-overlay, #cart-overlay');
    overlays.forEach(o => {
      o.classList.remove('active');
      o.setAttribute('aria-hidden', 'true');
    });

    document.body.classList.remove('cart-open');
    document.documentElement.classList.remove('cart-open');

    if (window.location.hash === '#cart') {
      try {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch (err) {}
    }

    if (window.lenis && typeof window.lenis.start === 'function') {
      window.lenis.start();
    }
  },

  toggle(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();

    const now = Date.now();
    if (now - this._lastToggle < 250) return;
    this._lastToggle = now;

    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  },

  add(title, price, image, id, btnEl, qtyToAdd = 1) {
    const cart = this.getCart();
    const cleanTitle = (title || 'Gaming Product').trim();
    const prodId = id || cleanTitle.toLowerCase()
      .replace(/:\s*premium\s*bundle/gi, '-premium')
      .replace(/[^a-z0-9]/g, '-');
    const numPrice = typeof price === 'number' ? price : parseFloat(String(price).replace(/[^0-9.]/g, '')) || 0;
    const addCount = Math.max(1, parseInt(qtyToAdd, 10) || 1);

    // Check if product already exists in cart (by id or normalized title)
    const existing = cart.find(item => {
      if (item.id === prodId) return true;
      const t1 = (item.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const t2 = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
      return t1 === t2 || t1.includes(t2) || t2.includes(t1);
    });

    let currentQty = addCount;

    if (existing) {
      // Successive clicks increment existing quantity (1 -> 2 -> 3...)
      existing.qty = (parseInt(existing.qty, 10) || 1) + addCount;
      currentQty = existing.qty;
    } else {
      // First click adds with chosen quantity
      cart.push({
        id: prodId,
        title: cleanTitle,
        price: numPrice,
        image: image || 'assets/images/shop-hero.webp',
        qty: addCount
      });
      currentQty = addCount;
    }

    this.saveCart(cart);

    // Dynamic button feedback on the clicked button
    let targetBtn = btnEl;
    if (!targetBtn && window.event) {
      const evtTarget = window.event.target || window.event.srcElement;
      if (evtTarget && evtTarget.closest) {
        targetBtn = evtTarget.closest('.btn-add-cart, #modal-add-btn, .btn-primary');
      }
    }
    if (targetBtn && !targetBtn.classList.contains('cart-stepper-btn')) {
      const origText = targetBtn.getAttribute('data-orig-text') || targetBtn.textContent;
      targetBtn.setAttribute('data-orig-text', origText);
      targetBtn.classList.add('btn-added');
      targetBtn.innerHTML = `&#10003; Added (${currentQty})`;
      clearTimeout(targetBtn.__addTimeout);
      targetBtn.__addTimeout = setTimeout(() => {
        targetBtn.classList.remove('btn-added');
        targetBtn.textContent = origText;
      }, 1400);

      // Trigger flying particle animation to navbar cart icon
      triggerFlyingCartParticle(targetBtn);
    }

    // Open slideout drawer & display toast notification
    this.open();
    showToastNotification(`Added "${cleanTitle}" to cart (Qty: ${currentQty}).`);

    // Sync full cart page if on cart.html
    if (typeof window.renderCartPage === 'function') {
      window.renderCartPage();
    }
  },

  changeQty(index, delta) {
    const cart = this.getCart();
    if (cart[index]) {
      cart[index].qty = (parseInt(cart[index].qty, 10) || 1) + delta;
      if (cart[index].qty <= 0) {
        cart.splice(index, 1);
      }
      this.saveCart(cart);
      if (typeof window.renderCartPage === 'function') {
        window.renderCartPage();
      }
    }
  },

  removeItem(indexOrEvent, maybeIndex) {
    let index = indexOrEvent;
    if (indexOrEvent && typeof indexOrEvent.preventDefault === 'function') {
      index = maybeIndex;
    }
    const idx = parseInt(index, 10);
    if (isNaN(idx)) return;
    const cart = this.getCart();
    if (cart[idx]) {
      const removedTitle = cart[idx].title;
      cart.splice(idx, 1);
      this.saveCart(cart);
      showToastNotification(`Removed "${removedTitle}" from cart.`);
      if (typeof window.renderCartPage === 'function') {
        window.renderCartPage();
      }
    }
  },

  clear() {
    if (this.getCart().length === 0) return;
    this.saveCart([]);
    this.render();
    this.updateBadges();
    showToastNotification('All items removed from cart.', 'info');
    if (typeof window.renderCartPage === 'function') {
      window.renderCartPage();
    }
  },

  updateBadges() {
    const totalQty = this.getTotalQty();
    const badges = document.querySelectorAll('#nav-cart-count, #toolbar-cart-count, #floating-cart-count, .nav-cart-badge, .floating-badge-val');
    badges.forEach(b => {
      b.textContent = totalQty;
      b.classList.remove('pop');
      void b.offsetWidth; // trigger reflow
      b.classList.add('pop');
      setTimeout(() => b.classList.remove('pop'), 450);
    });
  },

  render() {
    const listEl = document.getElementById('cart-items-list');
    const subtotalEl = document.getElementById('cart-subtotal');
    const grandTotalEl = document.getElementById('cart-grand-total');
    const cart = this.getCart();
    const totalQty = this.getTotalQty();

    this.updateBadges();

    if (!listEl) return;

    if (cart.length === 0) {
      listEl.innerHTML = `
        <div class="cart-empty-state">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          <h4>YOUR CART IS EMPTY</h4>
          <p>No games or battlestation hardware selected yet.</p>
          <a href="shop.html" class="btn btn-primary" onclick="if(window.location.pathname.includes('shop.html')){event.preventDefault();} StacklyCart.close();" style="margin-top: 1.25rem; padding: 0.6rem 1.4rem; font-size: 0.88rem;">Explore Catalog</a>
        </div>
      `;
      if (subtotalEl) subtotalEl.textContent = '$0.00';
      if (grandTotalEl) grandTotalEl.textContent = '$0.00';
      return;
    }

    let subtotal = 0;
    let html = `
      <div class="cart-drawer-top-actions">
        <span class="cart-total-items-badge">${totalQty} Total Items</span>
        <button class="cart-clear-btn" type="button" onclick="StacklyCart.clear()">Clear Cart</button>
      </div>
    `;

    cart.forEach((item, idx) => {
      const itemPrice = parseFloat(item.price) || 0;
      const itemQty = parseInt(item.qty, 10) || 1;
      const itemTotal = itemPrice * itemQty;
      subtotal += itemTotal;

      html += `
        <div class="cart-item-row" data-id="${item.id}">
          <img src="${item.image}" alt="${item.title}" class="cart-item-thumb">
          <div class="cart-item-info">
            <div class="cart-item-name" title="${item.title}">${item.title}</div>
            <div class="cart-item-unit-price">$${itemPrice.toFixed(2)} each</div>
            
            <!-- Quantity Stepper (+ / -) -->
            <div class="cart-stepper-box">
              <button class="cart-stepper-btn" type="button" onclick="StacklyCart.changeQty(${idx}, -1)" title="Decrease Quantity" aria-label="Decrease">&minus;</button>
              <span class="cart-stepper-qty">${itemQty}</span>
              <button class="cart-stepper-btn" type="button" onclick="StacklyCart.changeQty(${idx}, 1)" title="Increase Quantity" aria-label="Increase">&plus;</button>
            </div>
          </div>
          
          <div class="cart-item-action-col">
            <span class="cart-item-total-price">$${itemTotal.toFixed(2)}</span>
            <button class="cart-remove-item" type="button" data-index="${idx}" onclick="StacklyCart.removeItem(${idx})" title="Remove item" aria-label="Remove item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="pointer-events: none;">
                <line x1="18" y1="6" x2="6" y2="18" style="pointer-events: none;"></line>
                <line x1="6" y1="6" x2="18" y2="18" style="pointer-events: none;"></line>
              </svg>
            </button>
          </div>
        </div>
      `;
    });

    listEl.innerHTML = html;
    if (subtotalEl) subtotalEl.textContent = '$' + subtotal.toFixed(2);
    if (grandTotalEl) grandTotalEl.textContent = '$' + subtotal.toFixed(2);
  }
};

// Global shorthand for inline buttons
window.addToCart = function (title, price, image, id, btnEl, qtyToAdd) {
  StacklyCart.add(title, price, image, id, btnEl, qtyToAdd);
};

// Global Product Detail Modal Injection & Controller
function ensureGlobalProductModal() {
  if (document.getElementById('product-modal')) return;

  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'product-modal-overlay';
  modalOverlay.id = 'product-modal';
  modalOverlay.setAttribute('role', 'dialog');
  modalOverlay.setAttribute('aria-modal', 'true');
  modalOverlay.setAttribute('aria-labelledby', 'modal-title');
  modalOverlay.innerHTML = `
    <div class="product-modal-box">
      <button class="modal-close-btn" onclick="closeProductModal()" aria-label="Close dialog">&times;</button>
      <div style="height: 240px; overflow: hidden; background-color: #12181E; position: relative;">
        <img src="" id="modal-img" alt="Product Image" style="width: 100%; height: 100%; object-fit: cover;">
        <div style="position: absolute; inset: 0; pointer-events: none; background: linear-gradient(to top, rgba(12, 16, 20, 0.95) 0%, transparent 45%);"></div>
      </div>
      <div style="padding: 2rem;">
        <span class="badge-lime" id="modal-category">VERIFIED GEAR</span>
        <h3 id="modal-title" style="font-size: 1.55rem; color: #FFF; margin: 0.75rem 0; font-family: var(--font-display); letter-spacing: 0.02em;">Product Title</h3>
        <p id="modal-desc" style="color: var(--text-gray); margin-bottom: 1.5rem; line-height: 1.6; font-size: 0.95rem;">Description</p>
        <div class="modal-footer-action-row" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 1.25rem; gap: 1rem; flex-wrap: wrap;">
          <div style="display: flex; flex-direction: column;">
            <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-gray); font-family: var(--font-mono);">Unit Price</span>
            <span id="modal-price" style="font-family: var(--font-display); font-size: 1.6rem; color: var(--accent-lime); font-weight: 700;">$0.00</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div class="modal-stepper-box" style="display: inline-flex; align-items: center; background: #07090C; border: 1px solid rgba(0, 255, 135, 0.35); border-radius: var(--radius-sm, 6px); padding: 2px 6px;">
              <button type="button" class="modal-stepper-btn" id="modal-qty-minus" style="background: none; border: none; color: #00FF87; font-size: 1.25rem; font-weight: bold; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center;" title="Decrease quantity" aria-label="Decrease quantity">&minus;</button>
              <span class="modal-stepper-val" id="modal-qty-val" style="min-width: 30px; text-align: center; font-family: var(--font-display); font-weight: 700; color: #FFFFFF; font-size: 1.15rem; user-select: none;">1</span>
              <button type="button" class="modal-stepper-btn" id="modal-qty-plus" style="background: none; border: none; color: #00FF87; font-size: 1.25rem; font-weight: bold; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center;" title="Increase quantity" aria-label="Increase quantity">&plus;</button>
            </div>
            <button class="btn btn-primary" id="modal-add-btn" style="display: inline-flex; align-items: center; gap: 0.5rem; min-width: 145px; justify-content: center; font-weight: 700;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              <span id="modal-add-btn-text">Add to Cart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalOverlay);
  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) closeProductModal();
  };
}

window.closeProductModal = function () {
  const modal = document.getElementById('product-modal');
  if (modal) modal.classList.remove('active');
  if (window.lenis && typeof window.lenis.start === 'function') {
    window.lenis.start();
  }
};

window.openProductModal = function (title, price, desc, img, id) {
  ensureGlobalProductModal();
  const modal = document.getElementById('product-modal');
  if (!modal) return;

  const titleEl = document.getElementById('modal-title');
  const priceEl = document.getElementById('modal-price');
  const descEl = document.getElementById('modal-desc');
  const imgEl = document.getElementById('modal-img');
  const qtyVal = document.getElementById('modal-qty-val');
  const minusBtn = document.getElementById('modal-qty-minus');
  const plusBtn = document.getElementById('modal-qty-plus');
  const addBtn = document.getElementById('modal-add-btn');
  const addBtnText = document.getElementById('modal-add-btn-text');

  if (titleEl) titleEl.textContent = title;
  if (priceEl) priceEl.textContent = typeof price === 'number' ? `$${price.toFixed(2)}` : String(price);
  if (descEl) descEl.textContent = desc || 'High octane open world racing with Hot Wheels expansion included.';
  if (imgEl && img) imgEl.src = img;

  let selectedQty = 1;
  if (qtyVal) qtyVal.textContent = '1';

  if (minusBtn) {
    minusBtn.onclick = (e) => {
      e.stopPropagation();
      if (selectedQty > 1) {
        selectedQty--;
        if (qtyVal) qtyVal.textContent = selectedQty;
      }
    };
  }

  if (plusBtn) {
    plusBtn.onclick = (e) => {
      e.stopPropagation();
      selectedQty++;
      if (qtyVal) qtyVal.textContent = selectedQty;
    };
  }

  if (addBtn) {
    addBtn.onclick = (e) => {
      e.stopPropagation();
      // Store in cart and increase the quantity
      StacklyCart.add(title, price, img, id, addBtn, selectedQty);

      // Animate button feedback with new number
      addBtn.classList.add('btn-added');
      if (addBtnText) addBtnText.textContent = `✓ Added (${selectedQty})`;

      setTimeout(() => {
        addBtn.classList.remove('btn-added');
        if (addBtnText) addBtnText.textContent = 'Add to Cart';
      }, 1400);

      // Reset stepper for next click
      selectedQty = 1;
      if (qtyVal) qtyVal.textContent = '1';
    };
  }

  modal.classList.add('active');
  if (window.lenis && typeof window.lenis.stop === 'function') {
    window.lenis.stop();
  }
};


// Flying Particle Animation to Navbar Cart
function triggerFlyingCartParticle(fromEl) {
  const navCartBtn = document.getElementById('nav-cart-btn');
  if (!fromEl || !navCartBtn) return;

  const fromRect = fromEl.getBoundingClientRect();
  const toRect = navCartBtn.getBoundingClientRect();

  const particle = document.createElement('div');
  particle.className = 'cart-flying-particle';
  particle.style.left = (fromRect.left + fromRect.width / 2) + 'px';
  particle.style.top = (fromRect.top + fromRect.height / 2) + 'px';
  document.body.appendChild(particle);

  // Force reflow
  void particle.offsetWidth;

  particle.style.left = (toRect.left + toRect.width / 2) + 'px';
  particle.style.top = (toRect.top + toRect.height / 2) + 'px';
  particle.style.transform = 'translate(-50%, -50%) scale(0.4)';
  particle.style.opacity = '0.3';

  setTimeout(() => {
    particle.remove();
    const badge = document.getElementById('nav-cart-count');
    if (badge) {
      badge.classList.remove('pop');
      void badge.offsetWidth;
      badge.classList.add('pop');
    }
  }, 750);
}

// Modern Cyberpunk In-App Toast Notification System (Zero Browser Popups)
function showToastNotification(message, type = 'success') {
  let toast = document.getElementById('shop-toast-msg');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'shop-toast-msg';
    document.body.appendChild(toast);
  }

  let iconHtml = '&#10003;';
  let accentColor = '#00FF87';
  let glowColor = 'rgba(0, 255, 135, 0.35)';

  if (type === 'warning') {
    iconHtml = '&#9888;';
    accentColor = '#FFB800';
    glowColor = 'rgba(255, 184, 0, 0.35)';
  } else if (type === 'error') {
    iconHtml = '&#10005;';
    accentColor = '#FF3B30';
    glowColor = 'rgba(255, 59, 48, 0.35)';
  } else if (type === 'info') {
    iconHtml = '&#8505;';
    accentColor = '#00F0FF';
    glowColor = 'rgba(0, 240, 255, 0.35)';
  }

  // Placed at bottom-left so it NEVER blocks the cart sidebar or close button
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 24px;
    background: #0E1317;
    border: 1px solid ${accentColor};
    color: #FFFFFF;
    padding: 0.9rem 1.4rem;
    border-radius: 8px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.92rem;
    font-weight: 600;
    z-index: 99999;
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.75), 0 0 20px ${glowColor};
    display: flex;
    align-items: center;
    gap: 0.75rem;
    max-width: calc(100vw - 48px);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: translateY(12px);
    transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.25s ease;
    cursor: pointer;
  `;

  toast.innerHTML = `
    <span style="display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:50%; background:${accentColor}20; color:${accentColor}; font-size:0.85rem; font-weight:700; flex-shrink:0;">
      ${iconHtml}
    </span>
    <span style="flex:1; line-height:1.4;">${message}</span>
  `;

  void toast.offsetWidth;

  toast.style.visibility = 'visible';
  toast.style.pointerEvents = 'auto';
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  const hideToast = () => {
    toast.style.opacity = '0';
    toast.style.pointerEvents = 'none';
    toast.style.transform = 'translateY(12px)';
    clearTimeout(window.__toastHideTimer);
    window.__toastHideTimer = setTimeout(() => {
      if (toast.style.opacity === '0') {
        toast.style.visibility = 'hidden';
      }
    }, 250);
  };

  toast.onclick = hideToast;

  clearTimeout(window.__toastTimeout);
  window.__toastTimeout = setTimeout(hideToast, 2800);
}

// Global window.alert override to prevent browser popup notifications
window.showToastNotification = showToastNotification;
window.alert = function (message) {
  showToastNotification(message, 'info');
};

// Helper to resolve cart close button across SVG children and shadow boundaries
function findCartCloseBtn(target) {
  if (!target) return null;
  if (typeof target.closest === 'function') {
    try {
      const btn = target.closest('#cart-close-btn, .cart-close-btn, [data-cart-close]');
      if (btn) return btn;
    } catch (err) {}
  }
  let curr = target;
  while (curr && curr !== document && curr !== document.body) {
    if (curr.id === 'cart-close-btn' ||
        (curr.classList && curr.classList.contains('cart-close-btn')) ||
        (typeof curr.hasAttribute === 'function' && curr.hasAttribute('data-cart-close'))) {
      return curr;
    }
    curr = curr.parentElement || curr.parentNode;
  }
  return null;
}

// Helper to resolve item remove button across SVG children
function findCartRemoveBtn(target) {
  if (!target) return null;
  if (typeof target.closest === 'function') {
    try {
      const btn = target.closest('.cart-remove-item, [data-cart-remove]');
      if (btn) return btn;
    } catch (err) {}
  }
  let curr = target;
  while (curr && curr !== document && curr !== document.body) {
    if ((curr.classList && curr.classList.contains('cart-remove-item')) ||
        (typeof curr.hasAttribute === 'function' && curr.hasAttribute('data-cart-remove'))) {
      return curr;
    }
    curr = curr.parentElement || curr.parentNode;
  }
  return null;
}

// Helper to resolve cart toggle button across SVG children and badges
function findCartToggleBtn(target) {
  if (!target) return null;
  if (typeof target.closest === 'function') {
    try {
      const btn = target.closest('#nav-cart-btn, .nav-cart-btn, #toolbar-cart-btn, .shop-cart-launch-btn, #floating-cart-btn, .shop-floating-cart-pill, [data-cart-toggle]');
      if (btn) return btn;
    } catch (err) {}
  }
  let curr = target;
  while (curr && curr !== document && curr !== document.body) {
    if (curr.id === 'nav-cart-btn' ||
        curr.id === 'toolbar-cart-btn' ||
        curr.id === 'floating-cart-btn' ||
        (curr.classList && (curr.classList.contains('nav-cart-btn') || curr.classList.contains('shop-cart-launch-btn') || curr.classList.contains('shop-floating-cart-pill'))) ||
        (typeof curr.hasAttribute === 'function' && curr.hasAttribute('data-cart-toggle'))) {
      return curr;
    }
    curr = curr.parentElement || curr.parentNode;
  }
  return null;
}

// Global Cart Drawer DOM injection if not in page
function ensureGlobalCartDrawer() {
  let existingDrawer = document.getElementById('cart-drawer');
  if (existingDrawer) {
    existingDrawer.setAttribute('data-lenis-prevent', '');
    const checkoutBtn = existingDrawer.querySelector('#checkout-btn');
    if (checkoutBtn && !checkoutBtn._hasCheckoutBound) {
      checkoutBtn._hasCheckoutBound = true;
      checkoutBtn.onclick = (e) => {
        e.preventDefault();
        StacklyCart.close();
        const isSub = window.location.pathname.includes('customer-dashboard') || window.location.pathname.includes('admin-dashboard');
        window.location.href = isSub ? '../404.html' : '404.html';
      };
    }
    return;
  }

  // Not in page, create overlay and drawer
  const overlay = document.createElement('div');
  overlay.className = 'cart-drawer-overlay';
  overlay.id = 'cart-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  const drawer = document.createElement('aside');
  drawer.className = 'cart-drawer';
  drawer.id = 'cart-drawer';
  drawer.setAttribute('aria-label', 'Shopping Cart');
  drawer.setAttribute('aria-hidden', 'true');
  drawer.setAttribute('data-lenis-prevent', '');
  drawer.innerHTML = `
    <div class="cart-drawer-header">
      <h3 class="cart-drawer-title">YOUR GAMING CART</h3>
      <button class="cart-close-btn" id="cart-close-btn" type="button" data-cart-close="true" aria-label="Close Cart" title="Close Cart" style="cursor: pointer; pointer-events: auto !important; position: relative; z-index: 30;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="pointer-events: none;">
          <line x1="18" y1="6" x2="6" y2="18" style="pointer-events: none;"></line>
          <line x1="6" y1="6" x2="18" y2="18" style="pointer-events: none;"></line>
        </svg>
      </button>
    </div>
    
    <div class="cart-items-container" id="cart-items-list" data-lenis-prevent>
      <!-- Injected by StacklyCart.render() -->
    </div>
    
    <div class="cart-drawer-footer">
      <div class="cart-subtotal-row">
        <span>Subtotal:</span>
        <span class="cart-subtotal-val" id="cart-subtotal">$0.00</span>
      </div>
      <div class="cart-subtotal-row" style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">
        <span>Estimated Taxes:</span>
        <span style="color: var(--accent-green);">FREE</span>
      </div>
      <div class="cart-subtotal-row" style="padding-top: 0.5rem; border-top: 1px dashed var(--border-color); font-size: 1.25rem;">
        <span style="color: var(--text-white); font-weight: 700;">Grand Total:</span>
        <span class="cart-subtotal-val" id="cart-grand-total" style="font-size: 1.35rem; color: var(--accent-green);">$0.00</span>
      </div>
      
      <button class="btn btn-primary" style="width: 100%; margin-top: 0.75rem;" id="checkout-btn">
        Proceed to Checkout
      </button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);

  const checkoutBtn = drawer.querySelector('#checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.onclick = (e) => {
      e.preventDefault();
      StacklyCart.close();
      const isSub = window.location.pathname.includes('customer-dashboard') || window.location.pathname.includes('admin-dashboard');
      window.location.href = isSub ? '../404.html' : '404.html';
    };
  }
}

// Single, centralized document click listener for all cart interactions
document.addEventListener('click', function (e) {
  const target = e.target;
  if (!target) return;

  // 1. Close Button Clicked
  const closeBtn = findCartCloseBtn(target);
  if (closeBtn) {
    e.preventDefault();
    e.stopPropagation();
    StacklyCart.close(e);
    return;
  }

  // 2. Remove Item Cross Mark Clicked
  const removeBtn = findCartRemoveBtn(target);
  if (removeBtn) {
    e.preventDefault();
    e.stopPropagation();
    const idx = parseInt(removeBtn.getAttribute('data-index'), 10);
    if (!isNaN(idx)) {
      StacklyCart.removeItem(idx);
    }
    return;
  }

  // 3. Cart Toggle Button Clicked (Navbar Cart, Toolbar Cart, Floating Cart)
  const toggleBtn = findCartToggleBtn(target);
  if (toggleBtn) {
    e.preventDefault();
    e.stopPropagation();
    StacklyCart.toggle(e);
    return;
  }

  // 4. Overlay Clicked Outside Drawer
  if (target.id === 'cart-overlay' || (target.classList && target.classList.contains('cart-drawer-overlay'))) {
    e.preventDefault();
    e.stopPropagation();
    StacklyCart.close(e);
    return;
  }
}, true);

// Escape key to close cart
document.addEventListener('keydown', function (e) {
  if ((e.key === 'Escape' || e.key === 'Esc') && StacklyCart.isOpen()) {
    StacklyCart.close();
  }
});

/* ==========================================================================
   2. PREMIUM RIGHT-TO-LEFT CINEMATIC HEADING ANIMATION SYSTEM
   ========================================================================== */
window.initCinematicHeadings = function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const selector = [
    '.hero-title',
    '.hero-eyebrow',
    '.section-title',
    '.section-eyebrow',
    'h1',
    'h2',
    '.spotlight-title',
    '.dash-welcome-title',
    '.admin-page-title',
    '.dash-panel-title',
    '.admin-panel-title',
    '.dash-card-title'
  ].join(', ');

  const headings = document.querySelectorAll(selector);

  headings.forEach(heading => {
    if (heading.dataset.cinematicReady) return;
    if (heading.closest('#gaming-preloader') || heading.closest('form') || heading.closest('.auth-form-inner') || heading.closest('.cart-drawer')) return;
    heading.dataset.cinematicReady = 'true';
    heading.classList.add('cinematic-heading-wrap');

    prepareWordsInNode(heading);
  });

  function resetWords(container) {
    container.dataset.cinematicTriggered = '';
    const words = container.querySelectorAll('.cinematic-word-right');
    words.forEach(w => w.classList.remove('is-settled'));
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateWords(entry.target);
      } else {
        resetWords(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '20px 0px 20px 0px'
  });

  headings.forEach(h => {
    observer.observe(h);
    const rect = h.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setTimeout(() => animateWords(h), 120);
    }
  });

  function prepareWordsInNode(parent) {
    const children = Array.from(parent.childNodes);
    children.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent;
        if (!text.trim()) return;

        const chunks = text.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        chunks.forEach(chunk => {
          if (!chunk) return;
          if (/^\s+$/.test(chunk)) {
            frag.appendChild(document.createTextNode(chunk));
          } else {
            const span = document.createElement('span');
            span.className = 'cinematic-word-right';
            span.textContent = chunk;
            frag.appendChild(span);
          }
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        if (child.tagName.toLowerCase() === 'br') return;
        prepareWordsInNode(child);
      }
    });
  }

  function animateWords(container) {
    if (container.dataset.cinematicTriggered) return;
    container.dataset.cinematicTriggered = 'true';

    const words = container.querySelectorAll('.cinematic-word-right');
    if (words.length === 0) {
      container.classList.add('is-settled');
      return;
    }

    words.forEach((word, index) => {
      setTimeout(() => {
        word.classList.add('is-settled');
      }, index * 120); // 120ms stagger between each word entering from the right
    });
  }
};

/* ==========================================================================
   3. DOM INITIALIZATION
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {

  // Universal: Block all native browser validation tooltips ("Please fill out this field") across all forms
  document.addEventListener('invalid', (e) => {
    e.preventDefault();
  }, true);

  // Universal: Newsletter Form Inline Red Notification
  const newsletterForm = document.getElementById('newsletter-form') || document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.setAttribute('novalidate', 'true');
    const emailInput = document.getElementById('newsletter-email') || newsletterForm.querySelector('input[type="email"], .newsletter-input');
    const errorMsg = document.getElementById('newsletter-error') || newsletterForm.querySelector('.validation-error-msg, .field-error-msg');

    if (emailInput && errorMsg) {
      emailInput.addEventListener('input', () => {
        emailInput.classList.remove('error');
        errorMsg.classList.remove('visible');
      });

      newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!val) {
          emailInput.classList.add('error');
          errorMsg.textContent = 'Please enter your email address.';
          errorMsg.classList.add('visible');
          emailInput.focus();
          return;
        }

        if (!emailRegex.test(val)) {
          emailInput.classList.add('error');
          errorMsg.textContent = 'Please enter a valid email address.';
          errorMsg.classList.add('visible');
          emailInput.focus();
          return;
        }

        // Valid: navigate to 404 page
        window.location.href = '404.html';
      });
    }
  }

  // A. Initialize Global Cart
  ensureGlobalCartDrawer();
  StacklyCart.render();
  StacklyCart.updateBadges();

  // Attach to all cart toggle buttons across navbar, toolbar, floating
  const toggleButtons = document.querySelectorAll('#nav-cart-btn, .nav-cart-btn, #toolbar-cart-btn, .shop-cart-launch-btn, #floating-cart-btn, .shop-floating-cart-pill, [data-cart-toggle]');
  toggleButtons.forEach(btn => {
    btn.onclick = (e) => {
      if (e) e.preventDefault();
      if (window.StacklyCart && typeof window.StacklyCart.toggle === 'function') {
        window.StacklyCart.toggle(e);
      } else if (window.StacklyCart) {
        StacklyCart.open();
      }
    };
  });

  // Footer Stackly Logo Behavior: Smooth scroll to top if already on Home, otherwise standard navigation
  const footerLogoLinks = document.querySelectorAll('.footer-logo-link');
  footerLogoLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const path = window.location.pathname.toLowerCase();
      const isHome = path.endsWith('index.html') || path === '/' || path.endsWith('/') || !path.includes('.html');
      if (isHome) {
        e.preventDefault();
        if (window.lenis && typeof window.lenis.scrollTo === 'function') {
          window.lenis.scrollTo(0, { duration: 1.1 });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    });
  });

  // Check URL param ?open=cart
  if (window.location.search.includes('open=cart') || window.location.hash === '#cart') {
    setTimeout(() => StacklyCart.open(), 300);
  }

  // B. Initialize Cinematic Heading Animations
  window.initCinematicHeadings();

  // C. Homepage Hero Background Slideshow (5 images, 2-sec interval)
  const slides = document.querySelectorAll('.hero-slide');
  if (slides && slides.length > 1) {
    const spotlightName = document.getElementById('hero-spotlight-name');
    const spotlightGenre = document.getElementById('hero-spotlight-genre');
    let currentSlide = 0;

    setInterval(() => {
      slides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('active');

      if (spotlightName && slides[currentSlide].dataset.title) {
        spotlightName.style.opacity = '0';
        setTimeout(() => {
          spotlightName.textContent = slides[currentSlide].dataset.title;
          if (spotlightGenre && slides[currentSlide].dataset.genre) {
            spotlightGenre.textContent = slides[currentSlide].dataset.genre;
          }
          spotlightName.style.opacity = '1';
        }, 180);
      }
    }, 2000);
  }

  // D. Scroll-triggered section reveals (Bi-directional top-to-bottom and bottom-to-top)
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  if ('IntersectionObserver' in window && revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
        } else {
          entry.target.classList.remove('is-revealed');
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '20px 0px 20px 0px'
    });

    revealElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('is-revealed');
      }
      revealObserver.observe(el);
    });
  } else {
    revealElements.forEach(el => el.classList.add('is-revealed'));
  }

  // E. Live Stats Numbers Runner Engine (Smooth Odometer Count-Up & Live Ticker)
  initLiveStatsRunner();

  // F. 3D Card Perspective Tilt
  const tiltCards = document.querySelectorAll('.playstyle-card');
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotateX = -(y / (rect.height / 2)) * 6;
      const rotateY = (x / (rect.width / 2)) * 6;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });
  });

  // G. Global Modal System
  let legalModal = document.getElementById('stackly-info-modal');
  if (!legalModal) {
    legalModal = document.createElement('div');
    legalModal.id = 'stackly-info-modal';
    legalModal.className = 'stackly-global-modal';
    legalModal.innerHTML = `
      <div class="stackly-modal-backdrop"></div>
      <div class="stackly-modal-dialog">
        <div class="stackly-modal-header">
          <h3 class="stackly-modal-title" id="info-modal-title">Stackly Notice</h3>
          <button class="stackly-modal-close" id="info-modal-close" aria-label="Close Modal">&times;</button>
        </div>
        <div class="stackly-modal-body" id="info-modal-body" data-lenis-prevent>
          <p>Stackly Gaming Hub content loading...</p>
        </div>
        <div class="stackly-modal-footer">
          <button class="btn btn-primary" id="info-modal-ack-btn" style="padding: 0.6rem 1.4rem;">Understood</button>
        </div>
      </div>
    `;
    document.body.appendChild(legalModal);

    const closeModal = () => {
      legalModal.classList.remove('active');
      if (window.lenis && typeof window.lenis.start === 'function') {
        window.lenis.start();
      }
    };
    legalModal.querySelector('.stackly-modal-backdrop').addEventListener('click', closeModal);
    document.getElementById('info-modal-close').addEventListener('click', closeModal);
    document.getElementById('info-modal-ack-btn').addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && legalModal.classList.contains('active')) closeModal();
    });
  }

  window.openInfoModal = function (title, contentHtml) {
    document.getElementById('info-modal-title').textContent = title;
    document.getElementById('info-modal-body').innerHTML = contentHtml;
    legalModal.classList.add('active');
    if (window.lenis && typeof window.lenis.stop === 'function') {
      window.lenis.stop();
    }
  };

  // Footer Links Modal Handlers
  document.querySelectorAll('a').forEach(link => {
    const text = link.textContent.trim().toLowerCase();
    const href = link.getAttribute('href');

    if ((href === '#' || !href) && (text.includes('privacy') || text.includes('policy'))) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        window.openInfoModal(
          'Stackly Privacy Policy',
          `<h4>1. Data Protection & Player Identity</h4>
           <p style="color: var(--text-gray); margin-bottom: 1rem; line-height: 1.6;">At Stackly, we uphold ironclad telemetry standards. Your game achievements, playtime analytics, hardware benchmarks, and order histories are encrypted using AES-256 and never sold to third-party ad brokers.</p>
           <h4>2. Account Security</h4>
           <p style="color: var(--text-gray); margin-bottom: 1rem; line-height: 1.6;">We enforce strict role-based access control across all customer and administrative tiers with tokenized sessions and end-to-end checksum verification.</p>
           <h4>3. Contact Privacy Officer</h4>
           <p style="color: var(--text-gray); line-height: 1.6;">Inquiries regarding data rights may be directed to <strong style="color: var(--accent-green);">privacy@stacklygaming.com</strong>.</p>`
        );
      });
    } else if ((href === '#' || !href) && (text.includes('term') || text.includes('condition'))) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        window.openInfoModal(
          'Stackly Terms & Conditions',
          `<h4>1. Universal Player Agreement</h4>
           <p style="color: var(--text-gray); margin-bottom: 1rem; line-height: 1.6;">By accessing the Stackly Gaming Store, Community Forum, or Player Hub, you agree to adhere to verified community guidelines, esport fair play standards, and software licensing covenants.</p>
           <h4>2. Digital Purchases & Warranty</h4>
           <p style="color: var(--text-gray); margin-bottom: 1rem; line-height: 1.6;">All custom GPU rigs and peripherals include standard 3-year factory warranty. Digital game keys are activated instantly via authenticated server keys.</p>
           <h4>3. Fair Play Enforcement</h4>
           <p style="color: var(--text-gray); line-height: 1.6;">Zero tolerance for malicious cheating, griefing, or unauthorized bot traffic across Stackly multiplayer lobbies.</p>`
        );
      });
    }
  });

  // H. Forum Thread Previews
  document.querySelectorAll('.discussion-row-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('.thread-author-link')) return;
      const titleEl = card.querySelector('.thread-title');
      const title = titleEl ? titleEl.textContent.trim() : 'Discussion Thread';
      const snippetEl = card.querySelector('.thread-snippet');
      const snippet = snippetEl ? snippetEl.textContent.trim() : 'Join the discussion with Stackly verified members.';

      window.openInfoModal(
        title,
        `<p style="color: var(--text-white); font-size: 1rem; margin-bottom: 1rem; line-height: 1.6;">${snippet}</p>
         <div style="background-color: #0E1317; border: 1px solid var(--border-color); padding: 1rem; border-radius: var(--radius-sm); margin-bottom: 1rem;">
           <span style="color: var(--accent-green); font-size: 0.82rem; font-weight: 700; text-transform: uppercase;">Community Verification</span>
           <p style="color: var(--text-gray); font-size: 0.88rem; margin-top: 0.35rem;">This thread has 142 replies and 98% upvote rating from Stackly community leaders.</p>
         </div>
         <a href="login.html" class="btn btn-primary" style="display: inline-block; padding: 0.6rem 1.25rem;">Reply to Thread</a>`
      );
    });
  });

  // Forum New Thread Button
  const startDiscussionBtn = document.getElementById('start-discussion-btn') || document.querySelector('.forum-new-thread-btn');
  if (startDiscussionBtn) {
    startDiscussionBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.openInfoModal(
        'Create New Discussion Thread',
        `<form id="modal-thread-form" onsubmit="event.preventDefault(); window.showToastNotification('Thread published to Stackly Community!', 'success'); document.getElementById('info-modal-close').click();">
           <div style="margin-bottom: 1rem;">
             <label style="display:block; color:var(--text-white); font-size:0.85rem; margin-bottom:0.4rem; font-weight:600;">Thread Title</label>
             <input type="text" placeholder="e.g. Best Elden Ring DLC Faith Builds" required style="width:100%; background:#0E1317; border:1px solid var(--border-color); padding:0.75rem; color:#fff; border-radius:var(--radius-sm);">
           </div>
           <div style="margin-bottom: 1rem;">
             <label style="display:block; color:var(--text-white); font-size:0.85rem; margin-bottom:0.4rem; font-weight:600;">Category</label>
             <select style="width:100%; background:#0E1317; border:1px solid var(--border-color); padding:0.75rem; color:#fff; border-radius:var(--radius-sm);">
               <option>Builds & Guides</option>
               <option>Hardware & Tuning</option>
               <option>Competitive Tactics</option>
               <option>General Gaming</option>
             </select>
           </div>
           <div style="margin-bottom: 1.25rem;">
             <label style="display:block; color:var(--text-white); font-size:0.85rem; margin-bottom:0.4rem; font-weight:600;">Discussion Content</label>
             <textarea rows="4" placeholder="Share your strategy or question..." required style="width:100%; background:#0E1317; border:1px solid var(--border-color); padding:0.75rem; color:#fff; border-radius:var(--radius-sm);"></textarea>
           </div>
           <button type="submit" class="btn btn-primary" style="width:100%; padding:0.8rem;">Publish Discussion</button>
         </form>`
      );
    });
  }

  // K. Universal 6-Card One-by-One Smooth Arrange Animation
  initUniversalSixCardsAnimation();

  // L. Universal 4-Card 3D Shuffle & Smooth Arrange Animation (Home, Forum, Blog, Shop, Contact)
  initUniversalFourCardsAnimation();

  // M. Universal 3-Card Converging Animation (Left, Down, Right -> Smooth Arrange)
  initUniversalThreeCardsAnimation();

  // N. Forum Thread Rows: Row-by-Row Smooth Arrange Animation
  initThreadRowsAnimation();

  // O. Universal 2-Card Horizontal Convergence Animation (Left from Left, Right from Right)
  initUniversalTwoCardsAnimation();

  // P. Featured Hero: Right-Side Entrance & 6-Piece Image Shatter/Join
  initFeaturedHeroAnimation();

  // Q. Universal Tabular Column: Column-by-Column Smooth Animation (All 5 Pages)
  initTabularColumnAnimation();

  // R. Bestseller Pipeline: One-by-One Arrival with Live Connecting Lines
  initBestsellerPipelineAnimation();

  // S. FAQ Accordion: One-by-One Arrival Animation
  initFaqAccordionAnimation();

  // T. Transmission Convergence: Left Card from Left, Right Cards from Right
  initTransmissionConvergenceAnimation();

  // U. Shop Duo Promotional Banners: Card 1 from Right, Card 2 from Left
  initShopDuoBannersAnimation();

  // V. Squad Image 4-Piece Split & Re-Join Animation
  initSquadImageSplitJoin();

  // W. Cyberpunk Feature Spotlight: 4-Piece Split & Re-Join Animation
  initCyberpunkSpotlightSplitJoin();

  // X. Homepage Shortlist Quick-View & Cart Integration
  initHomepageShortlistModals();

  // J. Brand Pillars 4-Card 3D Shuffle & Arrange Animation
  initPillarsShuffleAnimation();

  // I. Blog Article Previews
  document.querySelectorAll('.blog-article-card, .featured-article-hero').forEach(card => {
    const readBtn = card.querySelector('.article-read-link') || card.querySelector('.btn');
    if (readBtn && readBtn.getAttribute('href') === '#') {
      readBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const titleEl = card.querySelector('.article-title') || card.querySelector('h2') || card.querySelector('h3');
        const title = titleEl ? titleEl.textContent.trim() : 'Stackly Journal Article';
        const descEl = card.querySelector('.article-desc') || card.querySelector('p');
        const desc = descEl ? descEl.textContent.trim() : 'Detailed breakdown from the Stackly Editorial team.';

        window.openInfoModal(
          title,
          `<div style="margin-bottom: 1rem;">
             <span style="color: var(--accent-green); font-family: var(--font-display); font-size: 0.8rem; font-weight: 700; text-transform: uppercase;">STACKLY JOURNAL REPORT</span>
           </div>
           <p style="color: var(--text-white); font-size: 1.05rem; line-height: 1.7; margin-bottom: 1.25rem;">${desc}</p>
           <p style="color: var(--text-gray); line-height: 1.6; margin-bottom: 1.25rem;">We rigorously benchmarked gameplay performance across high-refresh QD-OLED displays and flagship GPUs to provide actionable settings guides for competitive players.</p>
           <div style="border-top: 1px solid var(--border-color); padding-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
             <span style="color: var(--text-muted); font-size: 0.85rem;">Author: Stackly Editorial Staff</span>
             <a href="shop.html" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem;">Explore Featured Gear</a>
           </div>`
        );
      });
    }
  });

});


/* ==========================================================================
   4. BRAND PILLARS 4-CARD 3D SHUFFLE & ARRANGE ANIMATION ENGINE
   ========================================================================== */

function runPillarsShuffleAndArrange(cards, grid) {
  const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (grid._shuffleTimers) {
    grid._shuffleTimers.forEach(id => clearTimeout(id));
  }
  grid._shuffleTimers = [];

  // Reset all motion classes
  cards.forEach(card => {
    card.classList.remove(
      'card-shuffled-0', 'card-shuffled-1', 'card-shuffled-2', 'card-shuffled-3',
      'card-arranged', 'card-settling'
    );
  });

  if (isReduced) {
    cards.forEach(card => card.classList.add('card-arranged'));
    return;
  }

  // Step 1: Disperse cards into 3D Shuffled positions
  cards.forEach((card, index) => {
    card.classList.add('card-shuffled-' + index);
  });

  // Force reflow
  void grid.offsetWidth;

  // Step 2: Staggered smooth glide & arrangement into grid slots
  // Card 0 (top-left) -> Card 1 (top-right) -> Card 2 (bottom-left) -> Card 3 (bottom-right)
  const delays = [120, 280, 440, 600];

  cards.forEach((card, index) => {
    const tid = setTimeout(() => {
      card.classList.remove('card-shuffled-' + index);
      card.classList.add('card-arranged');

      // Settling luminous flash wave
      card.classList.add('card-settling');
      const settleTid = setTimeout(() => {
        card.classList.remove('card-settling');
      }, 550);
      grid._shuffleTimers.push(settleTid);
    }, delays[index] || 120);

    grid._shuffleTimers.push(tid);
  });
}

function initPillarsShuffleAnimation() {
  const section = document.getElementById('pillarsSection');
  const grid = document.getElementById('pillarsGrid');
  if (!section || !grid) return;

  const cards = grid.querySelectorAll('.pillar-card');
  if (cards.length !== 4) return;

  const shuffleBtn = document.getElementById('pillarShuffleBtn');
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      runPillarsShuffleAndArrange(cards, grid);
    });
  }

  // Interactive click on any card to trigger settling flare
  cards.forEach(card => {
    card.addEventListener('click', () => {
      card.classList.remove('card-settling');
      void card.offsetWidth;
      card.classList.add('card-settling');
      setTimeout(() => {
        card.classList.remove('card-settling');
      }, 550);
    });
  });

  // IntersectionObserver: bi-directional top-to-bottom and bottom-to-top repeatable trigger
  if ('IntersectionObserver' in window) {
    let isVisible = false;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (!isVisible) {
            isVisible = true;
            setTimeout(() => {
              runPillarsShuffleAndArrange(cards, grid);
            }, 120);
          }
        } else {
          isVisible = false;
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '20px 0px 20px 0px'
    });

    observer.observe(section);

    const rect = section.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      isVisible = true;
      setTimeout(() => {
        runPillarsShuffleAndArrange(cards, grid);
      }, 120);
    }
  } else {
    runPillarsShuffleAndArrange(cards, grid);
  }
}


/* ==========================================================================
   5. UNIVERSAL 6-CARD ONE-BY-ONE SMOOTH ARRANGE ANIMATION ENGINE
   ========================================================================== */

function runSixCardsOneByOneArrange(cards, container) {
  const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (container._sixCardTimers) {
    container._sixCardTimers.forEach(id => clearTimeout(id));
  }
  container._sixCardTimers = [];

  // Reset classes
  cards.forEach(card => {
    card.classList.remove(
      'six-card-shuffled-0', 'six-card-shuffled-1', 'six-card-shuffled-2',
      'six-card-shuffled-3', 'six-card-shuffled-4', 'six-card-shuffled-5',
      'six-card-arranged', 'six-card-settled'
    );
  });

  if (isReduced) {
    cards.forEach(card => card.classList.add('six-card-arranged'));
    return;
  }

  // Step 1: Disperse cards into 3D Shuffled positions
  cards.forEach((card, index) => {
    card.classList.add('six-card-shuffled-' + (index % 6));
  });

  // Force reflow
  void container.offsetWidth;

  // Step 2: Smooth one-by-one glide & arrange into orderly grid
  // Card 1 -> Card 2 -> Card 3 -> Card 4 -> Card 5 -> Card 6
  const delays = [100, 260, 420, 580, 740, 900];

  cards.forEach((card, index) => {
    const tid = setTimeout(() => {
      card.classList.remove('six-card-shuffled-' + (index % 6));
      card.classList.add('six-card-arranged');

      // Flash settled luminous neon green flare wave
      card.classList.add('six-card-settled');
      const settleTid = setTimeout(() => {
        card.classList.remove('six-card-settled');
      }, 500);
      container._sixCardTimers.push(settleTid);
    }, delays[index] || (index * 130));

    container._sixCardTimers.push(tid);
  });
}

function initUniversalSixCardsAnimation() {
  const gridSelectors = [
    '.playstyle-grid',
    '.category-cards-grid',
    '.blog-cards-grid',
    '.contact-channels-grid',
    '.six-cards-grid',
    '.featured-six-grid'
  ];

  const containers = document.querySelectorAll(gridSelectors.join(', '));
  if (!containers.length) return;

  containers.forEach(container => {
    const cardSelectors = [
      '.playstyle-card',
      '.category-thread-card',
      '.blog-card',
      '.contact-channel-card',
      '.product-item-card',
      '.game-gallery-card',
      '.six-card'
    ];
    let cards = Array.from(container.querySelectorAll(cardSelectors.join(', ')));
    if (!cards.length) {
      cards = Array.from(container.children).filter(el => el.nodeType === 1);
    }
    if (cards.length < 4 || cards.length > 8) return;

    // Attach interactive click ripple / settling wave on each card (exclude display cards without click functionalities)
    if (!container.classList.contains('playstyle-grid')) {
      cards.forEach(card => {
        if (card.classList.contains('playstyle-card')) return;
        card.addEventListener('click', () => {
          card.classList.remove('six-card-settled');
          void card.offsetWidth;
          card.classList.add('six-card-settled');
          setTimeout(() => {
            card.classList.remove('six-card-settled');
          }, 500);
        });
      });
    }

    // Section header clickable to re-arrange cards one by one (exclude playstyle-grid)
    const section = container.closest('section');
    if (section && !container.classList.contains('playstyle-grid')) {
      const headerRow = section.querySelector('.section-header-row');
      if (headerRow) {
        headerRow.style.cursor = 'pointer';
        headerRow.setAttribute('title', 'Featured Articles');
        headerRow.addEventListener('click', () => {
          runSixCardsOneByOneArrange(cards, container);
        });
      }
    }

    // IntersectionObserver: bi-directional trigger one-by-one arrangement
    if ('IntersectionObserver' in window) {
      let isVisible = false;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!isVisible) {
              isVisible = true;
              setTimeout(() => {
                runSixCardsOneByOneArrange(cards, container);
              }, 120);
            }
          } else {
            isVisible = false;
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '20px 0px 20px 0px'
      });
      observer.observe(container);

      const rect = container.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        isVisible = true;
        setTimeout(() => {
          runSixCardsOneByOneArrange(cards, container);
        }, 120);
      }
    } else {
      runSixCardsOneByOneArrange(cards, container);
    }
  });
}

/* ==========================================================================
   6. UNIVERSAL 4-CARD 3D SHUFFLE & ARRANGE ANIMATION ENGINE
   (Home, Forum, Blog, Shop, Contact Pages)
   ========================================================================== */

function runFourCardsShuffleAndArrange(cards, container) {
  const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Clear any existing animation timers on this container
  if (container._fourCardTimers) {
    container._fourCardTimers.forEach(tid => clearTimeout(tid));
  }
  container._fourCardTimers = [];

  // Reset classes
  cards.forEach(card => {
    card.classList.remove(
      'four-card-shuffled-0',
      'four-card-shuffled-1',
      'four-card-shuffled-2',
      'four-card-shuffled-3',
      'four-card-arranged',
      'four-card-settled'
    );
  });

  if (isReduced) {
    cards.forEach(card => card.classList.add('four-card-arranged'));
    return;
  }

  // Phase 1: Disperse cards into 3D shuffled fan positions
  cards.forEach((card, index) => {
    card.classList.add(`four-card-shuffled-${index % 4}`);
  });

  // Phase 2: Smoothly arrange cards one-by-one into their respective slots
  const arrangeDelays = [120, 280, 440, 600];

  cards.forEach((card, index) => {
    const tid = setTimeout(() => {
      card.classList.remove(`four-card-shuffled-${index % 4}`);
      card.classList.add('four-card-arranged');

      // Phase 3: Settling luminous neon green flare wave
      const settleTid = setTimeout(() => {
        card.classList.add('four-card-settled');
        const clearSettleTid = setTimeout(() => {
          card.classList.remove('four-card-settled');
        }, 500);
        container._fourCardTimers.push(clearSettleTid);
      }, 350);
      container._fourCardTimers.push(settleTid);
    }, arrangeDelays[index] || (index * 160));

    container._fourCardTimers.push(tid);
  });
}

function initUniversalFourCardsAnimation() {
  const gridSelectors = [
    '.shortlist-grid',
    '.four-cards-grid',
    '.four-card-grid',
    '.pillars-grid'
  ];

  const containers = document.querySelectorAll(gridSelectors.join(', '));
  if (!containers.length) return;

  containers.forEach(container => {
    const cardSelectors = [
      '.shortlist-card',
      '.pillar-card',
      '.product-item-card',
      '.review-card',
      '.guarantee-card',
      '.four-card',
      'article'
    ];
    let cards = Array.from(container.querySelectorAll(cardSelectors.join(', ')));
    if (!cards.length) {
      cards = Array.from(container.children).filter(el => el.nodeType === 1);
    }
    // Only target sets of 4 cards
    if (cards.length !== 4) return;

    // Interactive click ripple on each card
    cards.forEach(card => {
      card.addEventListener('click', () => {
        card.classList.remove('four-card-settled');
        void card.offsetWidth;
        card.classList.add('four-card-settled');
        setTimeout(() => {
          card.classList.remove('four-card-settled');
        }, 500);
      });
    });

    // IntersectionObserver: bi-directional trigger shuffle and arrange
    if ('IntersectionObserver' in window) {
      let isVisible = false;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!isVisible) {
              isVisible = true;
              setTimeout(() => {
                runFourCardsShuffleAndArrange(cards, container);
              }, 120);
            }
          } else {
            isVisible = false;
          }
        });
      }, {
        threshold: 0.12,
        rootMargin: '20px 0px 20px 0px'
      });
      observer.observe(container);

      const rect = container.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        isVisible = true;
        setTimeout(() => {
          runFourCardsShuffleAndArrange(cards, container);
        }, 120);
      }
    } else {
      runFourCardsShuffleAndArrange(cards, container);
    }
  });
}

/* ==========================================================================
   7. UNIVERSAL 3-CARD CONVERGING ANIMATION (LEFT, DOWN, RIGHT)
   (Home, Forum, Blog, Shop, Contact Pages)
   ========================================================================== */

function runThreeCardsConvergence(cards, container) {
  const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Clear any existing animation timers on this container
  if (container._threeCardTimers) {
    container._threeCardTimers.forEach(tid => clearTimeout(tid));
  }
  container._threeCardTimers = [];

  // Reset classes
  cards.forEach(card => {
    card.classList.remove(
      'three-card-enter-left',
      'three-card-enter-down',
      'three-card-enter-right',
      'three-card-arranged',
      'three-card-settled'
    );
  });

  if (isReduced) {
    cards.forEach(card => card.classList.add('three-card-arranged'));
    return;
  }

  // Phase 1: Displace cards into directional entry positions
  // 1st Card: Left side
  // 2nd Card: Down side (bottom)
  // 3rd Card: Right side
  cards[0].classList.add('three-card-enter-left');
  cards[1].classList.add('three-card-enter-down');
  cards[2].classList.add('three-card-enter-right');

  // Phase 2: Smoothly arrange into respective slots
  // 1st card arranges at 100ms
  // 2nd card arranges at 260ms
  // 3rd card arranges at 420ms
  const entryClasses = [
    'three-card-enter-left',
    'three-card-enter-down',
    'three-card-enter-right'
  ];
  const delays = [100, 260, 420];

  cards.forEach((card, index) => {
    const tid = setTimeout(() => {
      card.classList.remove(entryClasses[index]);
      card.classList.add('three-card-arranged');

      // Phase 3: Settling luminous neon green flare wave
      const settleTid = setTimeout(() => {
        card.classList.add('three-card-settled');
        const clearSettleTid = setTimeout(() => {
          card.classList.remove('three-card-settled');
        }, 500);
        container._threeCardTimers.push(clearSettleTid);
      }, 350);
      container._threeCardTimers.push(settleTid);
    }, delays[index] || 150);

    container._threeCardTimers.push(tid);
  });
}

function initUniversalThreeCardsAnimation() {
  const gridSelectors = [
    '.stories-grid',
    '.three-cards-grid',
    '.three-card-grid',
    '.promo-bundles-grid',
    '.community-guilds-grid',
    '.direct-channels-grid'
  ];

  const containers = document.querySelectorAll(gridSelectors.join(', '));
  if (!containers.length) return;

  containers.forEach(container => {
    const cardSelectors = [
      '.story-card',
      '.three-card',
      '.promo-card',
      '.guild-card',
      '.channel-card',
      'article'
    ];
    let cards = Array.from(container.querySelectorAll(cardSelectors.join(', ')));
    if (!cards.length) {
      cards = Array.from(container.children).filter(el => el.nodeType === 1);
    }
    // Only target sets of 3 cards
    if (cards.length !== 3) return;

    // Interactive click ripple on each card (exclude story cards without click functionalities)
    if (!container.classList.contains('stories-grid')) {
      cards.forEach(card => {
        if (card.classList.contains('story-card')) return;
        card.addEventListener('click', () => {
          card.classList.remove('three-card-settled');
          void card.offsetWidth;
          card.classList.add('three-card-settled');
          setTimeout(() => {
            card.classList.remove('three-card-settled');
          }, 500);
        });
      });
    }

    // IntersectionObserver: bi-directional trigger convergence
    if ('IntersectionObserver' in window) {
      let isVisible = false;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!isVisible) {
              isVisible = true;
              setTimeout(() => {
                runThreeCardsConvergence(cards, container);
              }, 120);
            }
          } else {
            isVisible = false;
          }
        });
      }, {
        threshold: 0.12,
        rootMargin: '20px 0px 20px 0px'
      });
      observer.observe(container);

      const rect = container.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        isVisible = true;
        setTimeout(() => {
          runThreeCardsConvergence(cards, container);
        }, 120);
      }
    } else {
      runThreeCardsConvergence(cards, container);
    }
  });
}


/* ==========================================================================
   8. LIVE STATS NUMBERS RUNNER ENGINE (Home Page Strip)
   ========================================================================== */

function initLiveStatsRunner() {
  const statItems = document.querySelectorAll('.stats-counter-strip .stat-item');
  const strip = document.querySelector('.stats-counter-strip');
  if (!statItems.length || !strip) return;

  const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Function to run a single counter live with smooth odometer roll and cubic deceleration
  function runSingleCounter(el, target, duration = 1600, delay = 0) {
    if (el._countTimer) clearInterval(el._countTimer);
    if (el._settleTimer) clearTimeout(el._settleTimer);

    if (isReduced) {
      el.textContent = target < 10 ? '0' + target : target;
      return;
    }

    setTimeout(() => {
      el.classList.add('stat-running');
      el.classList.remove('stat-settled');

      const startTime = performance.now();
      const startVal = 0;
      const targetVal = target;

      // High-speed digital odometer roll
      el._countTimer = setInterval(() => {
        const now = performance.now();
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        // Quintic ease out for realistic mechanical deceleration
        const ease = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(startVal + (targetVal - startVal) * ease);

        el.textContent = current < 10 ? '0' + current : current;

        if (progress >= 1) {
          clearInterval(el._countTimer);
          el.textContent = targetVal < 10 ? '0' + targetVal : targetVal;
          el.classList.remove('stat-running');
          el.classList.add('stat-settled');

          el._settleTimer = setTimeout(() => {
            el.classList.remove('stat-settled');
          }, 650);
        }
      }, 30);
    }, delay);
  }

  // Function to animate the infinity symbol with cycling digital glyphs
  function runInfinityGlyph(el, delay = 0) {
    if (el._infTimer) clearInterval(el._infTimer);
    if (isReduced) {
      el.textContent = '∞';
      return;
    }

    const glyphs = ['00', '07', '13', '42', '88', '99', '888', '9999', '✦', '∞'];
    setTimeout(() => {
      el.classList.add('stat-running');
      let step = 0;
      el._infTimer = setInterval(() => {
        el.textContent = glyphs[step % glyphs.length];
        step++;
        if (step >= glyphs.length * 2) {
          clearInterval(el._infTimer);
          el.textContent = '∞';
          el.classList.remove('stat-running');
          el.classList.add('stat-settled');
          setTimeout(() => el.classList.remove('stat-settled'), 650);
        }
      }, 45);
    }, delay);
  }

  // Master function to trigger all numbers live run
  function runAllNumbersLive() {
    statItems.forEach((item, index) => {
      const numEl = item.querySelector('.counter-val');
      const infEl = item.querySelector('.stat-infinity') || item.querySelector('.stat-number:not(.counter-val)');
      const staggerDelay = index * 130;

      if (numEl) {
        const target = parseInt(numEl.getAttribute('data-target'), 10) || 13;
        runSingleCounter(numEl, target, 1500 + index * 100, staggerDelay);
      } else if (infEl) {
        runInfinityGlyph(infEl, staggerDelay);
      }
    });
  }

  // Continuous Periodic Live Ticker (every 6.5s)
  setInterval(() => {
    // Pick one stat to micro-pulse / live tick
    const randomIndex = Math.floor(Math.random() * statItems.length);
    const item = statItems[randomIndex];
    const numEl = item.querySelector('.counter-val');
    const infEl = item.querySelector('.stat-infinity');

    if (numEl) {
      const target = parseInt(numEl.getAttribute('data-target'), 10);
      numEl.classList.add('stat-running');
      numEl.textContent = (target + 1) < 10 ? '0' + (target + 1) : (target + 1);
      setTimeout(() => {
        numEl.textContent = target < 10 ? '0' + target : target;
        numEl.classList.remove('stat-running');
        numEl.classList.add('stat-settled');
        setTimeout(() => numEl.classList.remove('stat-settled'), 550);
      }, 750);
    } else if (infEl) {
      infEl.classList.add('stat-settled');
      setTimeout(() => infEl.classList.remove('stat-settled'), 750);
    }
  }, 6500);

  // Click & hover interactivity on each stat item to re-run
  statItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      runAllNumbersLive();
    });
  });

  // IntersectionObserver: bi-directional auto-trigger live run
  if ('IntersectionObserver' in window) {
    let isVisible = false;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (!isVisible) {
            isVisible = true;
            setTimeout(() => {
              runAllNumbersLive();
            }, 120);
          }
        } else {
          isVisible = false;
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '20px 0px 20px 0px'
    });
    observer.observe(strip);

    const rect = strip.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      isVisible = true;
      setTimeout(() => {
        runAllNumbersLive();
      }, 120);
    }
  } else {
    runAllNumbersLive();
  }
}


/* ==========================================================================
   9. FORUM THREAD ROWS: ROW-BY-ROW SMOOTH ARRANGE ANIMATION ENGINE
   ========================================================================== */

function runThreadRowsArrange(rows, container) {
  const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Clear any existing animation timers on this container
  if (container._rowTimers) {
    container._rowTimers.forEach(tid => clearTimeout(tid));
  }
  container._rowTimers = [];

  if (isReduced) {
    rows.forEach(row => {
      row.classList.remove('thread-row-staging', 'thread-row-settled');
      row.classList.add('thread-row-arranged');
    });
    return;
  }

  // Phase 1: Set staging displaced state for all rows simultaneously
  rows.forEach(row => {
    row.classList.remove('thread-row-arranged', 'thread-row-settled');
    row.classList.add('thread-row-staging');
  });

  // Force reflow
  void container.offsetWidth;

  // Phase 2: Arrange row by row with progressive staggered cascade
  rows.forEach((row, index) => {
    const arrangeDelay = 90 + index * 180; // Row 0: 90ms, Row 1: 270ms, Row 2: 450ms...
    const tid = setTimeout(() => {
      row.classList.remove('thread-row-staging');
      row.classList.add('thread-row-arranged');

      // Phase 3: Settling luminous emerald flare as row glides into its exact dock
      const settleTid = setTimeout(() => {
        row.classList.add('thread-row-settled');
        const endTid = setTimeout(() => {
          row.classList.remove('thread-row-settled');
        }, 550);
        container._rowTimers.push(endTid);
      }, 340);
      container._rowTimers.push(settleTid);

    }, arrangeDelay);

    container._rowTimers.push(tid);
  });
}

function initThreadRowsAnimation() {
  const discussionCards = document.querySelectorAll('.discussion-list-card');
  if (!discussionCards.length) return;

  discussionCards.forEach(card => {
    const rows = Array.from(card.querySelectorAll('.thread-row'));
    if (!rows.length) return;

    // Interactive click on each row to trigger a smooth settling glow
    rows.forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.tagName.toLowerCase() === 'a' && e.target.getAttribute('href') !== '#') return;

        row.classList.remove('thread-row-settled');
        void row.offsetWidth;
        row.classList.add('thread-row-settled');
        setTimeout(() => {
          row.classList.remove('thread-row-settled');
        }, 600);
      });
    });

    // Make the section header clickable to re-trigger the smooth row-by-row arrange animation
    const section = card.closest('section');
    if (section) {
      const headerRow = section.querySelector('.section-header-row');
      if (headerRow) {
        headerRow.style.cursor = 'pointer';
        headerRow.setAttribute('title', 'Community Threads');
        headerRow.addEventListener('click', () => {
          runThreadRowsArrange(rows, card);
        });
      }
    }

    // IntersectionObserver bi-directional row-by-row arrangement
    if ('IntersectionObserver' in window) {
      let isVisible = false;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!isVisible) {
              isVisible = true;
              setTimeout(() => {
                runThreadRowsArrange(rows, card);
              }, 120);
            }
          } else {
            isVisible = false;
          }
        });
      }, {
        threshold: 0.12,
        rootMargin: '20px 0px 20px 0px'
      });
      observer.observe(card);

      const rect = card.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        isVisible = true;
        setTimeout(() => {
          runThreadRowsArrange(rows, card);
        }, 120);
      }
    } else {
      runThreadRowsArrange(rows, card);
    }
  });
}


/* ==========================================================================
   10. UNIVERSAL 2-CARD HORIZONTAL CONVERGENCE ANIMATION ENGINE (Left & Right)
   ========================================================================== */

function runTwoCardsHorizontalConvergence(cards, container) {
  const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (container._twoCardTimers) {
    container._twoCardTimers.forEach(id => clearTimeout(id));
  }
  container._twoCardTimers = [];

  // Reset classes
  cards.forEach(card => {
    card.classList.remove('two-card-from-left', 'two-card-from-right', 'two-card-arranged', 'two-card-settled');
  });

  if (isReduced || cards.length !== 2) {
    cards.forEach(card => card.classList.add('two-card-arranged'));
    return;
  }

  // Step 1: Displace Left Card to the LEFT, Right Card to the RIGHT
  const leftCard = cards[0];
  const rightCard = cards[1];

  leftCard.classList.add('two-card-from-left');
  rightCard.classList.add('two-card-from-right');

  // Force reflow
  void container.offsetWidth;

  // Step 2: Smooth inwards convergence into orderly positions
  const leftTimer = setTimeout(() => {
    leftCard.classList.remove('two-card-from-left');
    leftCard.classList.add('two-card-arranged');

    leftCard.classList.add('two-card-settled');
    const settleTimer = setTimeout(() => {
      leftCard.classList.remove('two-card-settled');
    }, 550);
    container._twoCardTimers.push(settleTimer);
  }, 100);
  container._twoCardTimers.push(leftTimer);

  const rightTimer = setTimeout(() => {
    rightCard.classList.remove('two-card-from-right');
    rightCard.classList.add('two-card-arranged');

    rightCard.classList.add('two-card-settled');
    const settleTimer = setTimeout(() => {
      rightCard.classList.remove('two-card-settled');
    }, 550);
    container._twoCardTimers.push(settleTimer);
  }, 220);
  container._twoCardTimers.push(rightTimer);
}

function initUniversalTwoCardsAnimation() {
  const gridSelectors = [
    '.two-cards-grid',
    '.forum-events-grid',
    '.dual-card-grid',
    '.two-card-grid'
  ];

  const containers = document.querySelectorAll(gridSelectors.join(', '));
  if (!containers.length) return;

  containers.forEach(container => {
    let cards = Array.from(container.children).filter(el => el.nodeType === 1);
    if (cards.length !== 2) return;

    // Interactive click ripple on cards
    cards.forEach(card => {
      card.addEventListener('click', () => {
        card.classList.remove('two-card-settled');
        void card.offsetWidth;
        card.classList.add('two-card-settled');
        setTimeout(() => {
          card.classList.remove('two-card-settled');
        }, 500);
      });
    });

    // Make section header clickable to re-trigger convergence
    const section = container.closest('section');
    if (section) {
      const headerRow = section.querySelector('.section-header-row');
      if (headerRow) {
        headerRow.style.cursor = 'pointer';
        headerRow.setAttribute('title', 'Click to converge left and right cards');
        headerRow.addEventListener('click', () => {
          runTwoCardsHorizontalConvergence(cards, container);
        });
      }
    }

    // IntersectionObserver: bi-directional trigger convergence when scrolled into view
    if ('IntersectionObserver' in window) {
      let isVisible = false;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!isVisible) {
              isVisible = true;
              setTimeout(() => {
                runTwoCardsHorizontalConvergence(cards, container);
              }, 120);
            }
          } else {
            isVisible = false;
          }
        });
      }, {
        threshold: 0.12,
        rootMargin: '20px 0px 20px 0px'
      });
      observer.observe(container);

      const rect = container.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        isVisible = true;
        setTimeout(() => {
          runTwoCardsHorizontalConvergence(cards, container);
        }, 120);
      }
    } else {
      runTwoCardsHorizontalConvergence(cards, container);
    }
  });
}


/* ==========================================================================
   11. FEATURED HERO: RIGHT-SIDE ENTRANCE & 6-PIECE IMAGE SHATTER/JOIN ENGINE
   ========================================================================== */

function runImageSixPiecesShatterJoin(stage) {
  const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!stage) return;

  const pieces = Array.from(stage.querySelectorAll('.shatter-piece'));
  const baseImg = stage.querySelector('.featured-base-img');
  const seamPulse = stage.querySelector('.shatter-seam-pulse');

  if (stage._shatterTimers) {
    stage._shatterTimers.forEach(id => clearTimeout(id));
  }
  stage._shatterTimers = [];

  if (isReduced || pieces.length !== 6) {
    if (baseImg) baseImg.style.opacity = '1';
    pieces.forEach(p => {
      p.classList.remove('piece-separated');
      p.classList.add('piece-joined');
    });
    return;
  }

  // Phase 1: Separate all 6 pieces into 3D scattered vectors
  if (baseImg) baseImg.style.opacity = '0';
  if (seamPulse) seamPulse.classList.remove('seam-active');

  pieces.forEach(p => {
    p.classList.remove('piece-joined');
    p.classList.add('piece-separated');
  });

  void stage.offsetWidth;

  // Phase 2: Sequential convergence & joining of the 6 pieces
  // Group A (Corners: 1 & 6): join at 160ms
  const t1 = setTimeout(() => {
    if (pieces[0]) { pieces[0].classList.remove('piece-separated'); pieces[0].classList.add('piece-joined'); }
    if (pieces[5]) { pieces[5].classList.remove('piece-separated'); pieces[5].classList.add('piece-joined'); }
  }, 160);
  stage._shatterTimers.push(t1);

  // Group B (Centers: 2 & 5): join at 320ms
  const t2 = setTimeout(() => {
    if (pieces[1]) { pieces[1].classList.remove('piece-separated'); pieces[1].classList.add('piece-joined'); }
    if (pieces[4]) { pieces[4].classList.remove('piece-separated'); pieces[4].classList.add('piece-joined'); }
  }, 320);
  stage._shatterTimers.push(t2);

  // Group C (Opposite Edges: 3 & 4): join at 480ms
  const t3 = setTimeout(() => {
    if (pieces[2]) { pieces[2].classList.remove('piece-separated'); pieces[2].classList.add('piece-joined'); }
    if (pieces[3]) { pieces[3].classList.remove('piece-separated'); pieces[3].classList.add('piece-joined'); }
  }, 480);
  stage._shatterTimers.push(t3);

  // Phase 3: Energy Seam Flash & Seamless Base Fade
  const t4 = setTimeout(() => {
    if (seamPulse) {
      seamPulse.classList.remove('seam-active');
      void seamPulse.offsetWidth;
      seamPulse.classList.add('seam-active');
    }
    if (baseImg) baseImg.style.opacity = '1';
  }, 620);
  stage._shatterTimers.push(t4);
}

function runFeaturedHeroRightAndShatterJoin(heroCard) {
  const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!heroCard) return;

  const stage = heroCard.querySelector('.featured-thumb-wrap');

  if (heroCard._heroTimers) {
    heroCard._heroTimers.forEach(id => clearTimeout(id));
  }
  heroCard._heroTimers = [];

  if (isReduced) {
    heroCard.classList.remove('featured-hero-from-right');
    heroCard.classList.add('featured-hero-arranged');
    if (stage) runImageSixPiecesShatterJoin(stage);
    return;
  }

  // Step 1: Displace section totally to the RIGHT SIDE
  heroCard.classList.remove('featured-hero-arranged', 'featured-hero-settled');
  heroCard.classList.add('featured-hero-from-right');

  // Also stage the image in 6 separated pieces
  if (stage) {
    const pieces = Array.from(stage.querySelectorAll('.shatter-piece'));
    const baseImg = stage.querySelector('.featured-base-img');
    const seamPulse = stage.querySelector('.shatter-seam-pulse');

    if (baseImg) baseImg.style.opacity = '0';
    if (seamPulse) seamPulse.classList.remove('seam-active');
    pieces.forEach(p => {
      p.classList.remove('piece-joined');
      p.classList.add('piece-separated');
    });
  }

  void heroCard.offsetWidth;

  // Step 2: Smooth Glide In from the RIGHT SIDE
  const t1 = setTimeout(() => {
    heroCard.classList.remove('featured-hero-from-right');
    heroCard.classList.add('featured-hero-arranged');
  }, 100);
  heroCard._heroTimers.push(t1);

  // Step 3: Trigger the 6 pieces to converge and join as the section arrives
  const t2 = setTimeout(() => {
    if (stage) runImageSixPiecesShatterJoin(stage);
  }, 280);
  heroCard._heroTimers.push(t2);

  // Step 4: Flash settled luminous flare on the hero card
  const t3 = setTimeout(() => {
    heroCard.classList.add('featured-hero-settled');
    const tEnd = setTimeout(() => {
      heroCard.classList.remove('featured-hero-settled');
    }, 600);
    heroCard._heroTimers.push(tEnd);
  }, 950);
  heroCard._heroTimers.push(t3);
}

function initFeaturedHeroAnimation() {
  const heroCard = document.querySelector('.featured-article-hero');
  if (!heroCard) return;

  const stage = heroCard.querySelector('.featured-thumb-wrap');
  const replayPill = heroCard.querySelector('.shatter-replay-pill');

  // Interactive Click: reassemble 6 pieces on demand
  if (stage) {
    stage.addEventListener('click', (e) => {
      e.stopPropagation();
      runImageSixPiecesShatterJoin(stage);
    });
  }

  if (replayPill) {
    replayPill.addEventListener('click', (e) => {
      e.stopPropagation();
      runImageSixPiecesShatterJoin(stage);
    });
  }

  // Section Header click to re-trigger right-side entrance & 6-piece join
  const section = heroCard.closest('section');
  if (section) {
    const headerRow = section.querySelector('.section-header-row');
    if (headerRow) {
      headerRow.style.cursor = 'pointer';
      headerRow.setAttribute('title', 'Featured Blueprint');
      headerRow.addEventListener('click', () => {
        runFeaturedHeroRightAndShatterJoin(heroCard);
      });
    }
  }

  // IntersectionObserver: bi-directional auto-trigger right-side entrance & 6-piece join
  if ('IntersectionObserver' in window) {
    let isVisible = false;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (!isVisible) {
            isVisible = true;
            setTimeout(() => {
              runFeaturedHeroRightAndShatterJoin(heroCard);
            }, 120);
          }
        } else {
          isVisible = false;
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '20px 0px 20px 0px'
    });

    observer.observe(heroCard);

    const rect = heroCard.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      isVisible = true;
      setTimeout(() => {
        runFeaturedHeroRightAndShatterJoin(heroCard);
      }, 120);
    }
  } else {
    runFeaturedHeroRightAndShatterJoin(heroCard);
  }
}


/* ==========================================================================
   12. UNIVERSAL TABULAR COLUMN: COLUMN-BY-COLUMN SMOOTH ANIMATION ENGINE
   ========================================================================== */

function runTableColumnByColumnAnimation(table) {
  const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!table) return;

  if (table._colTimers) {
    table._colTimers.forEach(id => clearTimeout(id));
  }
  table._colTimers = [];

  const ths = Array.from(table.querySelectorAll('thead th'));
  const numCols = ths.length || 5;

  // Gather all cells grouped by column index (1-based)
  const columns = [];
  for (let c = 1; c <= numCols; c++) {
    const cells = Array.from(table.querySelectorAll(`.col-${c}, th:nth-child(${c}), td:nth-child(${c})`));
    columns.push(cells);
  }

  if (isReduced) {
    columns.forEach(colCells => {
      colCells.forEach(cell => {
        cell.classList.remove('col-staging', 'col-settled');
        cell.classList.add('col-arranged');
      });
    });
    return;
  }

  // Phase 1: Set staging displaced state for all columns simultaneously
  columns.forEach(colCells => {
    colCells.forEach(cell => {
      cell.classList.remove('col-arranged', 'col-settled');
      cell.classList.add('col-staging');
    });
  });

  void table.offsetWidth;

  // Phase 2: Glide in column by column smoothly
  // Column 1 -> Column 2 -> Column 3 -> Column 4 -> Column 5
  const delays = [80, 220, 360, 500, 640, 780, 920];

  columns.forEach((colCells, colIdx) => {
    const delay = delays[colIdx] || (colIdx * 140);
    const t = setTimeout(() => {
      colCells.forEach(cell => {
        cell.classList.remove('col-staging');
        cell.classList.add('col-arranged');
      });

      // Phase 3: Settling luminous emerald highlight wave down the column
      colCells.forEach(cell => cell.classList.add('col-settled'));
      const settleT = setTimeout(() => {
        colCells.forEach(cell => cell.classList.remove('col-settled'));
      }, 480);
      table._colTimers.push(settleT);

    }, delay);

    table._colTimers.push(t);
  });
}

function initTabularColumnAnimation() {
  const tables = document.querySelectorAll('.release-table, .tabular-column-animated, .cart-table');
  if (!tables.length) return;

  tables.forEach(table => {
    const ths = Array.from(table.querySelectorAll('thead th'));
    const numCols = ths.length || 5;

    // Ensure all cells have column classes and inner wrappers
    for (let c = 1; c <= numCols; c++) {
      const colCells = Array.from(table.querySelectorAll(`th:nth-child(${c}), td:nth-child(${c})`));
      colCells.forEach(cell => {
        if (!cell.classList.contains(`col-${c}`)) {
          cell.classList.add(`col-${c}`);
        }
        if (!cell.querySelector('.col-cell-inner')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'col-cell-inner';
          while (cell.firstChild) {
            wrapper.appendChild(cell.firstChild);
          }
          cell.appendChild(wrapper);
        }
      });
    }

    // Attach column hover highlights
    for (let c = 1; c <= numCols; c++) {
      const colCells = Array.from(table.querySelectorAll(`.col-${c}`));
      colCells.forEach(cell => {
        cell.addEventListener('mouseenter', () => {
          colCells.forEach(item => item.classList.add('col-hover-active'));
        });
        cell.addEventListener('mouseleave', () => {
          colCells.forEach(item => item.classList.remove('col-hover-active'));
        });
      });
    }

    // Click on any column header to pulse that column
    ths.forEach((th, idx) => {
      th.style.cursor = 'pointer';
      th.setAttribute('title', `Click to pulse Column ${idx + 1}`);
      th.addEventListener('click', () => {
        const c = idx + 1;
        const colCells = Array.from(table.querySelectorAll(`.col-${c}`));
        colCells.forEach(cell => {
          cell.classList.remove('col-settled');
          void cell.offsetWidth;
          cell.classList.add('col-settled');
        });
        setTimeout(() => {
          colCells.forEach(cell => cell.classList.remove('col-settled'));
        }, 500);
      });
    });

    // Section header clickable to re-trigger column by column animation
    const section = table.closest('section');
    if (section) {
      const headerRow = section.querySelector('.section-header-row');
      if (headerRow) {
        headerRow.style.cursor = 'pointer';
        headerRow.setAttribute('title', 'Click to arrange column by column');
        headerRow.addEventListener('click', () => {
          runTableColumnByColumnAnimation(table);
        });
      }
    }

    // IntersectionObserver: bi-directional column-by-column animation
    if ('IntersectionObserver' in window) {
      let isVisible = false;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!isVisible) {
              isVisible = true;
              setTimeout(() => {
                runTableColumnByColumnAnimation(table);
              }, 120);
            }
          } else {
            isVisible = false;
          }
        });
      }, {
        threshold: 0.12,
        rootMargin: '20px 0px 20px 0px'
      });

      observer.observe(table);

      const rect = table.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        isVisible = true;
        setTimeout(() => {
          runTableColumnByColumnAnimation(table);
        }, 120);
      }
    } else {
      runTableColumnByColumnAnimation(table);
    }
  });
}

/* ==========================================================================
   24. BEST-SELLER PIPELINE: ONE-BY-ONE WITH LIVE CONNECTING LINES
   ========================================================================== */

function runBestsellerPipelineAnimation(pipeline) {
  if (!pipeline) return;

  const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Clear any pending timers on this pipeline
  if (pipeline._bestsellerTimers) {
    pipeline._bestsellerTimers.forEach(id => clearTimeout(id));
  }
  pipeline._bestsellerTimers = [];

  const card1 = pipeline.querySelector('.rank-card-1');
  const bridge1 = pipeline.querySelector('.bridge-1');
  const card2 = pipeline.querySelector('.rank-card-2');
  const bridge2 = pipeline.querySelector('.bridge-2');
  const card3 = pipeline.querySelector('.rank-card-3');

  const cards = [card1, card2, card3].filter(Boolean);
  const bridges = [bridge1, bridge2].filter(Boolean);

  if (isReduced) {
    cards.forEach(card => {
      card.classList.remove('card-staging', 'card-settled');
      card.classList.add('card-arranged');
      const bar = card.querySelector('.rank-progress-fill');
      if (bar) bar.style.width = bar.dataset.progress || '100%';
    });
    bridges.forEach(b => b.classList.add('bridge-active'));
    return;
  }

  // Phase 0: Reset all cards to staging state and bridges inactive
  cards.forEach(card => {
    card.classList.remove('card-arranged', 'card-settled');
    card.classList.add('card-staging');
    const bar = card.querySelector('.rank-progress-fill');
    if (bar) bar.style.width = '0%';
  });
  bridges.forEach(b => b.classList.remove('bridge-active', 'surge-pulse'));

  void pipeline.offsetWidth; // Force reflow

  // Step 1: Card #1 docks into position
  const t1 = setTimeout(() => {
    if (card1) {
      card1.classList.remove('card-staging');
      card1.classList.add('card-arranged', 'card-settled');
      const bar = card1.querySelector('.rank-progress-fill');
      if (bar) bar.style.width = bar.dataset.progress || '100%';

      setTimeout(() => {
        card1.classList.remove('card-settled');
      }, 550);
    }
  }, 80);
  pipeline._bestsellerTimers.push(t1);

  // Step 2: Bridge #1 powers up laser beam & streams photons
  const t2 = setTimeout(() => {
    if (bridge1) {
      bridge1.classList.add('bridge-active');
    }
  }, 440);
  pipeline._bestsellerTimers.push(t2);

  // Step 3: Card #2 docks into position as data arrives
  const t3 = setTimeout(() => {
    if (card2) {
      card2.classList.remove('card-staging');
      card2.classList.add('card-arranged', 'card-settled');
      const bar = card2.querySelector('.rank-progress-fill');
      if (bar) bar.style.width = bar.dataset.progress || '70%';

      setTimeout(() => {
        card2.classList.remove('card-settled');
      }, 550);
    }
  }, 780);
  pipeline._bestsellerTimers.push(t3);

  // Step 4: Bridge #2 powers up laser beam & streams photons
  const t4 = setTimeout(() => {
    if (bridge2) {
      bridge2.classList.add('bridge-active');
    }
  }, 1120);
  pipeline._bestsellerTimers.push(t4);

  // Step 5: Card #3 docks into position
  const t5 = setTimeout(() => {
    if (card3) {
      card3.classList.remove('card-staging');
      card3.classList.add('card-arranged', 'card-settled');
      const bar = card3.querySelector('.rank-progress-fill');
      if (bar) bar.style.width = bar.dataset.progress || '53%';

      setTimeout(() => {
        card3.classList.remove('card-settled');
      }, 550);
    }
  }, 1440);
  pipeline._bestsellerTimers.push(t5);
}

function initBestsellerPipelineAnimation() {
  const pipelines = document.querySelectorAll('.bestseller-ranking-pipeline');
  if (!pipelines || pipelines.length === 0) return;

  pipelines.forEach(pipeline => {
    const section = pipeline.closest('section');
    const headerRow = section ? (section.querySelector('.bestseller-header-row') || section.querySelector('.section-header-row')) : null;
    const cards = pipeline.querySelectorAll('.bestseller-rank-card');
    const bridges = pipeline.querySelectorAll('.live-connector-bridge');

    // Card hover interactive surge
    cards.forEach((card, idx) => {
      card.addEventListener('mouseenter', () => {
        bridges.forEach(b => {
          b.classList.add('surge-pulse');
        });
      });
      card.addEventListener('mouseleave', () => {
        bridges.forEach(b => {
          b.classList.remove('surge-pulse');
        });
      });

      // Clicking any card triggers a localized ripple through the line
      card.addEventListener('click', () => {
        card.classList.remove('card-settled');
        void card.offsetWidth;
        card.classList.add('card-settled');
        bridges.forEach(b => {
          b.classList.remove('surge-pulse');
          void b.offsetWidth;
          b.classList.add('surge-pulse');
          setTimeout(() => b.classList.remove('surge-pulse'), 600);
        });
        setTimeout(() => card.classList.remove('card-settled'), 600);
      });
    });

    // Clicking the header row replays the one-by-one animation
    if (headerRow) {
      headerRow.addEventListener('click', () => {
        runBestsellerPipelineAnimation(pipeline);
      });
    }

    // IntersectionObserver bi-directional trigger
    if ('IntersectionObserver' in window) {
      let isVisible = false;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!isVisible) {
              isVisible = true;
              setTimeout(() => {
                runBestsellerPipelineAnimation(pipeline);
              }, 120);
            }
          } else {
            isVisible = false;
          }
        });
      }, {
        threshold: 0.12,
        rootMargin: '20px 0px 20px 0px'
      });

      observer.observe(pipeline);

      const rect = pipeline.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        isVisible = true;
        setTimeout(() => {
          runBestsellerPipelineAnimation(pipeline);
        }, 120);
      }
    } else {
      runBestsellerPipelineAnimation(pipeline);
    }
  });
}

/* ==========================================================================
   25. FAQ ACCORDION: ONE-BY-ONE ARRIVAL ANIMATION ENGINE
   ========================================================================== */

function runFaqItemsOneByOneArrange(items, container) {
  const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!items || !items.length) return;

  // Clear any existing animation timers on this container
  if (container._faqTimers) {
    container._faqTimers.forEach(id => clearTimeout(id));
  }
  container._faqTimers = [];

  if (isReduced) {
    items.forEach(item => {
      item.classList.remove('faq-item-staging', 'faq-item-settled');
      item.classList.add('faq-item-arranged');
    });
    return;
  }

  // Phase 1: Set staging displaced state for all items simultaneously
  items.forEach(item => {
    item.classList.remove('faq-item-arranged', 'faq-item-settled');
    item.classList.add('faq-item-staging');
  });

  // Force reflow
  void container.offsetWidth;

  // Phase 2: Glide and arrange one by one with progressive staggered cadence
  const delays = [80, 250, 420, 590];

  items.forEach((item, index) => {
    const arrangeDelay = delays[index] !== undefined ? delays[index] : (80 + index * 170);
    const tid = setTimeout(() => {
      item.classList.remove('faq-item-staging');
      item.classList.add('faq-item-arranged');

      // Phase 3: Flash settled luminous emerald flare as item docks into its position
      item.classList.add('faq-item-settled');
      const settleTid = setTimeout(() => {
        item.classList.remove('faq-item-settled');
      }, 500);
      container._faqTimers.push(settleTid);
    }, arrangeDelay);

    container._faqTimers.push(tid);
  });
}

function initFaqAccordionAnimation() {
  const accordions = document.querySelectorAll('.faq-accordion');
  if (!accordions.length) return;

  accordions.forEach(accordion => {
    const items = Array.from(accordion.querySelectorAll('.faq-item'));
    if (!items.length) return;

    // Header click re-triggers one-by-one animation
    const section = accordion.closest('section');
    if (section) {
      const headerRow = section.querySelector('.section-header-row');
      if (headerRow) {
        headerRow.style.cursor = 'pointer';
        headerRow.setAttribute('title', 'Click to arrange questions one by one');
        headerRow.addEventListener('click', () => {
          runFaqItemsOneByOneArrange(items, accordion);
        });
      }
    }

    // Interactive settling ripple on question button click
    items.forEach(item => {
      const btn = item.querySelector('.faq-question-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          item.classList.remove('faq-item-settled');
          void item.offsetWidth;
          item.classList.add('faq-item-settled');
          setTimeout(() => {
            item.classList.remove('faq-item-settled');
          }, 500);
        });
      }
    });

    // IntersectionObserver: bi-directional cascade items one by one when scrolled into view
    if ('IntersectionObserver' in window) {
      let isVisible = false;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!isVisible) {
              isVisible = true;
              setTimeout(() => {
                runFaqItemsOneByOneArrange(items, accordion);
              }, 120);
            }
          } else {
            isVisible = false;
          }
        });
      }, {
        threshold: 0.12,
        rootMargin: '20px 0px 20px 0px'
      });
      observer.observe(accordion);

      const rect = accordion.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        isVisible = true;
        setTimeout(() => {
          runFaqItemsOneByOneArrange(items, accordion);
        }, 120);
      }
    } else {
      runFaqItemsOneByOneArrange(items, accordion);
    }
  });
}

/* ==========================================================================
   26. TRANSMISSION CONVERGENCE: LEFT CARD FROM LEFT, RIGHT CARDS FROM RIGHT
   ========================================================================== */

function runTransmissionConvergenceAnimation(layout) {
  if (!layout) return;
  const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (layout._transTimers) {
    layout._transTimers.forEach(id => clearTimeout(id));
  }
  layout._transTimers = [];

  const leftCard = layout.querySelector('.transmission-card-left');
  const rightCard1 = layout.querySelector('.transmission-card-right-1');
  const rightCard2 = layout.querySelector('.transmission-card-right-2');

  const allCards = [leftCard, rightCard1, rightCard2].filter(Boolean);

  if (isReduced) {
    allCards.forEach(c => {
      c.classList.remove('transmission-staging-left', 'transmission-staging-right', 'transmission-settled');
      c.classList.add('transmission-arranged');
    });
    return;
  }

  // Phase 1: Set staging displaced state
  if (leftCard) {
    leftCard.classList.remove('transmission-arranged', 'transmission-settled');
    leftCard.classList.add('transmission-staging-left');
  }
  [rightCard1, rightCard2].forEach(c => {
    if (c) {
      c.classList.remove('transmission-arranged', 'transmission-settled');
      c.classList.add('transmission-staging-right');
    }
  });

  void layout.offsetWidth; // Force layout recalculation

  // Phase 2: Glide Left Card in from Left side
  const t1 = setTimeout(() => {
    if (leftCard) {
      leftCard.classList.remove('transmission-staging-left');
      leftCard.classList.add('transmission-arranged', 'transmission-settled');
      setTimeout(() => leftCard.classList.remove('transmission-settled'), 550);
    }
  }, 90);
  layout._transTimers.push(t1);

  // Phase 3: Glide Right Card 1 (Community Desk) in from Right side
  const t2 = setTimeout(() => {
    if (rightCard1) {
      rightCard1.classList.remove('transmission-staging-right');
      rightCard1.classList.add('transmission-arranged', 'transmission-settled');
      setTimeout(() => rightCard1.classList.remove('transmission-settled'), 550);
    }
  }, 260);
  layout._transTimers.push(t2);

  // Phase 4: Glide Right Card 2 (System Status) in from Right side
  const t3 = setTimeout(() => {
    if (rightCard2) {
      rightCard2.classList.remove('transmission-staging-right');
      rightCard2.classList.add('transmission-arranged', 'transmission-settled');
      setTimeout(() => rightCard2.classList.remove('transmission-settled'), 550);
    }
  }, 440);
  layout._transTimers.push(t3);
}

function initTransmissionConvergenceAnimation() {
  const layouts = document.querySelectorAll('.contact-form-layout, .transmission-layout');
  if (!layouts.length) return;

  layouts.forEach(layout => {
    const leftCard = layout.querySelector('.transmission-card-left');
    const rightCards = layout.querySelectorAll('.transmission-card-right');
    if (!leftCard && !rightCards.length) return;

    // IntersectionObserver to smoothly arrange when scrolled into view (bi-directional)
    if ('IntersectionObserver' in window) {
      let isVisible = false;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!isVisible) {
              isVisible = true;
              setTimeout(() => {
                runTransmissionConvergenceAnimation(layout);
              }, 120);
            }
          } else {
            isVisible = false;
          }
        });
      }, {
        threshold: 0.12,
        rootMargin: '20px 0px 20px 0px'
      });
      observer.observe(layout);

      const rect = layout.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        isVisible = true;
        setTimeout(() => {
          runTransmissionConvergenceAnimation(layout);
        }, 120);
      }
    } else {
      runTransmissionConvergenceAnimation(layout);
    }
  });
}

/* ==========================================================================
   27. SHOP DUO PROMOTIONAL BANNERS: CARD 1 FROM RIGHT, CARD 2 FROM LEFT
   ========================================================================== */

function runShopDuoBannersAnimation(grid) {
  if (!grid) return;
  const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (grid._duoTimers) {
    grid._duoTimers.forEach(id => clearTimeout(id));
  }
  grid._duoTimers = [];

  const card1 = grid.querySelector('.shop-duo-card-right');
  const card2 = grid.querySelector('.shop-duo-card-left');

  if (isReduced) {
    if (card1) {
      card1.classList.remove('duo-staging-right', 'duo-settled-amber');
      card1.classList.add('duo-arranged');
    }
    if (card2) {
      card2.classList.remove('duo-staging-left', 'duo-settled-emerald');
      card2.classList.add('duo-arranged');
    }
    return;
  }

  // Phase 1: Set staging displaced states
  if (card1) {
    card1.classList.remove('duo-arranged', 'duo-settled-amber');
    card1.classList.add('duo-staging-right');
  }
  if (card2) {
    card2.classList.remove('duo-arranged', 'duo-settled-emerald');
    card2.classList.add('duo-staging-left');
  }

  void grid.offsetWidth; // Force layout reflow

  // Phase 2: Card 1 glides in from RIGHT side
  const t1 = setTimeout(() => {
    if (card1) {
      card1.classList.remove('duo-staging-right');
      card1.classList.add('duo-arranged', 'duo-settled-amber');
      setTimeout(() => card1.classList.remove('duo-settled-amber'), 600);
    }
  }, 90);
  grid._duoTimers.push(t1);

  // Phase 3: Card 2 glides in from LEFT side
  const t2 = setTimeout(() => {
    if (card2) {
      card2.classList.remove('duo-staging-left');
      card2.classList.add('duo-arranged', 'duo-settled-emerald');
      setTimeout(() => card2.classList.remove('duo-settled-emerald'), 600);
    }
  }, 340);
  grid._duoTimers.push(t2);
}

function initShopDuoBannersAnimation() {
  const grids = document.querySelectorAll('.shop-duo-banner-grid');
  if (!grids.length) return;

  grids.forEach(grid => {
    const card1 = grid.querySelector('.shop-duo-card-right');
    const card2 = grid.querySelector('.shop-duo-card-left');
    if (!card1 || !card2) return;

    // Click on either banner to replay the animation
    [card1, card2].forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('button')) return;
        runShopDuoBannersAnimation(grid);
      });
    });

    // IntersectionObserver triggers when scrolled into view (bi-directional)
    if ('IntersectionObserver' in window) {
      let isVisible = false;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!isVisible) {
              isVisible = true;
              setTimeout(() => {
                runShopDuoBannersAnimation(grid);
              }, 120);
            }
          } else {
            isVisible = false;
          }
        });
      }, {
        threshold: 0.12,
        rootMargin: '20px 0px 20px 0px'
      });
      observer.observe(grid);

      const rect = grid.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        isVisible = true;
        setTimeout(() => {
          runShopDuoBannersAnimation(grid);
        }, 120);
      }
    } else {
      runShopDuoBannersAnimation(grid);
    }
  });
}


/* ==========================================================================
   18. SQUAD IMAGE 4-PIECE SPLIT & RE-JOIN ENGINE
   ========================================================================== */

function runSquadFourPiecesSplitJoin(stage) {
  const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!stage) return;

  const pieces = Array.from(stage.querySelectorAll('.quad-piece'));
  const baseImg = stage.querySelector('.squad-base-img');
  const seamPulse = stage.querySelector('.quad-seam-pulse');

  if (stage._quadTimers) {
    stage._quadTimers.forEach(id => clearTimeout(id));
  }
  stage._quadTimers = [];

  if (isReduced || pieces.length !== 4) {
    if (baseImg) baseImg.style.opacity = '1';
    pieces.forEach(p => {
      p.classList.remove('quad-piece-separated');
      p.classList.add('quad-piece-joined');
    });
    return;
  }

  // Phase 1: Disperse all 4 quadrant pieces into 3D space
  if (baseImg) baseImg.style.opacity = '0';
  if (seamPulse) seamPulse.classList.remove('seam-active');
  stage.classList.remove('quad-settled');

  pieces.forEach(p => {
    p.classList.remove('quad-piece-joined');
    p.classList.add('quad-piece-separated');
  });

  void stage.offsetWidth;

  // Phase 2: Staggered Diagonal Convergence & Snapping into position
  // Group A (Opposite Diagonal: Piece 1 Top-Left & Piece 4 Bottom-Right): snap at 120ms
  const t1 = setTimeout(() => {
    if (pieces[0]) {
      pieces[0].classList.remove('quad-piece-separated');
      pieces[0].classList.add('quad-piece-joined');
    }
    if (pieces[3]) {
      pieces[3].classList.remove('quad-piece-separated');
      pieces[3].classList.add('quad-piece-joined');
    }
  }, 120);
  stage._quadTimers.push(t1);

  // Group B (Opposite Diagonal: Piece 2 Top-Right & Piece 3 Bottom-Left): snap at 280ms
  const t2 = setTimeout(() => {
    if (pieces[1]) {
      pieces[1].classList.remove('quad-piece-separated');
      pieces[1].classList.add('quad-piece-joined');
    }
    if (pieces[2]) {
      pieces[2].classList.remove('quad-piece-separated');
      pieces[2].classList.add('quad-piece-joined');
    }
  }, 280);
  stage._quadTimers.push(t2);

  // Phase 3: Electric Crosshair Seam Lines Flash across horizontal & vertical intersections
  const t3 = setTimeout(() => {
    if (seamPulse) {
      seamPulse.classList.remove('seam-active');
      void seamPulse.offsetWidth;
      seamPulse.classList.add('seam-active');
    }
  }, 460);
  stage._quadTimers.push(t3);

  // Phase 4: Settle Base Image seamlessly and pulse luminous emerald rim
  const t4 = setTimeout(() => {
    if (baseImg) baseImg.style.opacity = '1';
    stage.classList.add('quad-settled');
    const tEnd = setTimeout(() => {
      stage.classList.remove('quad-settled');
    }, 650);
    stage._quadTimers.push(tEnd);
  }, 580);
  stage._quadTimers.push(t4);
}

function initSquadImageSplitJoin() {
  const stage = document.getElementById('squad-quad-stage') || document.querySelector('.squad-quad-stage');
  if (!stage) return;

  const replayPill = stage.querySelector('.quad-replay-pill');

  // Interactive Click on stage itself
  stage.addEventListener('click', (e) => {
    e.stopPropagation();
    runSquadFourPiecesSplitJoin(stage);
  });

  // Interactive Click on replay pill
  if (replayPill) {
    replayPill.addEventListener('click', (e) => {
      e.stopPropagation();
      runSquadFourPiecesSplitJoin(stage);
    });
  }

  // Section Header / Eyebrow click to trigger split & join
  const squadSection = stage.closest('.squad-section');
  if (squadSection) {
    const squadTitle = squadSection.querySelector('.squad-title');
    const squadEyebrow = squadSection.querySelector('.section-eyebrow');
    [squadTitle, squadEyebrow].forEach(el => {
      if (el) {
        el.style.cursor = 'pointer';
        el.setAttribute('title', 'Click to split and re-join squad visual');
        el.addEventListener('click', () => {
          runSquadFourPiecesSplitJoin(stage);
        });
      }
    });
  }

  // IntersectionObserver: bi-directional trigger on scroll into view
  if ('IntersectionObserver' in window) {
    let isVisible = false;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (!isVisible) {
            isVisible = true;
            setTimeout(() => {
              runSquadFourPiecesSplitJoin(stage);
            }, 120);
          }
        } else {
          isVisible = false;
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '20px 0px 20px 0px'
    });

    observer.observe(stage);

    const rect = stage.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      isVisible = true;
      setTimeout(() => {
        runSquadFourPiecesSplitJoin(stage);
      }, 120);
    }
  } else {
    runSquadFourPiecesSplitJoin(stage);
  }
}


/* ==========================================================================
   19. CYBERPUNK FEATURE SPOTLIGHT: 4-PIECE SPLIT & RE-JOIN ENGINE
   ========================================================================== */

function runCyberpunkSpotlightSplitJoin(card) {
  const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!card) return;

  const pieces = Array.from(card.querySelectorAll('.spotlight-quad-piece'));
  const bgBase = card.querySelector('.spotlight-bg-base');
  const seamPulse = card.querySelector('.spotlight-seam-pulse');

  if (card._spotlightTimers) {
    card._spotlightTimers.forEach(id => clearTimeout(id));
  }
  card._spotlightTimers = [];

  if (isReduced || pieces.length !== 4) {
    if (bgBase) bgBase.style.opacity = '1';
    card.classList.remove('spotlight-animating');
    pieces.forEach(p => {
      p.classList.remove('spotlight-piece-separated');
      p.classList.add('spotlight-piece-joined');
    });
    return;
  }

  // Phase 1: Disperse all 4 quadrant pieces into 3D space
  card.classList.add('spotlight-animating');
  if (bgBase) bgBase.style.opacity = '0';
  if (seamPulse) seamPulse.classList.remove('seam-active');
  card.classList.remove('spotlight-settled');

  pieces.forEach(p => {
    p.classList.remove('spotlight-piece-joined');
    p.classList.add('spotlight-piece-separated');
  });

  void card.offsetWidth;

  // Phase 2: Staggered Diagonal Convergence & Snapping into position
  // Group A (Opposite Diagonal: Piece 1 Top-Left & Piece 4 Bottom-Right): snap at 120ms
  const t1 = setTimeout(() => {
    if (pieces[0]) {
      pieces[0].classList.remove('spotlight-piece-separated');
      pieces[0].classList.add('spotlight-piece-joined');
    }
    if (pieces[3]) {
      pieces[3].classList.remove('spotlight-piece-separated');
      pieces[3].classList.add('spotlight-piece-joined');
    }
  }, 120);
  card._spotlightTimers.push(t1);

  // Group B (Opposite Diagonal: Piece 2 Top-Right & Piece 3 Bottom-Left): snap at 280ms
  const t2 = setTimeout(() => {
    if (pieces[1]) {
      pieces[1].classList.remove('spotlight-piece-separated');
      pieces[1].classList.add('spotlight-piece-joined');
    }
    if (pieces[2]) {
      pieces[2].classList.remove('spotlight-piece-separated');
      pieces[2].classList.add('spotlight-piece-joined');
    }
  }, 280);
  card._spotlightTimers.push(t2);

  // Phase 3: Electric Crosshair Seam Lines Flash across horizontal & vertical intersections
  const t3 = setTimeout(() => {
    if (seamPulse) {
      seamPulse.classList.remove('seam-active');
      void seamPulse.offsetWidth;
      seamPulse.classList.add('seam-active');
    }
  }, 460);
  card._spotlightTimers.push(t3);

  // Phase 4: Settle Base Image seamlessly and pulse luminous emerald rim
  const t4 = setTimeout(() => {
    if (bgBase) bgBase.style.opacity = '1';
    card.classList.remove('spotlight-animating');
    card.classList.add('spotlight-settled');
    const tEnd = setTimeout(() => {
      card.classList.remove('spotlight-settled');
    }, 650);
    card._spotlightTimers.push(tEnd);
  }, 580);
  card._spotlightTimers.push(t4);
}

function initCyberpunkSpotlightSplitJoin() {
  const card = document.getElementById('spotlight-banner-card') || document.querySelector('.spotlight-banner-card');
  if (!card) return;

  const replayPill = card.querySelector('.spotlight-replay-pill');

  // Interactive Click on card itself (ignoring links/buttons)
  card.addEventListener('click', (e) => {
    if (e.target.closest('a') || e.target.closest('button')) return;
    runCyberpunkSpotlightSplitJoin(card);
  });

  // Interactive Click on replay pill
  if (replayPill) {
    replayPill.addEventListener('click', (e) => {
      e.stopPropagation();
      runCyberpunkSpotlightSplitJoin(card);
    });
  }

  // Title / Eyebrow click to trigger split & join
  const spotlightTitle = card.querySelector('.spotlight-title');
  const spotlightEyebrow = card.querySelector('.spotlight-eyebrow');
  [spotlightTitle, spotlightEyebrow].forEach(el => {
    if (el) {
      el.style.cursor = 'pointer';
      el.setAttribute('title', 'Click to split and re-join Cyberpunk visual');
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        runCyberpunkSpotlightSplitJoin(card);
      });
    }
  });

  // IntersectionObserver: bi-directional trigger on scroll into view
  if ('IntersectionObserver' in window) {
    let isVisible = false;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (!isVisible) {
            isVisible = true;
            setTimeout(() => {
              runCyberpunkSpotlightSplitJoin(card);
            }, 120);
          }
        } else {
          isVisible = false;
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '20px 0px 20px 0px'
    });

    observer.observe(card);

    const rect = card.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      isVisible = true;
      setTimeout(() => {
        runCyberpunkSpotlightSplitJoin(card);
      }, 120);
    }
  } else {
    runCyberpunkSpotlightSplitJoin(card);
  }
}


/* ==========================================================================
   20. HOMEPAGE SHORTLIST QUICK-VIEW & CART INTEGRATION
   ========================================================================== */

function initHomepageShortlistModals() {
  // Clicking functionality removed per user request: static showcase display cards
  const shortlistSection = document.querySelector('.shortlist-section');
  if (!shortlistSection) return;

  const cards = shortlistSection.querySelectorAll('.shortlist-card');
  cards.forEach((card) => {
    card.style.cursor = 'default';
    card.removeAttribute('title');
  });
}
