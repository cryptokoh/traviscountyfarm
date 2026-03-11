/**
 * Travis County Farm - Cart Drawer
 * AJAX-powered slide-out cart with real-time updates
 */

(function () {
  'use strict';

  var drawer = document.getElementById('cart-drawer');
  if (!drawer) return;

  var overlay = drawer.querySelector('[data-cart-drawer-overlay]');
  var closeButtons = drawer.querySelectorAll('[data-cart-drawer-close]');
  var itemsContainer = drawer.querySelector('[data-cart-drawer-items]');
  var footerContainer = drawer.querySelector('[data-cart-drawer-footer]');
  var emptyContainer = drawer.querySelector('[data-cart-drawer-empty]');
  var subtotalEl = drawer.querySelector('[data-cart-drawer-subtotal]');
  var countEl = drawer.querySelector('[data-cart-drawer-count]');

  var isUpdating = false;

  /* ============================================
     Open / Close
     ============================================ */

  function openDrawer() {
    drawer.classList.add('active');
    document.body.style.overflow = 'hidden';
    drawer.setAttribute('aria-hidden', 'false');

    // Focus the close button for accessibility
    var close = drawer.querySelector('[data-cart-drawer-close]');
    if (close) {
      setTimeout(function () { close.focus(); }, 100);
    }
  }

  function closeDrawer() {
    drawer.classList.remove('active');
    document.body.style.overflow = '';
    drawer.setAttribute('aria-hidden', 'true');

    // Return focus to the cart toggle button
    var toggle = document.querySelector('[data-cart-toggle]');
    if (toggle) toggle.focus();
  }

  // Close button(s)
  closeButtons.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      closeDrawer();
    });
  });

  // Overlay click
  if (overlay) {
    overlay.addEventListener('click', closeDrawer);
  }

  // Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('active')) {
      closeDrawer();
    }
  });

  /* ============================================
     Quantity Controls
     ============================================ */

  function bindItemEvents() {
    // Use event delegation on the drawer panel
    drawer.addEventListener('click', handleDrawerClick);
    drawer.addEventListener('change', handleDrawerChange);
  }

  function handleDrawerClick(e) {
    var target = e.target.closest('[data-qty-minus], [data-qty-plus], [data-remove-item]');
    if (!target) return;

    e.preventDefault();
    if (isUpdating) return;

    var key = target.getAttribute('data-key');
    if (!key) return;

    if (target.hasAttribute('data-remove-item')) {
      updateItem(key, 0);
      return;
    }

    var input = drawer.querySelector('[data-qty-input][data-key="' + key + '"]');
    if (!input) return;

    var currentQty = parseInt(input.value, 10) || 0;

    if (target.hasAttribute('data-qty-minus')) {
      var newQty = Math.max(0, currentQty - 1);
      input.value = newQty;
      updateItem(key, newQty);
    }

    if (target.hasAttribute('data-qty-plus')) {
      var max = parseInt(input.getAttribute('max'), 10) || 99;
      var newQty = Math.min(max, currentQty + 1);
      input.value = newQty;
      updateItem(key, newQty);
    }
  }

  function handleDrawerChange(e) {
    var target = e.target;
    if (!target.hasAttribute('data-qty-input')) return;
    if (isUpdating) return;

    var key = target.getAttribute('data-key');
    var qty = parseInt(target.value, 10);

    if (isNaN(qty) || qty < 0) {
      qty = 1;
      target.value = qty;
    }

    updateItem(key, qty);
  }

  function updateItem(key, quantity) {
    if (isUpdating) return;
    isUpdating = true;
    drawer.classList.add('is-loading');

    changeCartItem(key, quantity)
      .then(function () {
        // changeCartItem dispatches cart:updated which re-renders
      })
      .catch(function (err) {
        console.error('Cart drawer update failed:', err);
        isUpdating = false;
        drawer.classList.remove('is-loading');
      });
  }

  /* ============================================
     Re-render on cart:updated
     ============================================ */

  document.addEventListener('cart:updated', function (e) {
    var cart = e.detail;
    if (!cart) return;

    renderCart(cart);
    isUpdating = false;
    drawer.classList.remove('is-loading');
  });

  function renderCart(cart) {
    // Update header count
    if (countEl) {
      countEl.textContent = '(' + cart.item_count + ')';
    }

    if (cart.item_count === 0) {
      renderEmptyState();
      return;
    }

    // Render line items
    var itemsHtml = cart.items.map(renderLineItem).join('');

    // Ensure items container exists
    if (!itemsContainer) {
      // Cart was empty on page load, need to rebuild structure
      rebuildDrawerContent(itemsHtml, cart);
      return;
    }

    itemsContainer.innerHTML = itemsHtml;

    // Update subtotal
    if (subtotalEl) {
      subtotalEl.textContent = formatMoney(cart.total_price);
    }

    // Show footer, hide empty
    if (footerContainer) footerContainer.style.display = '';
    if (emptyContainer) emptyContainer.style.display = 'none';
  }

  function renderLineItem(item) {
    var imageHtml = '';
    if (item.image) {
      var imgSrc = getSizedImageUrl(item.image, '120x');
      imageHtml = '<img src="' + imgSrc + '" alt="' + escapeHtml(item.title) + '" width="60" height="60" loading="lazy" class="cart-item__image">';
    } else {
      imageHtml = '<div class="cart-item__image-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></div>';
    }

    var variantHtml = '';
    if (item.variant_title && item.variant_title !== 'Default Title') {
      variantHtml = '<p class="cart-item__variant">' + escapeHtml(item.variant_title) + '</p>';
    }

    var priceHtml = '';
    if (item.original_line_price !== item.final_line_price) {
      priceHtml += '<s class="cart-item__price-compare">' + formatMoney(item.original_line_price) + '</s>';
    }
    priceHtml += '<span class="cart-item__price-current">' + formatMoney(item.final_line_price) + '</span>';

    return '<div class="cart-item" data-cart-item data-key="' + item.key + '">' +
      '<a href="' + item.url + '" class="cart-item__image-link" aria-label="' + escapeHtml(item.product_title) + '">' +
        imageHtml +
      '</a>' +
      '<div class="cart-item__details">' +
        '<a href="' + item.url + '" class="cart-item__title">' + escapeHtml(item.product_title) + '</a>' +
        variantHtml +
        '<div class="cart-item__price">' + priceHtml + '</div>' +
        '<div class="cart-item__actions">' +
          '<div class="cart-item__quantity" data-quantity-controls>' +
            '<button type="button" class="cart-item__qty-btn" data-qty-minus data-key="' + item.key + '" aria-label="Decrease quantity"><span aria-hidden="true">&minus;</span></button>' +
            '<input type="number" class="cart-item__qty-input" value="' + item.quantity + '" min="0" max="99" data-qty-input data-key="' + item.key + '" aria-label="Quantity">' +
            '<button type="button" class="cart-item__qty-btn" data-qty-plus data-key="' + item.key + '" aria-label="Increase quantity"><span aria-hidden="true">&plus;</span></button>' +
          '</div>' +
          '<button type="button" class="cart-item__remove" data-remove-item data-key="' + item.key + '" aria-label="Remove ' + escapeHtml(item.product_title) + '">Remove</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderEmptyState() {
    // Hide items and footer, show empty
    if (itemsContainer) itemsContainer.style.display = 'none';
    if (footerContainer) footerContainer.style.display = 'none';

    if (emptyContainer) {
      emptyContainer.style.display = '';
    } else {
      // Build empty state if it didn't exist on page load
      var panel = drawer.querySelector('.cart-drawer__panel');
      var emptyHtml = '<div class="cart-drawer__empty" data-cart-drawer-empty>' +
        '<div class="cart-drawer__empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></div>' +
        '<p class="cart-drawer__empty-text">Your cart is empty</p>' +
        '<a href="/" class="cart-drawer__continue" data-cart-drawer-close>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
          'Continue Shopping' +
        '</a>' +
      '</div>';

      // Remove existing items/footer/spinner
      var spinner = panel.querySelector('.cart-drawer__spinner');
      if (itemsContainer) itemsContainer.remove();
      if (footerContainer) footerContainer.remove();
      if (spinner) spinner.remove();

      panel.insertAdjacentHTML('beforeend', emptyHtml);
      emptyContainer = panel.querySelector('[data-cart-drawer-empty]');

      // Rebind close on the new continue shopping link
      var continueBtn = emptyContainer.querySelector('[data-cart-drawer-close]');
      if (continueBtn) {
        continueBtn.addEventListener('click', function (e) {
          e.preventDefault();
          closeDrawer();
        });
      }
    }
  }

  function rebuildDrawerContent(itemsHtml, cart) {
    var panel = drawer.querySelector('.cart-drawer__panel');
    var header = drawer.querySelector('.cart-drawer__header');

    // Hide empty state
    if (emptyContainer) emptyContainer.style.display = 'none';

    // Build items container
    var itemsDiv = document.createElement('div');
    itemsDiv.className = 'cart-drawer__items';
    itemsDiv.setAttribute('data-cart-drawer-items', '');
    itemsDiv.innerHTML = itemsHtml;

    // Build spinner
    var spinnerDiv = document.createElement('div');
    spinnerDiv.className = 'cart-drawer__spinner';
    spinnerDiv.setAttribute('aria-hidden', 'true');
    spinnerDiv.innerHTML = '<span class="loading-spinner"></span>';

    // Build footer
    var footerHtml = '<div class="cart-drawer__footer" data-cart-drawer-footer>' +
      '<div class="cart-drawer__subtotal">' +
        '<span class="cart-drawer__subtotal-label">Subtotal</span>' +
        '<span class="cart-drawer__subtotal-value" data-cart-drawer-subtotal>' + formatMoney(cart.total_price) + '</span>' +
      '</div>' +
      '<p class="cart-drawer__taxes-note">Taxes and shipping calculated at checkout</p>' +
      '<a href="/checkout" class="btn btn-primary btn-lg cart-drawer__checkout">Check Out</a>' +
    '</div>';

    // Insert after header
    header.insertAdjacentElement('afterend', itemsDiv);
    itemsDiv.insertAdjacentElement('afterend', spinnerDiv);
    spinnerDiv.insertAdjacentElement('afterend', createElementFromHtml(footerHtml));

    // Update references
    itemsContainer = panel.querySelector('[data-cart-drawer-items]');
    footerContainer = panel.querySelector('[data-cart-drawer-footer]');
    subtotalEl = panel.querySelector('[data-cart-drawer-subtotal]');
  }

  /* ============================================
     Utilities
     ============================================ */

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function getSizedImageUrl(src, size) {
    if (!src) return '';
    // Shopify image URL size parameter
    if (src.indexOf('_' + size + '.') !== -1) return src;
    var match = src.match(/\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif|webp)(\?.*)?$/i);
    if (match) {
      var prefix = src.split(match[0]);
      return prefix[0] + '_' + size + '.' + match[1] + (match[2] || '');
    }
    return src;
  }

  function createElementFromHtml(html) {
    var template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstChild;
  }

  /* ============================================
     Initialize
     ============================================ */

  bindItemEvents();
  drawer.setAttribute('aria-hidden', 'true');
})();
