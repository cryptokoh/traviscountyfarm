/**
 * Travis County Farm - Site Interactions
 * Nav scroll, mobile menu, fade-in animations
 */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initScrollEffects();
    initAnimations();
    initForms();
});

/**
 * Navigation
 */
function initNavigation() {
    const nav = document.getElementById('nav');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    if (!nav || !navToggle || !navLinks) return;

    const links = navLinks.querySelectorAll('a');

    // Mobile menu toggle
    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        navToggle.classList.toggle('active');
        const isExpanded = navLinks.classList.contains('active');
        navToggle.setAttribute('aria-expanded', isExpanded);
    });

    // Close mobile menu when clicking a link
    links.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            navToggle.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            navToggle.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
        }
    });

    // Smooth scroll for anchor links
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#') && href.length > 1) {
            link.addEventListener('click', (e) => {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    const navHeight = nav.offsetHeight;
                    const targetPosition = target.offsetTop - navHeight - 20;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });

                    history.pushState(null, '', href);
                }
            });
        }
    });
}

/**
 * Scroll Effects
 */
function initScrollEffects() {
    const nav = document.getElementById('nav');
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    });

    function handleScroll() {
        const currentScrollY = window.scrollY;

        if (currentScrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        // Update active nav link based on scroll position
        updateActiveNavLink(currentScrollY);
    }

    function updateActiveNavLink(scrollY) {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        const navHeight = nav.offsetHeight + 40;

        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop - navHeight;
            if (scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === `#${current}`) {
                link.classList.add('active');
            } else if (!current && href === '#') {
                link.classList.add('active');
            }
        });
    }
}

/**
 * Scroll Reveal Animations
 */
function initAnimations() {
    // Intersection Observer for reveal animations
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

    // Observe product cards and value items
    document.querySelectorAll('.product-card, .value-item').forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.08}s, transform 0.6s ease ${index * 0.08}s`;
        revealObserver.observe(el);
    });

    // Hero entrance animations
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

/**
 * Forms
 */
function initForms() {
    const newsletterForm = document.getElementById('newsletterForm');
    if (!newsletterForm) return;

    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input[type="email"]').value;
        const button = newsletterForm.querySelector('button');
        const originalHTML = button.innerHTML;

        // Loading state
        button.innerHTML = '<span>Joining...</span>';
        button.disabled = true;

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Success state
        button.innerHTML = '<span>Joined!</span>';
        newsletterForm.reset();

        // Reset after delay
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.disabled = false;
        }, 3000);
    });
}
