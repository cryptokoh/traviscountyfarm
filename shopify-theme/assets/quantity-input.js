/**
 * Travis County Farm - Quantity Input
 * Handles +/- buttons on the cart page form and submits updates
 */

(function () {
  'use strict';

  var cartForm = document.getElementById('cart-form');
  if (!cartForm) return;

  var debounceTimer = null;

  /* ============================================
     Event Delegation
     ============================================ */

  cartForm.addEventListener('click', function (e) {
    var minusBtn = e.target.closest('[data-quantity-minus]');
    var plusBtn = e.target.closest('[data-quantity-plus]');
    var removeBtn = e.target.closest('[data-remove-cart-item]');

    if (minusBtn) {
      e.preventDefault();
      adjustQuantity(minusBtn, -1);
    }

    if (plusBtn) {
      e.preventDefault();
      adjustQuantity(plusBtn, 1);
    }

    if (removeBtn) {
      e.preventDefault();
      var key = removeBtn.getAttribute('data-key');
      if (key) {
        removeItem(key);
      }
    }
  });

  cartForm.addEventListener('change', function (e) {
    var field = e.target.closest('[data-quantity-field]');
    if (!field) return;

    var val = parseInt(field.value, 10);
    if (isNaN(val) || val < 0) {
      field.value = 1;
    }

    debouncedSubmit();
  });

  /* ============================================
     Quantity Adjustment
     ============================================ */

  function adjustQuantity(button, delta) {
    var wrapper = button.closest('[data-quantity-input]');
    if (!wrapper) return;

    var field = wrapper.querySelector('[data-quantity-field]');
    if (!field) return;

    var current = parseInt(field.value, 10) || 0;
    var min = parseInt(field.getAttribute('min'), 10) || 0;
    var max = parseInt(field.getAttribute('max'), 10) || 99;
    var newVal = Math.min(Math.max(current + delta, min), max);

    field.value = newVal;
    debouncedSubmit();
  }

  /* ============================================
     Form Submission
     ============================================ */

  function debouncedSubmit() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      submitCartForm();
    }, 400);
  }

  function submitCartForm() {
    // Build updates object from all quantity fields
    var fields = cartForm.querySelectorAll('[data-quantity-field]');
    var updates = {};

    fields.forEach(function (field) {
      var key = field.getAttribute('data-key');
      var qty = parseInt(field.value, 10);
      if (key && !isNaN(qty)) {
        updates[key] = qty;
      }
    });

    // Also gather note if present
    var noteField = cartForm.querySelector('[name="note"]');
    var note = noteField ? noteField.value : undefined;

    var body = { updates: updates };
    if (note !== undefined) {
      body.note = note;
    }

    fetch(window.tcf.routes.cart_update_url + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Cart update failed');
        return res.json();
      })
      .then(function (cart) {
        updateCartCount(cart.item_count);

        // If cart is now empty, reload the page to show empty state
        if (cart.item_count === 0) {
          window.location.reload();
          return;
        }

        // Reload page to reflect new totals from Liquid
        window.location.reload();
      })
      .catch(function (err) {
        console.error('Cart page update error:', err);
      });
  }

  /* ============================================
     Remove Item
     ============================================ */

  function removeItem(key) {
    // Use changeCartItem from global.js to set quantity to 0
    if (typeof changeCartItem === 'function') {
      changeCartItem(key, 0)
        .then(function () {
          window.location.reload();
        })
        .catch(function (err) {
          console.error('Remove item error:', err);
        });
    } else {
      // Fallback: direct API call
      fetch(window.tcf.routes.cart_change_url + '.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, quantity: 0 })
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Remove failed');
          window.location.reload();
        })
        .catch(function (err) {
          console.error('Remove item error:', err);
        });
    }
  }
})();
