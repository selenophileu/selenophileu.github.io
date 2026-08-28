(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const safeStorage = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* ignore */ } },
  };

  /* ---------- footer year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- header state on scroll ---------- */
  const header = $("#site-header");
  const hero = $(".hero");
  if (header && hero) {
    const toggleHeader = () => {
      const threshold = hero.offsetHeight - 90;
      header.classList.toggle("is-scrolled", window.scrollY > threshold);
    };
    toggleHeader();
    window.addEventListener("scroll", toggleHeader, { passive: true });
  }

  /* ---------- hero parallax (mobile/tablet only — on desktop the
     video is sized by width, not cropped, so there's no room to
     parallax without showing gaps) ---------- */
  const parallaxEl = $("[data-parallax]");
  if (
    parallaxEl &&
    window.matchMedia("(max-width: 900px)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    let ticking = false;
    const applyParallax = () => {
      const y = window.scrollY;
      if (y < window.innerHeight * 1.2) {
        parallaxEl.style.transform = `translateY(${y * 0.22}px)`;
      }
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(applyParallax); ticking = true; }
    }, { passive: true });
  }

  /* ---------- hero video (respect reduced motion) ---------- */
  const heroVideo = $(".hero__frame video");
  if (heroVideo && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    heroVideo.removeAttribute("autoplay");
    heroVideo.pause();
  }

  /* ---------- mobile menu ---------- */
  const menuBtn = $(".menu-btn");
  const mobileMenu = $(".mobile-menu");
  if (menuBtn && mobileMenu) {
    const closeMenu = () => {
      mobileMenu.classList.remove("is-open");
      menuBtn.setAttribute("aria-expanded", "false");
      document.body.classList.remove("is-locked");
    };
    const toggleMenu = () => {
      const isOpen = mobileMenu.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", String(isOpen));
      document.body.classList.toggle("is-locked", isOpen);
    };
    menuBtn.addEventListener("click", toggleMenu);
    $$("a", mobileMenu).forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mobileMenu.classList.contains("is-open")) closeMenu();
    });
  }

  /* ---------- language switcher (EN / IT) ---------- */
  const langButtons = $$(".lang__btn");
  const translatable = $$("[data-en]");
  const languageBlocks = $$("[data-language]");

  function applyLanguage(lang) {
    document.documentElement.lang = lang;
    langButtons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.lang === lang));
    translatable.forEach((el) => {
      const value = lang === "it" ? el.dataset.it : el.dataset.en;
      if (value == null) return;
      if (el.dataset.html === "true") el.innerHTML = value;
      else el.textContent = value;
    });
    languageBlocks.forEach((el) => { el.hidden = el.dataset.language !== lang; });
    safeStorage.set("site-lang", lang);
  }

  langButtons.forEach((btn) => btn.addEventListener("click", () => applyLanguage(btn.dataset.lang)));

  const preferredLang =
    safeStorage.get("site-lang") ||
    (navigator.language && navigator.language.toLowerCase().startsWith("it") ? "it" : "en");
  applyLanguage(preferredLang === "it" ? "it" : "en");

  /* ---------- lightbox gallery ---------- */
  const frames = $$(".frame");
  const lightbox = $(".lightbox");

  if (frames.length && lightbox) {
    const stageImg = $(".lightbox__stage img", lightbox);
    const counter = $(".lightbox__count", lightbox);
    const closeBtn = $(".lightbox__close", lightbox);
    const prevBtn = $(".lightbox__nav--prev", lightbox);
    const nextBtn = $(".lightbox__nav--next", lightbox);
    let index = 0;
    let lastFocused = null;

    function render() {
      const frame = frames[index];
      const src = frame.dataset.full || $("img", frame).src;
      const alt = $("img", frame).alt || "Alessia Laghi";
      stageImg.classList.remove("is-loaded");
      const preload = new Image();
      preload.onload = () => {
        stageImg.src = src;
        stageImg.alt = alt;
        requestAnimationFrame(() => stageImg.classList.add("is-loaded"));
      };
      preload.src = src;
      if (counter) counter.textContent = `${index + 1} / ${frames.length}`;
    }

    function open(i) {
      index = i;
      lastFocused = document.activeElement;
      render();
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("is-locked");
      closeBtn.focus();
    }

    function close() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-locked");
      if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
    }

    function next() { index = (index + 1) % frames.length; render(); }
    function prev() { index = (index - 1 + frames.length) % frames.length; render(); }

    frames.forEach((frame, i) => frame.addEventListener("click", () => open(i)));
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (nextBtn) nextBtn.addEventListener("click", next);
    if (prevBtn) prevBtn.addEventListener("click", prev);
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) close(); });
    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    });

    let touchStartX = null;
    lightbox.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener("touchend", (e) => {
      if (touchStartX == null) return;
      const delta = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(delta) > 40) delta < 0 ? next() : prev();
      touchStartX = null;
    }, { passive: true });
  }

  /* ---------- showreel video (paused, full-width preview → real size on play) ---------- */
  const showreelFrame = $(".showreel__frame");
  const showreelVideo = $(".showreel__video");
  const showreelPlay = $(".showreel__play");
  if (showreelFrame && showreelVideo && showreelPlay) {
    showreelVideo.addEventListener("loadedmetadata", () => {
      if (showreelVideo.currentTime === 0) {
        try { showreelVideo.currentTime = 0.01; } catch (e) { /* ignore */ }
      }
    });
    showreelPlay.addEventListener("click", () => {
      showreelFrame.classList.add("is-playing");
      showreelVideo.controls = true;
      showreelVideo.muted = false;
      showreelVideo.play().catch(() => {});
    });
    showreelVideo.addEventListener("ended", () => {
      showreelFrame.classList.remove("is-playing");
      showreelVideo.controls = false;
      showreelVideo.currentTime = 0;
    });
  }

  /* ---------- gallery "view" cursor (pointer devices only) ---------- */
  const mosaic = $(".mosaic");
  if (mosaic && window.matchMedia("(hover: hover)").matches) {
    const cursor = document.createElement("div");
    cursor.className = "cursor-chip";
    cursor.setAttribute("aria-hidden", "true");
    cursor.textContent = "Guarda";
    document.body.appendChild(cursor);
    mosaic.addEventListener("mousemove", (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    });
    mosaic.addEventListener("mouseenter", () => cursor.classList.add("is-active"));
    mosaic.addEventListener("mouseleave", () => cursor.classList.remove("is-active"));
  }

  /* ---------- scroll reveal (auto-stagger within each group) ---------- */
  const revealGroups = $$(
    ".section__head, .manifesto__text, .about__lead, .about__copy, .about__frame, .chip, .contact__intro, .lavori__group, .showreel__frame"
  );
  revealGroups.forEach((el) => el.classList.add("reveal"));

  const revealTargets = [...revealGroups, ...frames];

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }
})();
