(() => {
  'use strict';

  // ─── Config ──────────────────────────────────────────
  const FRAME_COUNT  = 250;
  const FRAME_SPEED  = 2.0;
  const IMAGE_SCALE  = 0.85;
  const FRAME_PREFIX = './Comp%201_';
  const FRAME_EXT    = '.webp';

  function framePath(i) {
    return FRAME_PREFIX + String(i).padStart(5, '0') + FRAME_EXT;
  }

  // ─── State ───────────────────────────────────────────
  const frames = new Array(FRAME_COUNT).fill(null);
  let currentFrame   = 0;
  let currentBgColor = '#f0ebe2';
  let bgSampleTimer  = 0;
  let rafPending     = false;
  let lang           = 'sr';

  // ─── DOM refs ────────────────────────────────────────
  const canvasWrap     = document.getElementById('canvas-wrap');
  const canvas         = document.getElementById('canvas');
  const ctx            = canvas.getContext('2d');
  const hero           = document.getElementById('hero');
  const marqueeWrap    = null;
  const marqueeText    = null;
  const scrollCont     = document.getElementById('scroll-container');
  const menuSection    = document.getElementById('menu-section');
  const bookingSection = document.getElementById('booking-section');

  // ─── Canvas resize ───────────────────────────────────
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);
    drawFrame(currentFrame);
  }
  window.addEventListener('resize', resizeCanvas);

  // ─── BG color sampler ────────────────────────────────
  function sampleBgColor(img) {
    try {
      const tmp = document.createElement('canvas');
      tmp.width = tmp.height = 4;
      const tc = tmp.getContext('2d');
      tc.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, 4, 4);
      const d = tc.getImageData(0, 0, 1, 1).data;
      return `rgb(${d[0]},${d[1]},${d[2]})`;
    } catch (e) {
      return '#f0ebe2';
    }
  }

  // ─── Draw frame ──────────────────────────────────────
  function drawFrame(index) {
    const img = frames[index];
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.fillStyle = currentBgColor;
    ctx.fillRect(0, 0, w, h);
    if (!img) return;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(w / iw, h / ih) * IMAGE_SCALE;
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function scheduleFrame(index) {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      drawFrame(index);
    });
  }

  // ─── Frame loader (background, no UI) ───────────────
  function loadImage(i) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        frames[i] = img;
        bgSampleTimer++;
        if (bgSampleTimer % 10 === 0) {
          currentBgColor = sampleBgColor(img);
          document.documentElement.style.setProperty('--page-bg', currentBgColor);
        }
        if (i === currentFrame) scheduleFrame(currentFrame);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = framePath(i);
    });
  }

  function start() {
    resizeCanvas();
    init();
    // Load all frames silently in the background
    for (let i = 0; i < FRAME_COUNT; i++) loadImage(i);
  }

  // ─── Init ────────────────────────────────────────────
  function init() {
    setDateMin();
    initLenis();
    initHeroWords();
    initScrollEffects();
    initFrameScrub();
    initSections();
    initMarquee();
    initProgressiveBlur();
    initLanguageToggle();
    initTimeSlots();
    initBookingForm();
    initThreeDotMenu();
    initNavTheme();
    initHorizontalGallery();
    ScrollTrigger.refresh();
  }

  // ─── Horizontal cinematic gallery ─────────────────────
  function initHorizontalGallery() {
    const track = document.getElementById('gallery-track');
    if (!track) return;
    const slides = Array.from(track.querySelectorAll('.gallery-slide'));
    if (!slides.length) return;
    const curEl = document.getElementById('gallery-current');
    const totEl = document.getElementById('gallery-total');
    if (totEl) totEl.textContent = String(slides.length).padStart(2, '0');

    let lastIdx = -1;
    let pending = false;
    const PARALLAX = 8;

    function update() {
      pending = false;
      const tr = track.getBoundingClientRect();
      const trackCenter = tr.left + tr.width / 2;
      let closestIdx = 0;
      let closestDist = Infinity;
      slides.forEach((slide, i) => {
        const r = slide.getBoundingClientRect();
        const c = r.left + r.width / 2;
        const dist = c - trackCenter;
        const abs = Math.abs(dist);
        if (abs < closestDist) { closestDist = abs; closestIdx = i; }
        const norm = Math.max(-1, Math.min(1, dist / (tr.width / 2)));
        const img = slide.firstElementChild;
        if (img) img.style.transform = `translate3d(${-norm * PARALLAX}%, 0, 0)`;
      });
      if (closestIdx !== lastIdx) {
        lastIdx = closestIdx;
        if (curEl) curEl.textContent = String(closestIdx + 1).padStart(2, '0');
      }
    }
    function schedule() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(update);
    }

    track.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    // Drag-to-scroll (mouse only — touch works natively)
    let isDown = false, startX = 0, startScroll = 0, moved = false;
    track.addEventListener('mousedown', e => {
      isDown = true;
      moved  = false;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      track.classList.add('is-grabbing');
      track.style.scrollSnapType = 'none';
    });
    window.addEventListener('mousemove', e => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) moved = true;
      track.scrollLeft = startScroll - dx;
    });
    window.addEventListener('mouseup', () => {
      if (!isDown) return;
      isDown = false;
      track.classList.remove('is-grabbing');
      track.style.scrollSnapType = '';
    });
    track.addEventListener('click', e => { if (moved) e.preventDefault(); }, true);

    // Reveal on scroll into view
    const header = track.parentElement.querySelector('.gallery-section-header');
    if (header) {
      gsap.from(header.children, {
        scrollTrigger: { trigger: header, start: 'top 82%' },
        y: 40, opacity: 0, stagger: 0.12, duration: 0.9, ease: 'power3.out'
      });
    }
    gsap.from(slides.slice(0, 3), {
      scrollTrigger: { trigger: track, start: 'top 85%' },
      y: 60, opacity: 0, stagger: 0.1, duration: 1.0, ease: 'power3.out'
    });

    update();
  }

  // ─── Set date minimum to today ───────────────────────
  function setDateMin() {
    const dateInput = document.getElementById('field-date');
    if (!dateInput) return;
    const today = new Date();
    const yyyy  = today.getFullYear();
    const mm    = String(today.getMonth() + 1).padStart(2, '0');
    const dd    = String(today.getDate()).padStart(2, '0');
    dateInput.min = `${yyyy}-${mm}-${dd}`;
  }

  // ─── Lenis smooth scroll ─────────────────────────────
  function initLenis() {
    const lenis = new Lenis({
      duration: 1.2,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // ─── Hero word entrance ───────────────────────────────
  function initHeroWords() {
    const words = hero ? hero.querySelectorAll('.word') : [];
    if (!words.length) return;
    gsap.fromTo(words,
      { y: 80, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.12, duration: 1.1, ease: 'power3.out', delay: 0.3 }
    );
    const tagline = hero.querySelector('.hero-tagline');
    if (tagline) gsap.fromTo(tagline, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.7 });
    const heroBottom = hero.querySelector('.hero-bottom');
    if (heroBottom) gsap.fromTo(heroBottom, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power2.out', delay: 1.1 });
  }

  // ─── Main scroll effects: hero/canvas crossfade + floating buttons ─
  function initScrollEffects() {
    if (!scrollCont) return;
    ScrollTrigger.create({
      trigger: scrollCont,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: self => {
        const p = self.progress;

        // Hero fades out immediately on scroll
        if (hero) hero.style.opacity = Math.max(0, 1 - p * 35).toString();

        // Canvas fades in immediately as hero fades out
        canvasWrap.style.opacity = Math.min(1, p * 35).toString();

        updateFloatingButtons(p);
      }
    });
  }

  // ─── Floating buttons ─────────────────────────────────
  // Chapter map: 8-22 / 28-42 / 48-58 (centered quote) / 64-76 / 82-94 (centered hours)
  // Book button (bottom-center) hides during the centered chapters to avoid overlap.
  // Location button (bottom-left) is safe alongside the right-aligned chapter 004.
  function updateFloatingButtons(p) {
    const floatBook = document.getElementById('float-book');
    const floatLoc  = document.getElementById('float-location');

    // Book: visible 24-46% (between ch1 leave and ch3 enter; ch2 is right-aligned so no overlap)
    if (floatBook) {
      let op = 0, ty = 24;
      if      (p >= 0.24 && p < 0.28) { const t = (p - 0.24) / 0.04; op = t; ty = 24 * (1 - t); }
      else if (p >= 0.28 && p < 0.44) { op = 1; ty = 0; }
      else if (p >= 0.44 && p < 0.48) { const t = (p - 0.44) / 0.04; op = 1 - t; ty = 0; }
      floatBook.style.opacity       = op.toString();
      floatBook.style.transform     = `translateY(${ty}px)`;
      floatBook.style.pointerEvents = op > 0.05 ? 'auto' : 'none';
    }

    // Location: visible 60-80% (alongside right-aligned chapter 004)
    if (floatLoc) {
      let op = 0, tx = -30;
      if      (p >= 0.60 && p < 0.64) { const t = (p - 0.60) / 0.04; op = t; tx = -30 * (1 - t); }
      else if (p >= 0.64 && p < 0.78) { op = 1; tx = 0; }
      else if (p >= 0.78 && p < 0.82) { const t = (p - 0.78) / 0.04; op = 1 - t; tx = 0; }
      floatLoc.style.opacity       = op.toString();
      floatLoc.style.transform     = `translateX(${tx}px)`;
      floatLoc.style.pointerEvents = op > 0.05 ? 'auto' : 'none';
    }
  }

  // ─── Frame scrub ─────────────────────────────────────
  function initFrameScrub() {
    if (!scrollCont) return;
    ScrollTrigger.create({
      trigger: scrollCont,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: self => {
        const accelerated = Math.min(self.progress * FRAME_SPEED, 1);
        const index = Math.min(Math.floor(accelerated * FRAME_COUNT), FRAME_COUNT - 1);
        if (index !== currentFrame) {
          currentFrame = index;
          scheduleFrame(currentFrame);
        }
      }
    });
  }

  // ─── Section positioning ─────────────────────────────
  function positionSection(section) {
    const enter = parseFloat(section.dataset.enter) / 100;
    const leave  = parseFloat(section.dataset.leave)  / 100;
    const mid    = (enter + leave) / 2;
    const totalH = scrollCont.offsetHeight;
    const vh     = window.innerHeight;
    section.style.top     = (mid * totalH - vh / 2) + 'px';
    section.style.height  = vh + 'px';
    section.style.display = 'flex';
    section.style.alignItems = 'center';
  }

  function setupSectionAnimation(section) {
    const type    = section.dataset.animation;
    const persist = section.dataset.persist === 'true';
    const enter   = parseFloat(section.dataset.enter) / 100;
    const leave   = parseFloat(section.dataset.leave)  / 100;
    const children = Array.from(section.querySelectorAll(
      '.section-label, .section-heading, .section-body, .section-note, .cta-button'
    ));

    const tl = gsap.timeline({ paused: true });
    const sOpts = { stagger: 0.13, duration: 0.9, ease: 'power3.out' };

    switch (type) {
      case 'slide-left':  tl.from(children, { x: -80, opacity: 0, ...sOpts }); break;
      case 'slide-right': tl.from(children, { x: 80,  opacity: 0, ...sOpts }); break;
      case 'scale-up':    tl.from(children, { scale: 0.85, opacity: 0, stagger: 0.12, duration: 1.0, ease: 'power2.out' }); break;
      default:            tl.from(children, { y: 40, opacity: 0, ...sOpts });
    }

    let hasPlayed = false;
    const fadeRange = 0.025;

    ScrollTrigger.create({
      trigger: scrollCont,
      start: 'top top',
      end: 'bottom bottom',
      scrub: false,
      onUpdate: self => {
        const p = self.progress;
        if (p >= enter && p <= leave) {
          section.style.opacity = '1';
          section.classList.add('is-visible');
          if (!hasPlayed) { hasPlayed = true; tl.restart(); }
        } else if (p < enter && p >= enter - fadeRange) {
          section.style.opacity = ((p - (enter - fadeRange)) / fadeRange).toString();
        } else if (!persist && p > leave && p <= leave + fadeRange) {
          section.style.opacity = (1 - (p - leave) / fadeRange).toString();
          if (p > leave + fadeRange * 0.5) hasPlayed = false;
        } else if (p < enter - fadeRange || (!persist && p > leave + fadeRange)) {
          section.style.opacity = '0';
          section.classList.remove('is-visible');
          if (!persist) hasPlayed = false;
        } else if (persist && p > leave) {
          section.style.opacity = '1';
          section.classList.add('is-visible');
        }
      }
    });
  }

  function initSections() {
    if (!scrollCont) return;
    document.querySelectorAll('.scroll-section').forEach(s => {
      positionSection(s);
      setupSectionAnimation(s);
    });
  }

  function initMarquee() { /* marquee removed */ }

  // ─── Progressive blur: fast 4px → 22px through menu+booking ─
  function initProgressiveBlur() {
    if (!menuSection || !bookingSection) return;
    function updateBlur() {
      const menuTop    = menuSection.offsetTop;
      const bookingBot = bookingSection.offsetTop + bookingSection.offsetHeight;
      const sy = window.scrollY;
      let blur = 0;
      if (sy >= menuTop) {
        const t = Math.min(1, (sy - menuTop) / (bookingBot - menuTop));
        blur = 4 + t * 18;
      }
      canvas.style.filter = blur > 0.5 ? `blur(${blur.toFixed(1)}px)` : '';
    }
    window.addEventListener('scroll', updateBlur, { passive: true });
    updateBlur();
  }

  // ─── Nav theme: dark text after hero, revert at about/footer ──
  function initNavTheme() {
    const header          = document.querySelector('.site-header');
    const aboutSection    = document.getElementById('about-section');
    const locationSection = document.getElementById('location-section');
    if (!header) return;

    function updateTheme() {
      const sy      = window.scrollY;
      const heroBot = hero ? hero.offsetHeight : window.innerHeight;
      const aboutTop  = aboutSection    ? aboutSection.offsetTop    - 80 : Infinity;
      const locTop    = locationSection ? locationSection.offsetTop - 80 : Infinity;
      const footerTop = document.querySelector('.site-footer')
        ? document.querySelector('.site-footer').offsetTop - 80 : Infinity;

      // Light (dark text): canvas phase + menu + booking, and location section
      // Dark (cream text): hero, about, footer
      let isLight = false;
      if (sy >= heroBot  && sy < aboutTop)   isLight = true;
      if (sy >= locTop   && sy < footerTop)  isLight = true;

      header.classList.toggle('is-light', isLight);
    }
    window.addEventListener('scroll', updateTheme, { passive: true });
    updateTheme();
  }

  // ─── Three-dot nav overlay ────────────────────────────
  function initThreeDotMenu() {
    const threeDots  = document.getElementById('three-dots');
    const navOverlay = document.getElementById('nav-overlay');
    const navClose   = document.getElementById('nav-close');
    if (!threeDots || !navOverlay) return;

    function openOverlay() {
      navOverlay.classList.add('open');
      navOverlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('nav-open');
    }
    function closeOverlay() {
      navOverlay.classList.remove('open');
      navOverlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('nav-open');
    }

    threeDots.addEventListener('click', openOverlay);
    if (navClose) navClose.addEventListener('click', closeOverlay);

    navOverlay.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => closeOverlay());
    });

    // Close on backdrop click
    navOverlay.addEventListener('click', e => {
      if (e.target === navOverlay) closeOverlay();
    });
  }

  // ─── Language toggle ──────────────────────────────────
  function applyLanguage(targetLang) {
    lang = targetLang;
    document.querySelectorAll('[data-sr][data-en]').forEach(el => {
      const val = lang === 'sr' ? el.dataset.sr : el.dataset.en;
      if (val === undefined) return;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = val;
      } else if (el !== document.getElementById('lang-btn')) {
        el.textContent = val;
      }
    });
    document.querySelectorAll('.price').forEach(el => {
      el.textContent = lang === 'sr'
        ? el.dataset.rsd + ' RSD'
        : '$' + el.dataset.usd;
    });
    // Hero heading word-by-word
    const heroH1 = document.querySelector('.hero-heading');
    if (heroH1) {
      const words = heroH1.querySelectorAll('.word');
      const key   = lang === 'sr' ? heroH1.dataset.srWords : heroH1.dataset.enWords;
      if (key) {
        const newWords = key.split('|');
        words.forEach((w, i) => { if (newWords[i] !== undefined) w.textContent = newWords[i]; });
      }
    }
    // Form subject
    const subj = document.querySelector('[name="subject"]');
    if (subj) subj.value = lang === 'sr' ? 'Nova rezervacija — danyzcafe' : 'New Reservation — danyzcafe';
    document.documentElement.lang = lang === 'sr' ? 'sr' : 'en';
    const btn = document.getElementById('lang-btn');
    if (btn) btn.textContent = lang === 'sr' ? 'EN' : 'SR';
  }

  function initLanguageToggle() {
    const btn = document.getElementById('lang-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      applyLanguage(lang === 'sr' ? 'en' : 'sr');
    });
  }

  // ─── Booking storage ──────────────────────────────────
  const BOOKING_KEY = 'danyzcafe_bookings';

  function getBookedTimes(date) {
    try {
      const data = JSON.parse(localStorage.getItem(BOOKING_KEY) || '{}');
      return Array.isArray(data[date]) ? data[date] : [];
    } catch { return []; }
  }

  function saveBooking(date, time) {
    try {
      const data = JSON.parse(localStorage.getItem(BOOKING_KEY) || '{}');
      if (!Array.isArray(data[date])) data[date] = [];
      if (!data[date].includes(time)) data[date].push(time);
      localStorage.setItem(BOOKING_KEY, JSON.stringify(data));
    } catch {}
  }

  // ─── Time slots ───────────────────────────────────────
  function initTimeSlots() {
    const grid      = document.getElementById('time-slots');
    if (!grid) return;
    const timeInput = document.getElementById('field-time');
    const timeErr   = document.getElementById('err-time');
    const dateInput = document.getElementById('field-date');

    function renderSlots(date) {
      grid.innerHTML = '';
      if (timeInput) timeInput.value = '';
      const taken = date ? getBookedTimes(date) : [];

      for (let h = 8; h < 21; h++) {
        ['00', '30'].forEach(m => {
          const time = `${String(h).padStart(2, '0')}:${m}`;
          const btn  = document.createElement('button');
          btn.type        = 'button';
          btn.className   = 'time-slot';
          btn.textContent = time;
          if (taken.includes(time)) {
            btn.disabled = true;
            btn.classList.add('taken');
            btn.title = lang === 'sr' ? 'Zauzeto' : 'Unavailable';
          } else {
            btn.addEventListener('click', () => {
              grid.querySelectorAll('.time-slot.selected').forEach(b => b.classList.remove('selected'));
              btn.classList.add('selected');
              if (timeInput) timeInput.value = time;
              if (timeErr)   timeErr.textContent = '';
            });
          }
          grid.appendChild(btn);
        });
      }
    }

    renderSlots(dateInput ? dateInput.value : '');
    if (dateInput) dateInput.addEventListener('change', () => renderSlots(dateInput.value));
  }

  // ─── Booking form ─────────────────────────────────────
  function initBookingForm() {
    const form = document.getElementById('booking-form');
    if (!form) return;

    const M = {
      required: { sr: 'Ovo polje je obavezno.',           en: 'This field is required.'            },
      email:    { sr: 'Unesite ispravnu email adresu.',   en: 'Please enter a valid email.'        },
      phone:    { sr: 'Unesite ispravan broj telefona.',  en: 'Please enter a valid phone number.' },
      date:     { sr: 'Izaberite današnji ili budući datum.', en: 'Please select today or a future date.' },
      time:     { sr: 'Izaberite vreme rezervacije.',     en: 'Please select a reservation time.'  },
      sending:  { sr: 'Slanje...',                        en: 'Sending...'                         },
      success:  { sr: 'Hvala! Vaša rezervacija je primljena. Kontaktiraćemo vas uskoro za potvrdu.',
                  en: "Thank you! Your reservation has been received. We'll contact you shortly to confirm." },
      error:    { sr: 'Greška pri slanju. Pokušajte ponovo.', en: 'Error sending. Please try again.' }
    };

    function setErr(errId, fieldId, key) {
      const errEl = document.getElementById(errId);
      const field = fieldId ? document.getElementById(fieldId) : null;
      if (errEl) errEl.textContent = M[key][lang];
      if (field) field.classList.add('error');
    }
    function clearErr(field, errEl) {
      if (field) field.classList.remove('error');
      if (errEl) errEl.textContent = '';
    }

    ['field-name','field-email','field-phone','field-date'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => clearErr(el, document.getElementById(id.replace('field-', 'err-'))));
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      let valid = true;

      const fName  = document.getElementById('field-name');
      const fEmail = document.getElementById('field-email');
      const fPhone = document.getElementById('field-phone');
      const fDate  = document.getElementById('field-date');
      const fTime  = document.getElementById('field-time');

      ['name','email','phone','date'].forEach(k => {
        clearErr(document.getElementById('field-' + k), document.getElementById('err-' + k));
      });
      const timeErrEl = document.getElementById('err-time');
      if (timeErrEl) timeErrEl.textContent = '';

      if (!fName || !fName.value.trim() || fName.value.trim().length < 2) {
        setErr('err-name', 'field-name', 'required'); valid = false;
      }
      if (!fEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fEmail.value.trim())) {
        setErr('err-email', 'field-email', 'email'); valid = false;
      }
      if (!fPhone || fPhone.value.replace(/\D/g,'').length < 6) {
        setErr('err-phone', 'field-phone', 'phone'); valid = false;
      }
      if (!fDate || !fDate.value) {
        setErr('err-date', 'field-date', 'required'); valid = false;
      } else {
        const chosen = new Date(fDate.value + 'T00:00:00');
        const today  = new Date(); today.setHours(0,0,0,0);
        if (chosen < today) { setErr('err-date', 'field-date', 'date'); valid = false; }
      }
      if (!fTime || !fTime.value) {
        if (timeErrEl) timeErrEl.textContent = M.time[lang]; valid = false;
      }

      if (!valid) {
        const firstErr = form.querySelector('.error, [id^="err-"]:not(:empty)');
        if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const submitBtn = document.getElementById('submit-btn');
      const btnTextEl = submitBtn ? submitBtn.querySelector('[data-sr]') : null;
      const origText  = btnTextEl ? btnTextEl.textContent : '';
      if (btnTextEl) btnTextEl.textContent = M.sending[lang];
      if (submitBtn) submitBtn.disabled = true;

      try {
        const res  = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: new FormData(form)
        });
        const json = await res.json();
        if (json.success) {
          const dateVal = fDate ? fDate.value : '';
          const timeVal = fTime ? fTime.value : '';
          if (dateVal && timeVal) saveBooking(dateVal, timeVal);
          form.style.display = 'none';
          const successEl = document.getElementById('booking-success');
          if (successEl) {
            successEl.classList.remove('hidden');
            const msgEl = successEl.querySelector('p');
            if (msgEl) msgEl.textContent = M.success[lang];
          }
        } else {
          throw new Error('Web3Forms error');
        }
      } catch {
        if (btnTextEl) btnTextEl.textContent = origText;
        if (submitBtn) submitBtn.disabled = false;
        const successEl = document.getElementById('booking-success');
        if (successEl) {
          successEl.classList.remove('hidden');
          successEl.classList.add('error-state');
          const msgEl = successEl.querySelector('p');
          if (msgEl) msgEl.textContent = M.error[lang];
          const iconEl = successEl.querySelector('.success-icon');
          if (iconEl) { iconEl.textContent = '✕'; iconEl.style.background = 'var(--error)'; }
        }
      }
    });
  }

  // ─── Start ───────────────────────────────────────────
  start();

})();
