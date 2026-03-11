/**
 * Travis County Farm - Global Interactions
 * Nav scroll, mobile menu, scroll-reveal, cart toggle
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollEffects();
  initAnimations();
  initCartToggle();
});

/* ============================================
   Navigation
   ============================================ */

function initNavigation() {
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (!nav || !navToggle || !navLinks) return;

  const links = navLinks.querySelectorAll('a');

  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    navToggle.classList.toggle('active');
    const isExpanded = navLinks.classList.contains('active');
    navToggle.setAttribute('aria-expanded', isExpanded);
  });

  links.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && navLinks.classList.contains('active')) {
      navLinks.classList.remove('active');
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ============================================
   Scroll Effects
   ============================================ */

function initScrollEffects() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (window.scrollY > 50) {
          nav.classList.add('scrolled');
        } else {
          nav.classList.remove('scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  });
}

/* ============================================
   Scroll Reveal Animations
   ============================================ */

function initAnimations() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.product-card, .value-item, .scroll-reveal').forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity 0.6s ease ${index * 0.08}s, transform 0.6s ease ${index * 0.08}s`;
    revealObserver.observe(el);
  });

  const heroElements = document.querySelectorAll('.hero-badge, .hero-title, .hero-subtitle, .hero-actions, .hero-stats');
  heroElements.forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity 0.6s ease ${index * 0.12}s, transform 0.6s ease ${index * 0.12}s`;

    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 100);
  });
}

/* ============================================
   Cart Toggle (drawer vs page)
   ============================================ */

function initCartToggle() {
  document.querySelectorAll('[data-cart-toggle]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.tcf && window.tcf.cartType === 'drawer') {
        const drawer = document.getElementById('cart-drawer');
        if (drawer) {
          drawer.classList.add('active');
          document.body.style.overflow = 'hidden';
          refreshCartDrawer();
        }
      } else {
        window.location.href = window.tcf.routes.cart_url;
      }
    });
  });
}

/* ============================================
   Cart Helpers (used by cart-drawer.js too)
   ============================================ */

function formatMoney(cents) {
  if (typeof cents === 'string') cents = cents.replace('.', '');
  var value = (cents / 100).toFixed(2);
  return '$' + value;
}

function updateCartCount(count) {
  document.querySelectorAll('[data-cart-count]').forEach(el => {
    el.textContent = count;
    el.classList.toggle('hidden', count === 0);
  });
}

async function refreshCartDrawer() {
  try {
    const res = await fetch(window.tcf.routes.cart_url + '.js');
    const cart = await res.json();
    updateCartCount(cart.item_count);
    const event = new CustomEvent('cart:updated', { detail: cart });
    document.dispatchEvent(event);
  } catch (e) {
    console.error('Failed to refresh cart:', e);
  }
}

async function addToCart(formData) {
  try {
    const res = await fetch(window.tcf.routes.cart_add_url + '.js', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Add to cart failed');
    const item = await res.json();
    await refreshCartDrawer();
    if (window.tcf.cartType === 'drawer') {
      const drawer = document.getElementById('cart-drawer');
      if (drawer) {
        drawer.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    }
    return item;
  } catch (e) {
    console.error('Add to cart error:', e);
    throw e;
  }
}

async function changeCartItem(key, quantity) {
  try {
    const res = await fetch(window.tcf.routes.cart_change_url + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity: quantity })
    });
    if (!res.ok) throw new Error('Cart update failed');
    const cart = await res.json();
    updateCartCount(cart.item_count);
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
    return cart;
  } catch (e) {
    console.error('Cart change error:', e);
    throw e;
  }
}
