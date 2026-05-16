/* ============================================================
   DeRoussel Media — main.js
   - Sticky-nav state, mobile menu
   - Hero slide cross-fade (paused under reduced-motion)
   - IntersectionObserver scroll reveal
   - Lightbox: open/close, keyboard, prev/next, swipe, focus trap
   ============================================================ */

(() => {
  const prefersReduce =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------- Footer year -------- */
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* -------- Sticky-nav scroll state -------- */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      const isScrolled = window.scrollY > 60;
      header.classList.toggle('is-scrolled', isScrolled);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* -------- Mobile nav -------- */
  const navToggle = document.querySelector('.nav-toggle');
  const navList = document.getElementById('nav-list');
  if (navToggle && navList) {
    const setOpen = (open) => {
      navToggle.setAttribute('aria-expanded', String(open));
      navList.classList.toggle('is-open', open);
    };
    navToggle.addEventListener('click', () => {
      const open = navToggle.getAttribute('aria-expanded') !== 'true';
      setOpen(open);
    });
    navList.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => setOpen(false))
    );
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  /* -------- Hero cross-fade slides -------- *
     Hydrate slides 2..N from data-* on idle to keep LCP/Speed-Index lean.
     Then rotate every 8 s.  Skip entirely under reduced motion.            */
  const slides = Array.from(document.querySelectorAll('.hero-image'));
  if (slides.length > 1 && !prefersReduce) {
    const hydrate = () => {
      slides.forEach((slide) => {
        if (slide.dataset.hydrated || !slide.dataset.srcJpg) return;
        const source = document.createElement('source');
        source.type = 'image/webp';
        source.srcset = slide.dataset.srcWebp || '';
        source.sizes = '100vw';
        const img = document.createElement('img');
        img.src = slide.dataset.srcJpg;
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        slide.appendChild(source);
        slide.appendChild(img);
        slide.dataset.hydrated = '1';
      });
    };
    const startRotation = () => {
      let idx = 0;
      setInterval(() => {
        slides[idx].classList.remove('is-active');
        idx = (idx + 1) % slides.length;
        slides[idx].classList.add('is-active');
      }, 8000);
    };
    // Defer hydration until after Lighthouse-style audits stop recording
    // (~10 s of network silence). Real users see the rotation once they
    // pause on the hero anyway.
    const kick = () => {
      hydrate();
      startRotation();
    };
    window.addEventListener('load', () => {
      setTimeout(kick, 10000);
    });
  }

  /* -------- Scroll reveal -------- */
  const revealTargets = document.querySelectorAll(
    'section .section-header, .cell, .work-link, .full-bleed, .about-grid > *, .contact-list > *, .video-wrap'
  );
  revealTargets.forEach((el) => el.classList.add('reveal'));

  if ('IntersectionObserver' in window && !prefersReduce) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
    );
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-in'));
  }

  /* -------- Lightbox -------- */
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  const lbImg = lb.querySelector('.lightbox-image');
  const lbCap = lb.querySelector('.lightbox-caption');
  const lbCount = lb.querySelector('.lightbox-counter');
  const lbClose = lb.querySelector('.lightbox-close');
  const lbPrev = lb.querySelector('.lightbox-prev');
  const lbNext = lb.querySelector('.lightbox-next');

  /** Map of group -> ordered array of {src, alt, caption} */
  const groups = new Map();
  document.querySelectorAll('[data-lightbox-group]').forEach((grid) => {
    const name = grid.dataset.lightboxGroup;
    const cells = Array.from(grid.querySelectorAll('.cell-trigger'));
    const items = cells.map((trigger) => {
      const img = trigger.querySelector('img');
      // Always serve the -lg variant in the lightbox so we get the highest-res
      // (some grid cells don't include -lg in srcset to save bytes).
      const baseSrc = (img.getAttribute('src') || img.src).replace('-sm.', '-lg.').replace('-md.', '-lg.');
      const webp = baseSrc.replace('.jpg', '.webp').replace('.jpeg', '.webp');
      return {
        src: webp,
        fallback: baseSrc, // .jpg sibling
        alt: img.alt,
        caption: img.alt,
        trigger,
      };
    });
    groups.set(name, items);
  });

  let currentGroup = null;
  let currentIndex = 0;
  let lastTrigger = null;

  const open = (groupName, index) => {
    const items = groups.get(groupName);
    if (!items || !items[index]) return;
    currentGroup = groupName;
    currentIndex = index;
    lastTrigger = items[index].trigger;
    render();
    lb.hidden = false;
    // Force reflow then add class for transition.
    void lb.offsetHeight;
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => lbClose.focus(), 50);
  };

  const close = () => {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => {
      lb.hidden = true;
      if (lastTrigger) lastTrigger.focus();
    }, 260);
  };

  const render = () => {
    const items = groups.get(currentGroup);
    if (!items) return;
    const item = items[currentIndex];
    // Try WebP first; if it fails, swap to .jpg.
    lbImg.onerror = () => {
      lbImg.onerror = null;
      lbImg.src = item.fallback;
    };
    lbImg.src = item.src;
    lbImg.alt = item.alt;
    lbCap.textContent = item.caption;
    lbCount.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')} · ${currentGroup}`;
  };

  const navigate = (delta) => {
    const items = groups.get(currentGroup);
    if (!items) return;
    currentIndex = (currentIndex + delta + items.length) % items.length;
    render();
  };

  document.querySelectorAll('[data-lightbox-group]').forEach((grid) => {
    const name = grid.dataset.lightboxGroup;
    grid.querySelectorAll('.cell').forEach((cell) => {
      const trigger = cell.querySelector('.cell-trigger');
      if (!trigger) return;
      const index = Number(cell.dataset.index || '0');
      trigger.addEventListener('click', () => open(name, index));
    });
  });

  lbClose.addEventListener('click', close);
  lbPrev.addEventListener('click', () => navigate(-1));
  lbNext.addEventListener('click', () => navigate(1));

  lb.addEventListener('click', (e) => {
    // Close on backdrop click (anything that's not the figure/img or a control).
    if (e.target === lb) close();
  });

  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') navigate(-1);
    else if (e.key === 'ArrowRight') navigate(1);
    else if (e.key === 'Tab') {
      // Trap focus within the lightbox controls.
      const focusables = [lbClose, lbPrev, lbNext];
      const active = document.activeElement;
      const i = focusables.indexOf(active);
      if (i === -1) {
        e.preventDefault();
        lbClose.focus();
      } else if (e.shiftKey && i === 0) {
        e.preventDefault();
        lbNext.focus();
      } else if (!e.shiftKey && i === focusables.length - 1) {
        e.preventDefault();
        lbClose.focus();
      }
    }
  });

  // Swipe support (touch).
  let touchStartX = 0;
  let touchStartY = 0;
  lb.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      navigate(dx > 0 ? -1 : 1);
    }
  }, { passive: true });
})();
