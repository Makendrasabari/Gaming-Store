/**
 * STACKLY GAMING STORE - CINEMATIC GUN-SHOOTING PRELOADER SCRIPT (preloader.js)
 * Realistic weapon entrance, mechanical slide unfolding, muzzle flash recoil,
 * telemetry telemetry sync, and smooth seamless transition to page.
 */

(function () {
  'use strict';

  function initPreloader() {
    const preloader = document.getElementById('gaming-preloader');
    if (!preloader) return;

    // Check dashboard session: show once on first entrance, not on internal subpage clicks
    const pathname = window.location.pathname;
    const isDashboard = pathname.includes('customer-dashboard') || pathname.includes('admin-dashboard');

    if (isDashboard) {
      if (sessionStorage.getItem('stackly_dash_preloaded')) {
        preloader.style.display = 'none';
        return;
      }
      sessionStorage.setItem('stackly_dash_preloaded', 'true');
    }

    const shakeLayer = preloader.querySelector('.preloader-shake-layer');
    const flashOverlay = preloader.querySelector('.preloader-flash-overlay');
    const ambientGlow = preloader.querySelector('.preloader-ambient-glow');
    const gunRig = preloader.querySelector('.gun-rig');
    const muzzleBlast = preloader.querySelector('.gun-muzzle-blast');
    const shockwave = preloader.querySelector('.gun-shockwave-ring');
    const tracer = preloader.querySelector('.gun-plasma-tracer');
    const spark = preloader.querySelector('.plasma-eject-particle');
    const meterFill = preloader.querySelector('.preloader-meter-fill');
    const percentReadout = preloader.querySelector('.preloader-percent-readout');
    const telemetryText = preloader.querySelector('.preloader-telemetry-text');

    let currentProgress = 0;
    let targetProgress = 100;
    let hasPageLoaded = false;
    let animationFinished = false;

    window.addEventListener('load', () => {
      hasPageLoaded = true;
    });

    // Fallback if window load already fired before script execution
    if (document.readyState === 'complete') {
      hasPageLoaded = true;
    }

    const startTime = performance.now();
    const minDuration = 1750; // 1.75s cinematic runtime

    // Sequence Milestones
    let enteredFired = false;
    let unfoldFired = false;
    let shootFired = false;
    let settleFired = false;

    function renderProgress(percent, label) {
      if (meterFill) meterFill.style.width = Math.min(100, Math.max(0, percent)) + '%';
      if (percentReadout) percentReadout.textContent = Math.round(percent) + '%';
      if (label && telemetryText) telemetryText.textContent = label;
    }

    function triggerShoot() {
      if (!gunRig) return;
      // Gun recoil
      gunRig.classList.remove('gun-opened');
      gunRig.classList.add('gun-recoil');

      // Visual blasts
      if (muzzleBlast) muzzleBlast.classList.add('blast-active');
      if (shockwave) shockwave.classList.add('shockwave-active');
      if (tracer) tracer.classList.add('tracer-active');
      if (spark) spark.classList.add('eject-active');
      if (flashOverlay) flashOverlay.classList.add('flashing');
      if (shakeLayer) shakeLayer.classList.add('impact');

      // Remove flash overlay class after decay
      setTimeout(() => {
        if (flashOverlay) flashOverlay.classList.remove('flashing');
        if (shakeLayer) shakeLayer.classList.remove('impact');
      }, 300);
    }

    function triggerSettle() {
      if (!gunRig) return;
      gunRig.classList.remove('gun-recoil');
      gunRig.classList.add('gun-settled');
    }

    function animate(now) {
      const elapsed = now - startTime;

      // Stage 1: Entrance (100ms - 400ms)
      if (elapsed >= 100 && !enteredFired) {
        enteredFired = true;
        if (gunRig) gunRig.classList.add('gun-entered');
        if (telemetryText) telemetryText.textContent = 'ACQUIRING WEAPON MATRIX...';
      }

      // Stage 2: Mechanical Slide Unfold & Plasma Charging (450ms - 900ms)
      if (elapsed >= 450 && !unfoldFired) {
        unfoldFired = true;
        if (gunRig) gunRig.classList.add('gun-opened');
        if (ambientGlow) ambientGlow.classList.add('glow-charged');
        if (telemetryText) telemetryText.textContent = 'CHARGING PLASMA CORES...';
      }

      // Stage 3: Weapon Firing & Recoil (950ms)
      if (elapsed >= 950 && !shootFired) {
        shootFired = true;
        triggerShoot();
        if (telemetryText) telemetryText.textContent = 'DISCHARGING ENERGY PULSE...';
      }

      // Stage 4: Slide Locks Battery & Weapon Settles (1300ms)
      if (elapsed >= 1300 && !settleFired) {
        settleFired = true;
        triggerSettle();
        if (telemetryText) telemetryText.textContent = 'ALL SYSTEMS ARMED // READY';
      }

      // Progress Calculation
      let progressRatio = elapsed / minDuration;
      if (!hasPageLoaded && progressRatio > 0.85) {
        // Hold smoothly at 85% if network hasn't delivered entire payload yet
        progressRatio = 0.85;
      }
      currentProgress = Math.min(100, Math.round(progressRatio * 100));
      renderProgress(currentProgress);

      // Check Completion: minimum duration reached AND page is loaded
      if (elapsed >= minDuration && hasPageLoaded) {
        renderProgress(100, 'SYSTEM ONLINE // WELCOME');
        if (!animationFinished) {
          animationFinished = true;
          finishPreloader();
        }
        return;
      }

      // Safety timeout: 2.8s maximum to never block user
      if (elapsed >= 2800) {
        renderProgress(100, 'SYSTEM ONLINE // WELCOME');
        if (!animationFinished) {
          animationFinished = true;
          finishPreloader();
        }
        return;
      }

      requestAnimationFrame(animate);
    }

    function finishPreloader() {
      // Smooth fade-out transition
      setTimeout(() => {
        preloader.classList.add('fade-out');

        // Remove from DOM / render tree after transition
        setTimeout(() => {
          preloader.style.display = 'none';
        }, 700);
      }, 150);
    }

    // Start sequence on next animation frame
    requestAnimationFrame(animate);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPreloader);
  } else {
    initPreloader();
  }
})();
