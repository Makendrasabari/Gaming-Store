/**
 * STACKLY GAMING STORE - AUTHENTICATION SCRIPT (auth.js)
 * Clean two-column Login & Signup validation, role-based navigation,
 * strict @gmail.com email format validation, and dynamic initials extraction.
 */

// Standard Email format validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GMAIL_REGEX = EMAIL_REGEX;

// Helper: Extract uppercase initials and formatted name from email or name string
function extractNameAndInitials(emailOrName) {
  if (!emailOrName) return { name: 'Player', initials: 'PL' };

  let raw = emailOrName.trim();
  // If email format, take username portion before @
  if (raw.includes('@')) {
    raw = raw.split('@')[0];
  }

  // Split on dots, underscores, dashes, or whitespace
  const parts = raw.replace(/[._-]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const formatted = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    const inits = (parts[0][0] + parts[1][0]).toUpperCase();
    return { name: formatted, initials: inits };
  } else if (parts.length === 1 && parts[0].length > 0) {
    const p = parts[0];
    const formatted = p.charAt(0).toUpperCase() + p.slice(1);
    const inits = p.length >= 2 ? p.slice(0, 2).toUpperCase() : p.charAt(0).toUpperCase();
    return { name: formatted, initials: inits };
  }
  return { name: 'Player', initials: 'PL' };
}

