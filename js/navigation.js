/**
 * STACKLY GAMING STORE - NAVIGATION SCRIPT (navigation.js)
 * Header scrolling behavior, mobile menu drawer, and active link management
 */

document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const mobileToggle = document.querySelector('.mobile-nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

  // 1. Header scroll effect
  if (header) {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // 2. Mobile navigation toggle & responsive drawer
  if (mobileToggle && navMenu) {
    // Prevent Lenis from capturing scroll inside the mobile drawer
    navMenu.setAttribute('data-lenis-prevent', '');

    const openMenu = () => {
      navMenu.classList.add('nav-open');
      mobileToggle.classList.add('is-active');
      mobileToggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('mobile-menu-active');
      document.documentElement.classList.add('mobile-menu-active');
      if (window.lenis && typeof window.lenis.stop === 'function') {
        window.lenis.stop();
      }
    };

    const closeMenu = () => {
      navMenu.classList.remove('nav-open');
      mobileToggle.classList.remove('is-active');
      mobileToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('mobile-menu-active');
      document.documentElement.classList.remove('mobile-menu-active');
      if (window.lenis && typeof window.lenis.start === 'function') {
        window.lenis.start();
      }
    };

    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navMenu.classList.contains('nav-open');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close when clicking any nav link or drawer login button
    navMenu.querySelectorAll('.nav-link, .mobile-nav-login-btn').forEach(link => {
      link.addEventListener('click', () => {
        closeMenu();
      });
    });

    // Close when clicking outside of the drawer & toggle
    document.addEventListener('click', (e) => {
      if (navMenu.classList.contains('nav-open')) {
        if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
          closeMenu();
        }
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('nav-open')) {
        closeMenu();
      }
    });

    // Auto-close when viewport resized above mobile breakpoint (> 768px)
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && navMenu.classList.contains('nav-open')) {
        closeMenu();
      }
    }, { passive: true });
  }

  // 3. Highlight current page in navbar
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
});

