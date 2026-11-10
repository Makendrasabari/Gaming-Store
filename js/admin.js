/**
 * STACKLY GAMING STORE - ADMIN DASHBOARD SCRIPT (admin.js)
 * Command Center session binding, dynamic initials rendering, active state management,
 * 4-card 3D smooth shuffle & arrange animation, and real-time live number runner.
 */

// Global window.alert override to prevent browser popup notifications
window.alert = function (message) {
  if (typeof window.showToastNotification === 'function') {
    window.showToastNotification(message, 'info');
  } else {
    console.log('[Stackly Alert]:', message);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Ensure all admin dashboard sections are instantly visible
  document.querySelectorAll('.reveal-on-scroll').forEach(el => {
    el.classList.add('is-revealed');
  });

  // 1. Load Admin Session
  const savedName = localStorage.getItem('stackly_user_name') || 'Administrator';
  const savedInitials = localStorage.getItem('stackly_user_initials') || 'AD';

  const avatarEls = document.querySelectorAll('.admin-avatar-initials');
  const nameEls = document.querySelectorAll('.admin-full-name');
  const welcomeNameEls = document.querySelectorAll('.admin-welcome-name');

  avatarEls.forEach(el => el.textContent = savedInitials);
  nameEls.forEach(el => el.textContent = savedName);
  welcomeNameEls.forEach(el => el.textContent = savedName);

  // 2. Highlight active sidebar link
  const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
  const sidebarLinks = document.querySelectorAll('.admin-nav-link');
  sidebarLinks.forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // 3. Logout action
  const logoutBtns = document.querySelectorAll('.admin-logout-btn');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('stackly_user_name');
      localStorage.removeItem('stackly_user_role');
      localStorage.removeItem('stackly_user_initials');
      localStorage.removeItem('stackly_user_email');
      sessionStorage.removeItem('stackly_dashboard_preloaded');
      sessionStorage.removeItem('stackly_dash_preloaded');
      window.location.href = '../login.html';
    });
  });

  // 4. Premium Right-to-Left Heading Animations across Dashboard
  if (typeof window.initCinematicHeadings === 'function') {
    window.initCinematicHeadings();
  }

  // 5. Initialize 4 Stat Cards 3D Shuffle & Live Number Runner (Admin Theme)
  initDashboardStatCards(true);

  // 6. Initialize Game Gallery 6-Card One-by-One Smooth Arrange
  initGameGalleryOneByOneArrange(true);

  // 7. Initialize Trio 3-Cards Left-Top-Right Converging Animation
  initTrioCardsAnimation(true);

  // 8. Initialize Duo 2-Cards Left-Top & Right-Bottom Converging Animation
  initDuoCardsAnimation(true);

  // 9. Initialize Table Column-by-Column Staggered Animation
  initTableColumnAnimations(true);

  // 10. Complete Responsive Navigation & Profile Dropdown Fix
  initAdminDashboardNavigation();

  // 11. Universal redirect to 404 for dashboard action buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-primary, .btn-secondary');
    if (!btn) return;
    if (btn.closest('.admin-sidebar') || 
        btn.closest('.admin-topbar') || 
        btn.classList.contains('admin-logout-btn') || 
        btn.classList.contains('admin-hamburger-btn') || 
        btn.classList.contains('admin-close-btn')) {
      return;
    }
    e.preventDefault();
    window.location.href = '../404.html';
  });
});

/* ==========================================================================
   4 STAT CARDS SHUFFLE & ARRANGE ANIMATION + LIVE NUMBER RUNNER ENGINE
   ========================================================================== */

function parseStatValue(str) {
  const trimmed = str.trim();
  const match = trimmed.match(/^([^0-9.]*)([0-9,.]+)(.*)$/);
  if (!match) return null;
  const prefix = match[1];
  const numStr = match[2];
  const suffix = match[3];

  const cleanNumStr = numStr.replace(/,/g, '');
  const target = parseFloat(cleanNumStr);
  const decimalMatch = numStr.match(/\.([0-9]+)/);
  const decimals = decimalMatch ? decimalMatch[1].length : 0;
  return { prefix, target, decimals, suffix, original: trimmed };
}

