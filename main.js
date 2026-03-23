/* ─── OnlyArchitects — Scroll Interactions ─── */

(function () {
  'use strict';

  // Header scroll effect + section color detection
  const header = document.getElementById('site-header');
  const hero = document.getElementById('hero');
  const connectSection = document.getElementById('connect');
  const footer = document.getElementById('site-footer');
  let lastScroll = 0;

  function onScroll() {
    var y = window.scrollY;
    var headerBottom = y + 80;

    if (y > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Detect if header is over a dark or light section
    var heroBottom = hero.offsetTop + hero.offsetHeight;
    var connectTop = connectSection.offsetTop;
    var connectBottom = connectTop + connectSection.offsetHeight;
    var footerTop = footer.offsetTop;

    var overDark = (headerBottom < heroBottom) ||
                   (headerBottom >= connectTop && headerBottom < connectBottom) ||
                   (headerBottom >= footerTop);

    if (overDark) {
      header.classList.remove('light');
    } else {
      header.classList.add('light');
    }

    lastScroll = y;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Reveal on scroll (IntersectionObserver)
  const reveals = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );

    reveals.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // Fallback: show everything
    reveals.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  // Mobile menu toggle
  var menuToggle = document.querySelector('.menu-toggle');
  var headerNav = document.querySelector('.header-nav');

  if (menuToggle && headerNav) {
    menuToggle.addEventListener('click', function () {
      var expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!expanded));
      headerNav.classList.toggle('open');
      document.body.style.overflow = !expanded ? 'hidden' : '';
    });

    // Close menu when a nav link is clicked
    headerNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        menuToggle.setAttribute('aria-expanded', 'false');
        headerNav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // Smooth anchor scrolling with header offset
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        var offset = 80;
        var top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });
})();