// Helper: Extract uppercase initials from full name
function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  } else if (parts.length === 1 && parts[0].length > 0) {
    return parts[0][0].toUpperCase();
  }
  return 'U';
}

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     1. LOGIN FORM CONTROLLER
     ========================================================================== */
  const loginForm = document.getElementById('stackly-login-form');
  if (loginForm) {
    const emailInput = document.getElementById('login-email') || document.getElementById('login-name');
    const passwordInput = document.getElementById('login-password');
    const roleBtns = loginForm.querySelectorAll('.role-card-btn');
    
    const emailError = document.getElementById('email-val-error') || document.getElementById('name-val-error');
    const passwordError = document.getElementById('password-val-error');
    const roleError = document.getElementById('role-val-error');

    let selectedRole = '';

    // Do NOT prefill default email - keep input empty so placeholder shows
    if (emailInput) {
      emailInput.value = '';
    }

    // Role selection handler
    roleBtns.forEach(btn => {
      if (btn.classList.contains('selected')) {
        selectedRole = btn.getAttribute('data-role');
      }

      const selectThis = () => {
        roleBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedRole = btn.getAttribute('data-role');
        if (roleError) roleError.classList.remove('visible');
      };

      btn.addEventListener('click', selectThis);
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectThis();
        }
      });
    });

    // Clear validation error on typing
    if (emailInput) {
      emailInput.addEventListener('input', () => {
        emailInput.classList.remove('input-error');
        if (emailError) emailError.classList.remove('visible');
      });
    }

    if (passwordInput) {
      passwordInput.addEventListener('input', () => {
        passwordInput.classList.remove('input-error');
        if (passwordError) passwordError.classList.remove('visible');
      });
    }

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let hasError = false;

      // 1. Email Format Check (Standard valid email)
      const emailVal = emailInput ? emailInput.value.trim() : '';
      if (!emailVal) {
        if (emailInput) emailInput.classList.add('input-error');
        if (emailError) {
          emailError.textContent = 'Please enter your email address.';
          emailError.classList.add('visible');
        }
        hasError = true;
      } else if (!EMAIL_REGEX.test(emailVal)) {
        if (emailInput) emailInput.classList.add('input-error');
        if (emailError) {
          emailError.textContent = 'Please enter a valid email address.';
          emailError.classList.add('visible');
        }
        hasError = true;
      } else {
        if (emailInput) emailInput.classList.remove('input-error');
        if (emailError) emailError.classList.remove('visible');
      }

      // 2. Password Check
      const passVal = passwordInput ? passwordInput.value : '';
      if (!passVal) {
        if (passwordInput) passwordInput.classList.add('input-error');
        if (passwordError) {
          passwordError.textContent = 'Please enter your password.';
          passwordError.classList.add('visible');
        }
        hasError = true;
      } else {
        if (passwordInput) passwordInput.classList.remove('input-error');
        if (passwordError) passwordError.classList.remove('visible');
      }

      // 3. Access Role Check
      if (!selectedRole) {
        if (roleError) {
          roleError.textContent = 'Please select your access role (Customer or Admin).';
          roleError.classList.add('visible');
        }
        hasError = true;
      } else {
        if (roleError) roleError.classList.remove('visible');
      }

      if (hasError) return;

      // Calculate player display name & initials
      let displayName = '';
      let displayInitials = '';

      const savedRegisteredName = localStorage.getItem('stackly_user_name');
      const savedRegisteredEmail = localStorage.getItem('stackly_registered_email');

      if (savedRegisteredEmail && savedRegisteredEmail.toLowerCase() === emailVal.toLowerCase() && savedRegisteredName) {
        displayName = savedRegisteredName;
        displayInitials = getInitials(savedRegisteredName);
      } else {
        const extracted = extractNameAndInitials(emailVal);
        displayName = extracted.name;
        displayInitials = extracted.initials;
      }

      // Save user session in localStorage
      localStorage.setItem('stackly_user_email', emailVal);
      localStorage.setItem('stackly_user_name', displayName);
      localStorage.setItem('stackly_user_role', selectedRole);
      localStorage.setItem('stackly_user_initials', displayInitials);

      // Reset dashboard preloading flag for clean entrance
      sessionStorage.removeItem('stackly_dashboard_preloaded');
      sessionStorage.removeItem('stackly_dash_preloaded');

      // Navigate to destination dashboard
      if (selectedRole === 'customer') {
        window.location.href = 'customer-dashboard/dashboard.html';
      } else {
        window.location.href = 'admin-dashboard/dashboard.html';
      }
    });
  }

  /* ==========================================================================
     2. SIGNUP FORM CONTROLLER
     ========================================================================== */
  const signupForm = document.getElementById('stackly-signup-form');
  if (signupForm) {
    const nameInput = document.getElementById('signup-name');
    const emailInput = document.getElementById('signup-email');
    const passwordInput = document.getElementById('signup-password');
    const confirmInput = document.getElementById('signup-confirm-password');
    const roleBtns = signupForm.querySelectorAll('.role-card-btn');
    const successToast = document.getElementById('signup-success-toast');

    const nameError = document.getElementById('signup-name-error');
    const emailError = document.getElementById('signup-email-error');
    const passwordError = document.getElementById('signup-password-error');
    const confirmError = document.getElementById('signup-confirm-error');
    const roleError = document.getElementById('signup-role-error');

    let selectedRole = 'customer'; // Default to customer

    roleBtns.forEach(btn => {
      const selectThis = () => {
        roleBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedRole = btn.getAttribute('data-role');
        if (roleError) roleError.classList.remove('visible');
      };

      btn.addEventListener('click', selectThis);
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectThis();
        }
      });
    });

    // Clear validation errors on typing
    const inputs = [
      { el: nameInput, err: nameError },
      { el: emailInput, err: emailError },
      { el: passwordInput, err: passwordError },
      { el: confirmInput, err: confirmError }
    ];

    inputs.forEach(({ el, err }) => {
      if (el) {
        el.addEventListener('input', () => {
          el.classList.remove('input-error');
          if (err) err.classList.remove('visible');
        });
      }
    });

    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let hasError = false;

      // 1. Full Name
      const nameVal = nameInput ? nameInput.value.trim() : '';
      if (!nameVal) {
        nameInput.classList.add('input-error');
        nameError.textContent = 'Please enter your full name.';
        nameError.classList.add('visible');
        hasError = true;
      }

      // 2. Email Address (Standard valid email)
      const emailVal = emailInput ? emailInput.value.trim() : '';
      if (!emailVal) {
        emailInput.classList.add('input-error');
        emailError.textContent = 'Please enter your email address.';
        emailError.classList.add('visible');
        hasError = true;
      } else if (!EMAIL_REGEX.test(emailVal)) {
        emailInput.classList.add('input-error');
        emailError.textContent = 'Please enter a valid email address.';
        emailError.classList.add('visible');
        hasError = true;
      }

      // 3. Password
      const passVal = passwordInput ? passwordInput.value : '';
      if (!passVal) {
        passwordInput.classList.add('input-error');
        passwordError.textContent = 'Please enter your password.';
        passwordError.classList.add('visible');
        hasError = true;
      }

      // 4. Confirm Password
      const confirmVal = confirmInput ? confirmInput.value : '';
      if (!confirmVal || confirmVal !== passVal) {
        confirmInput.classList.add('input-error');
        confirmError.textContent = 'Passwords do not match.';
        confirmError.classList.add('visible');
        hasError = true;
      }

      // 5. Role (Defaults to customer)
      if (!selectedRole && roleError) {
        roleError.textContent = 'Please choose your starting role.';
        roleError.classList.add('visible');
        hasError = true;
      }

      if (hasError) return;

      // Persist registered credentials
      localStorage.setItem('stackly_registered_email', emailVal);
      localStorage.setItem('stackly_user_email', emailVal);
      localStorage.setItem('stackly_user_name', nameVal);
      localStorage.setItem('stackly_user_role', selectedRole);
      localStorage.setItem('stackly_user_initials', getInitials(nameVal));

      // Show success feedback
      if (successToast) {
        successToast.classList.add('visible');
      }

      // Redirect to login page after short feedback delay
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1000);
    });
  }

});

// Global Logout Handler
function handleStacklyLogout() {
  localStorage.removeItem('stackly_user_email');
  localStorage.removeItem('stackly_user_name');
  localStorage.removeItem('stackly_user_role');
  localStorage.removeItem('stackly_user_initials');
  sessionStorage.removeItem('stackly_dashboard_preloaded');
  sessionStorage.removeItem('stackly_dash_preloaded');

  const path = window.location.pathname;
  if (path.includes('customer-dashboard') || path.includes('admin-dashboard')) {
    window.location.href = '../login.html';
  } else {
    window.location.href = 'login.html';
  }
}