function formatStatValue(val, decimals, prefix, suffix) {
  const parts = val.toFixed(decimals).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return prefix + parts.join('.') + suffix;
}

function animateNumberRun(valEl, target, decimals, prefix, suffix, duration = 1100) {
  if (!valEl) return;
  valEl.classList.add('live-running');
  
  const startTime = performance.now();
  const startVal = 0;

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Smooth cubic ease out
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = startVal + (target - startVal) * ease;
    
    valEl.textContent = formatStatValue(current, decimals, prefix, suffix);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      valEl.textContent = formatStatValue(target, decimals, prefix, suffix);
      valEl.classList.remove('live-running');
    }
  }

  requestAnimationFrame(step);
}

function runShuffleAndArrange(cards, valSelector, isThemeAdmin) {
  const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Clear existing motion classes
  cards.forEach(card => {
    card.classList.remove(
      'card-shuffled-0', 'card-shuffled-1', 'card-shuffled-2', 'card-shuffled-3',
      'card-arranged', 'card-settled'
    );
  });

  // Step 1: Put cards into 3D displaced Shuffled state
  cards.forEach((card, index) => {
    const valEl = card.querySelector(valSelector);
    if (!valEl) return;

    if (!card.dataset.targetRaw) {
      card.dataset.targetRaw = valEl.textContent.trim();
    }
    const parsed = parseStatValue(card.dataset.targetRaw);
    if (parsed) {
      card.dataset.prefix = parsed.prefix;
      card.dataset.targetNum = parsed.target;
      card.dataset.decimals = parsed.decimals;
      card.dataset.suffix = parsed.suffix;
      // Reset displayed number to 0 initially
      valEl.textContent = formatStatValue(0, parsed.decimals, parsed.prefix, parsed.suffix);
    }

    if (!isReduced) {
      card.classList.add('card-shuffled-' + index);
    }
  });

  // Step 2: Staggered smooth glide & arrangement into clean grid slots
  const delays = isReduced ? [0, 0, 0, 0] : [80, 200, 320, 440];
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.remove('card-shuffled-' + index);
      card.classList.add('card-arranged');

      // Flash settled neon glow
      card.classList.add('card-settled');
      setTimeout(() => {
        card.classList.remove('card-settled');
      }, 550);

      // Trigger live count-up number run
      const valEl = card.querySelector(valSelector);
      if (valEl && card.dataset.targetNum !== undefined) {
        const target = parseFloat(card.dataset.targetNum);
        const decimals = parseInt(card.dataset.decimals, 10) || 0;
        const prefix = card.dataset.prefix || '';
        const suffix = card.dataset.suffix || '';
        animateNumberRun(valEl, target, decimals, prefix, suffix, isReduced ? 200 : 1050);
      }
    }, delays[index] || (index * 120));
  });
}

function setupContinuousLiveTicker(cards, valSelector, isThemeAdmin) {
  // Live Ticker interval: every ~3.5 seconds, a random stat receives a live telemetry tick
  setInterval(() => {
    if (!cards || !cards.length) return;
    
    const validIndices = [];
    cards.forEach((card, idx) => {
      validIndices.push(idx);
    });

    if (!validIndices.length) return;
    const randomIdx = validIndices[Math.floor(Math.random() * validIndices.length)];
    const card = cards[randomIdx];
    const valEl = card.querySelector(valSelector);
    if (!valEl || card.dataset.targetNum === undefined) return;

    let target = parseFloat(card.dataset.targetNum);
    const decimals = parseInt(card.dataset.decimals, 10) || 0;
    const prefix = card.dataset.prefix || '';
    const suffix = card.dataset.suffix || '';

    let delta = 1;
    let deltaText = '+1';

    if (prefix === '$') {
      // Revenue / Currency tick
      delta = decimals > 0 ? (Math.random() > 0.5 ? 49.99 : 24.50) : 70;
      deltaText = '+$' + delta.toFixed(decimals > 0 ? 2 : 0);
    } else if (suffix === 'h') {
      // Game hours tick
      delta = 1;
      deltaText = '+1h';
    } else if (suffix === '%') {
      // Percentage tick
      delta = 0.1;
      deltaText = '+0.1%';
    } else if (target > 1000) {
      // Big number (XP, Orders, Players)
      delta = Math.floor(Math.random() * 5) + 2;
      deltaText = '+' + delta;
    } else {
      delta = 1;
      deltaText = '+1';
    }

    // Update target
    target += delta;
    card.dataset.targetNum = target;

    // Show floating delta pill
    const existingPill = card.querySelector('.live-delta-pill');
    if (existingPill) existingPill.remove();

    const pill = document.createElement('span');
    pill.className = 'live-delta-pill';
    pill.textContent = deltaText;
    card.appendChild(pill);
    setTimeout(() => pill.remove(), 1400);

    // Number pulse
    valEl.classList.add('live-tick-pulse');
    valEl.textContent = formatStatValue(target, decimals, prefix, suffix);
    setTimeout(() => {
      valEl.classList.remove('live-tick-pulse');
    }, 600);
  }, 3500);
}

