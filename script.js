/* =========================
   MOBILE MENU
   ========================= */

const menuButton = document.querySelector(".menu-button");
const mobileMenu = document.querySelector(".mobile-menu");

if (menuButton && mobileMenu) {
  menuButton.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("is-open");

    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.textContent = isOpen ? "Close" : "Menu";
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.textContent = "Menu";
    });
  });
}


/* =========================
   LANGUAGE SWITCHER
   ========================= */

const languageButtons = document.querySelectorAll(".lang-button");

function setLanguage(lang) {
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-en][data-it]").forEach((element) => {
    const text = element.dataset[lang];

    if (element.dataset.html === "true") {
      element.innerHTML = text;
    } else {
      element.textContent = text;
    }
  });

  document.querySelectorAll("[data-language]").forEach((block) => {
    block.hidden = block.dataset.language !== lang;
  });

  languageButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === lang);
  });

  localStorage.setItem("portfolio-language", lang);
}

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setLanguage(button.dataset.lang);
  });
});

const savedLanguage = localStorage.getItem("portfolio-language");

if (savedLanguage === "it" || savedLanguage === "en") {
  setLanguage(savedLanguage);
} else {
  setLanguage("en");
}


/* =========================
   LIGHTBOX
   ========================= */

const galleryItems = Array.from(document.querySelectorAll(".photo"));

const lightbox = document.querySelector(".lightbox");
const lightboxImage = document.querySelector(".lightbox-content img");
const lightboxClose = document.querySelector(".lightbox-close");
const lightboxPrev = document.querySelector(".lightbox-prev");
const lightboxNext = document.querySelector(".lightbox-next");
const lightboxCounter = document.querySelector(".lightbox-counter");

let currentIndex = 0;
let previousFocus = null;

function updateLightbox() {
  const item = galleryItems[currentIndex];

  if (!item || !lightboxImage) return;

  const source = item.dataset.image;
  const thumbnail = item.querySelector("img");

  lightboxImage.src = source;
  lightboxImage.alt = thumbnail?.alt || "Alessia Laghi";

  if (lightboxCounter) {
    lightboxCounter.textContent =
      `${currentIndex + 1} / ${galleryItems.length}`;
  }
}

function openLightbox(index) {
  if (!lightbox || galleryItems.length === 0) return;

  currentIndex = index;
  previousFocus = document.activeElement;

  updateLightbox();

  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-open");

  lightboxClose?.focus();
}

function closeLightbox() {
  if (!lightbox) return;

  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lightbox-open");

  if (lightboxImage) {
    lightboxImage.src = "";
  }

  previousFocus?.focus();
}

function showNextImage() {
  currentIndex = (currentIndex + 1) % galleryItems.length;
  updateLightbox();
}

function showPreviousImage() {
  currentIndex =
    (currentIndex - 1 + galleryItems.length) % galleryItems.length;

  updateLightbox();
}

galleryItems.forEach((item, index) => {
  item.addEventListener("click", () => {
    openLightbox(index);
  });
});

lightboxClose?.addEventListener("click", closeLightbox);
lightboxNext?.addEventListener("click", showNextImage);
lightboxPrev?.addEventListener("click", showPreviousImage);


/* CLICK OUTSIDE IMAGE */

lightbox?.addEventListener("click", (event) => {
  const clickedImage = event.target.closest(".lightbox-content img");
  const clickedButton = event.target.closest("button");

  if (!clickedImage && !clickedButton) {
    closeLightbox();
  }
});


/* KEYBOARD */

document.addEventListener("keydown", (event) => {
  if (!lightbox?.classList.contains("is-open")) return;

  if (event.key === "Escape") {
    closeLightbox();
  }

  if (event.key === "ArrowRight") {
    showNextImage();
  }

  if (event.key === "ArrowLeft") {
    showPreviousImage();
  }
});


/* =========================
   SWIPE MOBILE
   ========================= */

let touchStartX = 0;
let touchEndX = 0;

lightbox?.addEventListener(
  "touchstart",
  (event) => {
    touchStartX = event.changedTouches[0].screenX;
  },
  { passive: true }
);

lightbox?.addEventListener(
  "touchend",
  (event) => {
    touchEndX = event.changedTouches[0].screenX;

    const swipeDistance = touchStartX - touchEndX;
    const minimumSwipe = 50;

    if (swipeDistance > minimumSwipe) {
      showNextImage();
    }

    if (swipeDistance < -minimumSwipe) {
      showPreviousImage();
    }
  },
  { passive: true }
);


/* =========================
   AUTOMATIC YEAR
   ========================= */

const year = document.querySelector("#year");

if (year) {
  year.textContent = new Date().getFullYear();
}
