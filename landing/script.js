/**
 * CRIVO Landing Page — script.js
 * Handles: navbar scroll, mobile menu, scroll-reveal, Lucide icons init, footer year.
 */

/* ── Wait for DOM ─────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  /* ============================================
     1. LUCIDE ICONS — initialise after DOM ready
  ============================================ */
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  /* ============================================
     2. FOOTER — dynamic year
  ============================================ */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============================================
     3. NAVBAR — scroll shadow & background
  ============================================ */
  const navbar = document.getElementById('navbar');

  function onNavbarScroll() {
    if (window.scrollY > 12) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onNavbarScroll, { passive: true });
  onNavbarScroll(); // run once on load

  /* ============================================
     4. MOBILE MENU — hamburger toggle
  ============================================ */
  const hamburger   = document.getElementById('hamburger');
  const mobileMenu  = document.getElementById('mobile-menu');

  function openMenu() {
    hamburger.setAttribute('aria-expanded', 'true');
    mobileMenu.removeAttribute('hidden');
    // Prevent body scroll while menu is open
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  function toggleMenu() {
    const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
    if (isOpen) closeMenu();
    else         openMenu();
  }

  hamburger.addEventListener('click', toggleMenu);

  // Close menu when any nav link inside mobile menu is clicked
  mobileMenu.querySelectorAll('[data-close-menu]').forEach(el => {
    el.addEventListener('click', closeMenu);
  });

  // Close menu on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });

  // Close menu when clicking outside of it
  document.addEventListener('click', e => {
    const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
    if (isOpen && !navbar.contains(e.target)) closeMenu();
  });

  /* ============================================
     5. SMOOTH SCROLL for anchor links
  ============================================ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const navbarHeight = navbar.offsetHeight;
      const top = target.getBoundingClientRect().top + window.scrollY - navbarHeight - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ============================================
     6. SCROLL REVEAL — IntersectionObserver
  ============================================ */
  const revealEls = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Once revealed, stop observing to save resources
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,       // trigger when 12% of element is visible
      rootMargin: '0px 0px -40px 0px' // slight offset from viewport bottom
    }
  );

  revealEls.forEach(el => revealObserver.observe(el));

  /* ============================================
     7. ACTIVE NAV LINK — highlight based on scroll
  ============================================ */
  const sections    = document.querySelectorAll('section[id]');
  const navLinks    = document.querySelectorAll('.navbar__links .nav-link');

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${id}`) {
              link.style.color = 'var(--color-green-600)';
              link.style.fontWeight = '600';
            } else {
              link.style.color = '';
              link.style.fontWeight = '';
            }
          });
        }
      });
    },
    { rootMargin: '-50% 0px -50% 0px' } // trigger at midpoint of viewport
  );

  sections.forEach(sec => sectionObserver.observe(sec));

  /* ============================================
     8. DASHBOARD CHART — animated bar heights
     (adds a subtle entrance animation to bars)
  ============================================ */
  const chartBars = document.querySelectorAll('.dp-bar');

  chartBars.forEach(bar => {
    // Store target height, reset to 0 for animation
    const targetHeight = bar.style.getPropertyValue('--h');
    bar.style.setProperty('--h', '0%');

    setTimeout(() => {
      bar.style.transition = 'height 0.8s cubic-bezier(.4,0,.2,1)';
      bar.style.setProperty('--h', targetHeight);
    }, 600);
  });

});