function initDashboardStatCards(isThemeAdmin = false) {
  const containerSelector = isThemeAdmin ? '.admin-stats-grid' : '.stats-cards-row';
  const cardSelector = isThemeAdmin ? '.admin-stat-tile' : '.dash-stat-card';
  const valSelector = isThemeAdmin ? '.admin-stat-value' : '.dash-stat-val';

  const containers = document.querySelectorAll(containerSelector);
  if (!containers.length) return;

  containers.forEach(container => {
    const cards = Array.from(container.querySelectorAll(cardSelector));
    if (cards.length !== 4) return;

    // Insert Live Telemetry bar if not present
    let prev = container.previousElementSibling;
    if (!prev || !prev.classList.contains('stat-live-telemetry-bar')) {
      const bar = document.createElement('div');
      bar.className = 'stat-live-telemetry-bar';
      const accent = isThemeAdmin ? '#00F0FF' : '#00FF87';
      bar.innerHTML = `
        <div class="stat-live-badge" style="color: ${accent};">
          <span class="stat-live-pulse-dot" style="background-color: ${accent}; box-shadow: 0 0 10px ${accent};"></span>
          <span>LIVE REAL-TIME TELEMETRY</span>
        </div>
      `;
      container.parentNode.insertBefore(bar, container);
    }

    // Clicking any card triggers re-shuffle
    cards.forEach(card => {
      card.style.cursor = 'pointer';
      card.setAttribute('title', 'Metrics Card');
      card.addEventListener('click', () => {
        runShuffleAndArrange(cards, valSelector, isThemeAdmin);
      });
    });

    // Run initial shuffle and live count-up on load
    setTimeout(() => {
      runShuffleAndArrange(cards, valSelector, isThemeAdmin);
    }, 280);

    // Continuous Live Ticker
    setupContinuousLiveTicker(cards, valSelector, isThemeAdmin);
  });
}


/* ==========================================================================
   GAME GALLERY CARDS ONE-BY-ONE ARRANGE ENGINE
   ========================================================================== */

function runGalleryOneByOneArrange(galleryCards, isThemeAdmin) {
  const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Clear existing classes
  galleryCards.forEach(card => {
    card.classList.remove(
      'gallery-shuffled-0', 'gallery-shuffled-1', 'gallery-shuffled-2',
      'gallery-shuffled-3', 'gallery-shuffled-4', 'gallery-shuffled-5',
      'gallery-arranged', 'gallery-settled'
    );
  });

  // Step 1: Put all cards into displaced shuffled 3D state
  galleryCards.forEach((card, index) => {
    if (!isReduced) {
      card.classList.add('gallery-shuffled-' + (index % 6));
    }
  });

  // Step 2: Smooth one-by-one glide & arrange into orderly grid
  const delays = isReduced ? [0, 0, 0, 0, 0, 0] : [90, 220, 350, 480, 610, 740];
  galleryCards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.remove('gallery-shuffled-' + (index % 6));
      card.classList.add('gallery-arranged');

      // Flash settled neon glow
      card.classList.add('gallery-settled');
      setTimeout(() => {
        card.classList.remove('gallery-settled');
      }, 500);
    }, delays[index] || (index * 130));
  });
}

