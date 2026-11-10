/**
 * STACKLY GAMING STORE - SMOOTH SCROLL CONTROLLER (smooth-scroll.js)
 * Smooth scrolling initialization via Lenis
 */
(function () {
  'use strict';
  if (typeof Lenis !== 'undefined') {
    const lenis = new Lenis({
      duration: 1.1,
      easing: function (t) {
        return Math.min(1, 1.001 - Math.pow(2, -10 * t));
      },
      smoothWheel: true
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }
})();

