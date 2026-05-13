/* ============================================
   RENTICE — INTERACTIONS
   ============================================ */

(function () {
  'use strict';

  // ---- Navbar scroll effect ----
  const navbar = document.getElementById('navbar');

  function onScroll() {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // ---- Hamburger / mobile menu ----
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');

  hamburger.addEventListener('click', function () {
    const isOpen = hamburger.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen);
    mobileMenu.setAttribute('aria-hidden', !isOpen);
    mobileMenu.classList.toggle('open', isOpen);
  });

  // Close mobile menu when a link is clicked
  mobileMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      mobileMenu.classList.remove('open');
    });
  });

  // ---- IntersectionObserver — scroll animations ----
  const observeTargets = document.querySelectorAll('.observe-animate');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    observeTargets.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // Fallback: show all immediately
    observeTargets.forEach(function (el) {
      el.classList.add('in-view');
    });
  }

  // ---- Waitlist form ----
  const form = document.getElementById('waitlist-form');
  const confirmMsg = document.getElementById('waitlist-confirm');
  const emailInput = document.getElementById('email');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const email = emailInput.value.trim();

      if (!email || !isValidEmail(email)) {
        emailInput.focus();
        emailInput.style.borderColor = '#e05252';
        emailInput.style.boxShadow = '0 0 0 3px rgba(224,82,82,0.1)';
        return;
      }

      // Reset error state
      emailInput.style.borderColor = '';
      emailInput.style.boxShadow = '';

      // Show confirmation
      form.querySelector('.waitlist__input-group').style.display = 'none';
      confirmMsg.hidden = false;

      // Reset after 6 seconds
      setTimeout(function () {
        form.querySelector('.waitlist__input-group').style.display = '';
        confirmMsg.hidden = true;
        emailInput.value = '';
      }, 6000);
    });

    emailInput.addEventListener('input', function () {
      emailInput.style.borderColor = '';
      emailInput.style.boxShadow = '';
    });
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ---- Mock card progress bar animation ----
  const progressFill = document.querySelector('.mock-card__progress-fill');

  if (progressFill && 'IntersectionObserver' in window) {
    const progressObserver = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) {
          progressFill.style.width = '53%';
          progressObserver.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    progressObserver.observe(progressFill.closest('.mock-card'));
  }

  // ---- Smooth scroll for anchor links ----
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = navbar.offsetHeight + 8;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

})();