function initGameGalleryOneByOneArrange(isThemeAdmin = false) {
  const galleryGrids = document.querySelectorAll('.game-gallery-grid');
  if (!galleryGrids.length) return;

  galleryGrids.forEach(grid => {
    const cards = Array.from(grid.querySelectorAll('.game-gallery-card'));
    if (!cards.length) return;

    // Insert Live Collection / Telemetry Bar if not present
    let prev = grid.previousElementSibling;
    if (!prev || !prev.classList.contains('gallery-telemetry-bar')) {
      const bar = document.createElement('div');
      bar.className = 'gallery-telemetry-bar';
      const accent = isThemeAdmin ? '#00F0FF' : '#00FF87';
      bar.innerHTML = `
        <div class="gallery-telemetry-badge" style="color: ${accent};">
          <span class="gallery-telemetry-dot" style="background-color: ${accent}; box-shadow: 0 0 10px ${accent};"></span>
          <span>COLLECTION MATRIX // ${cards.length} TITLES ONLINE</span>
        </div>
      `;
      grid.parentNode.insertBefore(bar, grid);
    }

    // Clicking any card triggers re-arrangement
    cards.forEach(card => {
      card.setAttribute('title', 'Game Title');
      card.addEventListener('click', () => {
        runGalleryOneByOneArrange(cards, isThemeAdmin);
      });
    });

    // Run initial one-by-one arrange after a short entrance delay
    setTimeout(() => {
      runGalleryOneByOneArrange(cards, isThemeAdmin);
    }, 350);
  });
}


/* ==========================================================================
   TRIO 3-CARDS CONVERGING ENGINE (LEFT, TOP, RIGHT -> ARRANGE SMOOTHLY)
   ========================================================================== */

function runTrioCardsArrange(trioGrid, isThemeAdmin) {
  const cards = Array.from(trioGrid.querySelectorAll('.trio-card'));
  if (cards.length !== 3) return;

  const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Clear existing animation states
  cards.forEach(card => {
    card.classList.remove(
      'trio-enter-left', 'trio-enter-top', 'trio-enter-right',
      'trio-arranged', 'trio-settled'
    );
  });

  // Step 1: Position each card in its designated direction
  // Card 1: comes from LEFT
  // Card 2: comes from TOP
  // Card 3: comes from RIGHT
  if (!isReduced) {
    cards[0].classList.add('trio-enter-left');
    cards[1].classList.add('trio-enter-top');
    cards[2].classList.add('trio-enter-right');
  }

  // Step 2: Smooth converging glide & arrange into orderly row
  const delays = isReduced ? [0, 0, 0] : [90, 200, 310];

  cards.forEach((card, index) => {
    setTimeout(() => {
      // Remove directional classes
      card.classList.remove('trio-enter-left', 'trio-enter-top', 'trio-enter-right');
      card.classList.add('trio-arranged');

      // Flash settled glow
      card.classList.add('trio-settled');
      setTimeout(() => {
        card.classList.remove('trio-settled');
      }, 550);
    }, delays[index] || 150);
  });
}

function initTrioCardsAnimation(isThemeAdmin = false) {
  const trioGrids = document.querySelectorAll('.trio-cards-grid');
  if (!trioGrids.length) return;

  trioGrids.forEach(grid => {
    const cards = Array.from(grid.querySelectorAll('.trio-card'));
    if (cards.length !== 3) return;

    // Clicking any card triggers the left-top-right convergence
    cards.forEach(card => {
      card.setAttribute('title', 'Overview Card');
      card.addEventListener('click', () => {
        runTrioCardsArrange(grid, isThemeAdmin);
      });
    });

    // Run initial left-top-right arrange on load
    setTimeout(() => {
      runTrioCardsArrange(grid, isThemeAdmin);
    }, 380);
  });
}


