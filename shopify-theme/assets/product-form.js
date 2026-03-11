/**
 * Travis County Farm - Product Form
 * Handles variant selection, quantity, gallery, and add-to-cart
 */

document.addEventListener('DOMContentLoaded', () => {
  initProductGallery();
  initVariantSelect();
  initQuantityButtons();
  initProductForm();
});

/* ============================================
   Image Gallery
   ============================================ */

function initProductGallery() {
  const thumbs = document.querySelectorAll('.product-gallery__thumb');
  const mainImage = document.getElementById('ProductMainImage');

  if (!thumbs.length || !mainImage) return;

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const url = thumb.getAttribute('data-image-url');
      const alt = thumb.getAttribute('data-image-alt');

      mainImage.src = url;
      mainImage.alt = alt || '';

      thumbs.forEach(t => t.classList.remove('product-gallery__thumb--active'));
      thumb.classList.add('product-gallery__thumb--active');
    });
  });
}

/* ============================================
   Variant Selection
   ============================================ */

function initVariantSelect() {
  const select = document.querySelector('[data-variant-select]');
  if (!select) return;

  const variantIdInput = document.getElementById('ProductVariantId');
  const submitBtn = document.querySelector('.product-form__submit');
  const mainImage = document.getElementById('ProductMainImage');

  select.addEventListener('change', () => {
    const option = select.options[select.selectedIndex];
    const variantId = option.value;

    /* Update hidden variant ID */
    if (variantIdInput) {
      variantIdInput.value = variantId;
    }

    /* Update price display */
    const price = option.getAttribute('data-price');
    const comparePrice = option.getAttribute('data-compare-price');
    const priceContainer = document.querySelector('.product-info__price .price');

    if (priceContainer && price) {
      const currentEl = priceContainer.querySelector('.price__current');
      const compareEl = priceContainer.querySelector('.price__compare-value');

      if (currentEl) {
        currentEl.textContent = formatMoney(price);
      }

      if (comparePrice) {
        priceContainer.classList.add('price--on-sale');
        if (compareEl) {
          compareEl.textContent = formatMoney(comparePrice);
          compareEl.style.display = '';
        }
      } else {
        priceContainer.classList.remove('price--on-sale');
        if (compareEl) {
          compareEl.style.display = 'none';
        }
      }
    }

    /* Update image if variant has one */
    const imageUrl = option.getAttribute('data-image-url');
    const imageAlt = option.getAttribute('data-image-alt');

    if (imageUrl && mainImage) {
      mainImage.src = imageUrl;
      mainImage.alt = imageAlt || '';

      /* Highlight matching thumbnail */
      const thumbs = document.querySelectorAll('.product-gallery__thumb');
      thumbs.forEach(thumb => {
        const thumbUrl = thumb.getAttribute('data-image-url');
        if (thumbUrl === imageUrl) {
          thumbs.forEach(t => t.classList.remove('product-gallery__thumb--active'));
          thumb.classList.add('product-gallery__thumb--active');
        }
      });
    }

    /* Update add to cart button state */
    if (submitBtn) {
      if (option.disabled) {
        submitBtn.disabled = true;
        submitBtn.textContent = option.textContent.trim();
      } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = submitBtn.getAttribute('data-add-text') || submitBtn.innerHTML;
      }
    }

    /* Update URL without page reload */
    const url = new URL(window.location);
    url.searchParams.set('variant', variantId);
    window.history.replaceState({}, '', url);
  });
}

/* ============================================
   Quantity Buttons
   ============================================ */

function initQuantityButtons() {
  const minusBtn = document.querySelector('[data-qty-minus]');
  const plusBtn = document.querySelector('[data-qty-plus]');
  const input = document.getElementById('ProductQuantity');

  if (!minusBtn || !plusBtn || !input) return;

  minusBtn.addEventListener('click', () => {
    const current = parseInt(input.value, 10) || 1;
    if (current > 1) {
      input.value = current - 1;
    }
  });

  plusBtn.addEventListener('click', () => {
    const current = parseInt(input.value, 10) || 1;
    input.value = current + 1;
  });

  input.addEventListener('change', () => {
    const val = parseInt(input.value, 10);
    if (isNaN(val) || val < 1) {
      input.value = 1;
    }
  });
}

/* ============================================
   Add to Cart (via fetch)
   ============================================ */

function initProductForm() {
  const form = document.getElementById('ProductForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('.product-form__submit');
    if (!submitBtn || submitBtn.disabled) return;

    const originalContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span>';

    try {
      const formData = new FormData(form);
      await addToCart(formData);
    } catch (err) {
      console.error('Add to cart failed:', err);
      submitBtn.innerHTML = originalContent;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalContent;
    }
  });
}
