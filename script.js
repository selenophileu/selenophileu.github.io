(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const safeStorage = {
    get(key) {
      try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
    },
  };

  /* ---------- footer year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

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

    languageBlocks.forEach((el) => {
      el.hidden = el.dataset.language !== lang;
    });

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

  /* ---------- gallery "view" cursor (pointer devices only) ---------- */
  const grid = $(".work__grid");
  if (grid && window.matchMedia("(hover: hover)").matches) {
    const cursor = document.createElement("div");
    cursor.className = "cursor-chip";
    cursor.setAttribute("aria-hidden", "true");
    cursor.textContent = "View";
    document.body.appendChild(cursor);

    grid.addEventListener("mousemove", (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    });
    grid.addEventListener("mouseenter", () => cursor.classList.add("is-active"));
    grid.addEventListener("mouseleave", () => cursor.classList.remove("is-active"));
  }

  /* ---------- scroll reveal ---------- */
  const revealTargets = $$(
    ".section__head, .about__lead, .about__copy, .about__frame, .chip, .contact__intro, .hero__body, .showreel__frame"
  );
  revealTargets.forEach((el) => el.classList.add("reveal"));

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
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }
})();