/* ==========================================================================
   DUO 2-CARDS OPPOSING ENGINE (LEFT FROM TOP, RIGHT FROM BOTTOM)
   ========================================================================== */

function runDuoCardsArrange(duoGrid, isThemeAdmin) {
  const leftCard = duoGrid.querySelector('.duo-card-left') || duoGrid.children[0];
  const rightCard = duoGrid.querySelector('.duo-card-right') || duoGrid.children[1];
  if (!leftCard || !rightCard) return;

  const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Clear existing animation classes
  [leftCard, rightCard].forEach(card => {
    card.classList.remove('duo-enter-top', 'duo-enter-bottom', 'duo-arranged', 'duo-settled');
  });

  // Step 1: Position Left Card at TOP, Right Card at BOTTOM
  if (!isReduced) {
    leftCard.classList.add('duo-enter-top');
    rightCard.classList.add('duo-enter-bottom');
  }

  // Step 2: Smoothly arrange into respective positions
  // Left card glides down from top
  setTimeout(() => {
    leftCard.classList.remove('duo-enter-top');
    leftCard.classList.add('duo-arranged');
    leftCard.classList.add('duo-settled');
    setTimeout(() => leftCard.classList.remove('duo-settled'), 550);
  }, isReduced ? 0 : 80);

  // Right card glides up from bottom
  setTimeout(() => {
    rightCard.classList.remove('duo-enter-bottom');
    rightCard.classList.add('duo-arranged');
    rightCard.classList.add('duo-settled');
    setTimeout(() => rightCard.classList.remove('duo-settled'), 550);
  }, isReduced ? 0 : 220);
}

function initDuoCardsAnimation(isThemeAdmin = false) {
  const duoGrids = document.querySelectorAll('.duo-cards-grid');
  if (!duoGrids.length) return;

  duoGrids.forEach(grid => {
    const leftCard = grid.querySelector('.duo-card-left') || grid.children[0];
    const rightCard = grid.querySelector('.duo-card-right') || grid.children[1];
    if (!leftCard || !rightCard) return;

    leftCard.classList.add('duo-card-left');
    rightCard.classList.add('duo-card-right');

    // Clicking either card re-triggers the animation
    [leftCard, rightCard].forEach(card => {
      card.setAttribute('title', 'Summary Card');
      card.addEventListener('click', () => {
        runDuoCardsArrange(grid, isThemeAdmin);
      });
    });

    // Initial arrangement on load
    setTimeout(() => {
      runDuoCardsArrange(grid, isThemeAdmin);
    }, 420);
  });
}


/* ==========================================================================
   TABLE COLUMN-BY-COLUMN ANIMATION RUNNER
   ========================================================================== */

function runTableColumnAnimation(table, isThemeAdmin) {
  const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Ensure all th and td have .col-cell-anim wrapper
  const cells = table.querySelectorAll('th, td');
  cells.forEach(cell => {
    if (!cell.querySelector('.col-cell-anim')) {
      const wrapper = document.createElement('span');
      wrapper.className = 'col-cell-anim';
      while (cell.firstChild) {
        wrapper.appendChild(cell.firstChild);
      }
      cell.appendChild(wrapper);
    }
  });

  const headerRow = table.querySelector('thead tr') || table.querySelector('tr');
  if (!headerRow) return;
  const numCols = headerRow.children.length;

  if (table._colAnimTimers) {
    table._colAnimTimers.forEach(id => clearTimeout(id));
  }
  table._colAnimTimers = [];

  if (isReduced) {
    for (let c = 1; c <= numCols; c++) {
      table.classList.remove('col-staging-' + c, 'col-settling-' + c);
    }
    return;
  }

  // 2. Put all columns into staging state (offset to left, hidden)
  for (let c = 1; c <= numCols; c++) {
    table.classList.remove('col-settling-' + c);
    table.classList.add('col-staging-' + c);
  }

  // Force reflow so staging is registered immediately
  void table.offsetWidth;

  // 3. Staggered arrival: Column 1, then Column 2, then Column 3, then Column 4...
  const colInterval = 160;
  for (let c = 1; c <= numCols; c++) {
    const colIdx = c;
    const delay = (colIdx - 1) * colInterval + 80;
    const tid = setTimeout(() => {
      // Column arrives: remove staging
      table.classList.remove('col-staging-' + colIdx);
      // Flash settling wave
      table.classList.add('col-settling-' + colIdx);
      const settleTid = setTimeout(() => {
        table.classList.remove('col-settling-' + colIdx);
      }, 500);
      table._colAnimTimers.push(settleTid);
    }, delay);
    table._colAnimTimers.push(tid);
  }
}

