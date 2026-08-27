(() => {
  "use strict";

  /* ---------- helpers ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const safeStorage = {
    get(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        /* ignore (private mode, disabled storage, etc.) */
      }
    },
  };

  /* ---------- footer year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- hero title reveal (wrap text so CSS can mask/slide it) ---------- */
  $$(".hero h1 span").forEach((span) => {
    const text = span.textContent;
    span.textContent = "";
    const inner = document.createElement("span");
    inner.className = "line-inner";
    inner.textContent = text;
    span.appendChild(inner);
  });

  /* ---------- mobile menu ---------- */
  const menuButton = $(".menu-button");
  const mobileMenu = $(".mobile-menu");
  if (menuButton && mobileMenu) {
    const closeMenu = () => {
      mobileMenu.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
    };
    const toggleMenu = () => {
      const isOpen = mobileMenu.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
      document.body.classList.toggle("menu-open", isOpen);
    };
    menuButton.addEventListener("click", toggleMenu);
    $$("a", mobileMenu).forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mobileMenu.classList.contains("is-open")) closeMenu();
    });
  }

  /* ---------- language switcher (EN / IT) ---------- */
  const langButtons = $$(".lang-button");
  const translatable = $$("[data-en]");
  const languageBlocks = $$("[data-language]");

  function applyLanguage(lang) {
    document.documentElement.lang = lang;

    langButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === lang);
    });

    translatable.forEach((el) => {
      const value = lang === "it" ? el.dataset.it : el.dataset.en;
      if (value == null) return;
      if (el.dataset.html === "true") {
        el.innerHTML = value;
      } else {
        el.textContent = value;
      }
    });

    languageBlocks.forEach((el) => {
      el.hidden = el.dataset.language !== lang;
    });

    safeStorage.set("site-lang", lang);
  }

  langButtons.forEach((btn) => {
    btn.addEventListener("click", () => applyLanguage(btn.dataset.lang));
  });

  const preferredLang =
    safeStorage.get("site-lang") ||
    (navigator.language && navigator.language.toLowerCase().startsWith("it") ? "it" : "en");
  applyLanguage(preferredLang === "it" ? "it" : "en");

  /* ---------- lightbox gallery ---------- */
  const photos = $$(".photo");
  const lightbox = $(".lightbox");

  if (photos.length && lightbox) {
    const lightboxImg = $("img", lightbox);
    const counter = $(".lightbox-counter", lightbox);
    const closeBtn = $(".lightbox-close", lightbox);
    const prevBtn = $(".lightbox-prev", lightbox);
    const nextBtn = $(".lightbox-next", lightbox);
    let currentIndex = 0;
    let lastFocused = null;

    function renderSlide() {
      const photo = photos[currentIndex];
      const src = photo.dataset.image || $("img", photo).src;
      const alt = $("img", photo).alt || "Alessia Laghi";

      lightboxImg.classList.remove("is-loaded");
      const preload = new Image();
      preload.onload = () => {
        lightboxImg.src = src;
        lightboxImg.alt = alt;
        requestAnimationFrame(() => lightboxImg.classList.add("is-loaded"));
      };
      preload.src = src;

      if (counter) counter.textContent = `${currentIndex + 1} / ${photos.length}`;
    }

    function openLightbox(index) {
      currentIndex = index;
      lastFocused = document.activeElement;
      renderSlide();
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("lightbox-open");
      closeBtn.focus();
    }

    function closeLightbox() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("lightbox-open");
      if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
    }

    function showNext() {
      currentIndex = (currentIndex + 1) % photos.length;
      renderSlide();
    }

    function showPrev() {
      currentIndex = (currentIndex - 1 + photos.length) % photos.length;
      renderSlide();
    }

    photos.forEach((photo, index) => {
      photo.addEventListener("click", () => openLightbox(index));
    });

    if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
    if (nextBtn) nextBtn.addEventListener("click", showNext);
    if (prevBtn) prevBtn.addEventListener("click", showPrev);

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") showNext();
      if (e.key === "ArrowLeft") showPrev();
    });

    /* basic touch swipe support */
    let touchStartX = null;
    lightbox.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.touches[0].clientX;
      },
      { passive: true }
    );
    lightbox.addEventListener(
      "touchend",
      (e) => {
        if (touchStartX == null) return;
        const delta = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(delta) > 40) {
          delta < 0 ? showNext() : showPrev();
        }
        touchStartX = null;
      },
      { passive: true }
    );
  }

  /* ---------- gallery "view" cursor (pointer devices only) ---------- */
  const gallery = $(".editorial-gallery");
  if (gallery && window.matchMedia("(hover: hover)").matches) {
    const cursor = document.createElement("div");
    cursor.className = "gallery-cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.textContent = "View";
    document.body.appendChild(cursor);

    gallery.addEventListener("mousemove", (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    });
    gallery.addEventListener("mouseenter", () => cursor.classList.add("is-active"));
    gallery.addEventListener("mouseleave", () => cursor.classList.remove("is-active"));
  }

  /* ---------- showreel marquee (built in JS so no HTML edits are needed) ---------- */
  const showreelPlaceholder = $(".showreel-placeholder");
  if (showreelPlaceholder) {
    const marquee = document.createElement("div");
    marquee.className = "showreel-marquee";
    const track = document.createElement("div");
    track.className = "showreel-marquee-track";
    const words = ["Alessia Laghi", "Portrait", "Editorial", "Casting", "Alessia Laghi", "Portrait", "Editorial", "Casting"];
    track.innerHTML = words.map((w) => `<span>${w}</span>`).join("");
    marquee.appendChild(track);
    showreelPlaceholder.after(marquee);
  }

  /* ---------- scroll reveal ---------- */
  const revealTargets = $$(".section-header, .about-lead, .about-copy, .profile-extra, .contact-intro, .hero-title");
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
