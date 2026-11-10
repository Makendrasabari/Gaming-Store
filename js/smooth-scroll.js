/**
 * STACKLY GAMING STORE - SMOOTH SCROLL CONTROLLER (smooth-scroll.js)
 * Butter-smooth, non-blocking Lenis 1.1.18 integration with GSAP ScrollTrigger sync,
 * touch-optimized scrolling, zero-jitter auto-resize, and modal/drawer isolation.
 */
(function () {
  'use strict';

  if (typeof Lenis === 'undefined') return;

  // Respect user preference for reduced motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // Initialize Lenis with single-driver loop (autoRaf: false) to prevent double-loop stutter
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: 1.5,
    syncTouch: false, // Let mobile touch scrolling stay 100% native and fluid
    autoRaf: false    // We control the single animation ticker below
  });

  // Expose globally for modals, cart drawer, and interactive components
  window.lenis = lenis;

  // Synchronize with GSAP & ScrollTrigger if present, otherwise single clean RAF loop
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
  } else {
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // Smooth scroll for anchor links with data-lenis-prevent avoidance
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || href === '#' || href === '#cart') return;

    try {
      const targetEl = document.querySelector(href);
      if (targetEl) {
        e.preventDefault();
        lenis.scrollTo(targetEl, {
          offset: -80,
          duration: 1.1
        });
      }
    } catch (err) {
      // Ignore invalid selectors
    }
  });

  // Re-calculate dimensions when DOM updates or images load
  window.addEventListener('load', () => {
    lenis.resize();
  });

  // Re-calculate on window resize
  window.addEventListener('resize', () => {
    lenis.resize();
  }, { passive: true });
})();