function initTableColumnAnimations(isThemeAdmin = false) {
  const tables = document.querySelectorAll('.dash-table, .admin-table');
  if (!tables.length) return;

  tables.forEach(table => {
    // Clicking table headers triggers re-scan
    const thead = table.querySelector('thead');
    if (thead) {
      thead.style.cursor = 'pointer';
      thead.setAttribute('title', 'Table Columns');
      thead.addEventListener('click', () => {
        runTableColumnAnimation(table, isThemeAdmin);
      });
    }

    // Initial column-by-column cascade on load
    setTimeout(() => {
      runTableColumnAnimation(table, isThemeAdmin);
    }, 450);
  });
}


/* ==========================================================================
   ADMIN DASHBOARD RESPONSIVE NAVIGATION & PROFILE DROPDOWN CONTROLLER
   ========================================================================== */
function initAdminDashboardNavigation() {
  const hamburgerBtn = document.getElementById('adminHamburgerBtn');
  const sidebar = document.getElementById('adminSidebar') || document.querySelector('.admin-sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  const closeBtn = document.getElementById('adminSidebarCloseBtn');
  const profileBtn = document.getElementById('adminProfileBtn') || document.querySelector('.admin-user-profile');
  const profileDropdown = document.getElementById('adminProfileDropdown');

  // Load user name, email, role
  const savedName = localStorage.getItem('stackly_user_name') || 'Marcus Vance';
  const savedEmail = localStorage.getItem('stackly_user_email') || 'admin.vance@gmail.com';
  const savedInitials = localStorage.getItem('stackly_user_initials') || 'MV';

  // 1. Sync dropdown information
  const nameEl = document.getElementById('adminDropdownUserName');
  const emailEl = document.getElementById('adminDropdownUserEmail');
  const avatarEl = document.querySelector('.admin-profile-dropdown .profile-card-avatar');
  if (nameEl) nameEl.textContent = savedName;
  if (emailEl) emailEl.textContent = savedEmail;
  if (avatarEl) avatarEl.textContent = savedInitials;

  // 2. Open / Close Sidebar Drawer
  function openSidebar() {
    if (sidebar) sidebar.classList.add('sidebar-open');
    if (backdrop) backdrop.classList.add('active');
    document.body.classList.add('sidebar-drawer-open');
    document.documentElement.classList.add('sidebar-drawer-open');
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('sidebar-open');
    if (backdrop) backdrop.classList.remove('active');
    document.body.classList.remove('sidebar-drawer-open');
    document.documentElement.classList.remove('sidebar-drawer-open');
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sidebar && sidebar.classList.contains('sidebar-open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeSidebar();
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', () => {
      closeSidebar();
    });
  }

  // Close sidebar on link click on mobile
  if (sidebar) {
    sidebar.querySelectorAll('.admin-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 1024) {
          closeSidebar();
        }
      });
    });
  }

  // 3. Profile Dropdown Toggle
  if (profileBtn && profileDropdown) {
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle('profile-open');
    });

    profileDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // 4. Global Click to Close Dropdown & Sidebar
  document.addEventListener('click', (e) => {
    if (profileDropdown && profileDropdown.classList.contains('profile-open')) {
      if (!profileDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
        profileDropdown.classList.remove('profile-open');
      }
    }
  });

  // 5. Escape key listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSidebar();
      if (profileDropdown) profileDropdown.classList.remove('profile-open');
    }
  });

  // 6. Reset on resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
      closeSidebar();
    }
  });
}
