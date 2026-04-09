/* ════════════════════════════════════════════════
   BADO – script.js  |  Premium Edition
   ════════════════════════════════════════════════ */

'use strict';

/* ────────────────────────────────────────────────
   TAB YÖNETİMİ
   ──────────────────────────────────────────────── */
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;

      document.querySelectorAll('.menu-section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });

      const target = document.getElementById('tab-' + tabId);
      if (target) target.classList.add('active');
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

      requestAnimationFrame(() => setTimeout(initAllCarousels, 50));
    });
  });
}

/* ────────────────────────────────────────────────
   BOYUT SEÇİCİ
   ──────────────────────────────────────────────── */
function initSizePickers() {
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();

      const row = btn.closest('.size-row');
      if (!row) return;

      row.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const card = btn.closest('.pcard');
      if (!card) return;

      const priceEl = card.querySelector('.pcard-price');
      if (priceEl && btn.dataset.price) {
        priceEl.textContent = btn.dataset.price;
      }

      const imgEl = card.querySelector('.pcard-img img');
      if (imgEl && btn.dataset.src) {
        imgEl.src = btn.dataset.src;
      }
    });
  });
}

/* ────────────────────────────────────────────────
   SPOTLIGHT CAROUSEL
   ──────────────────────────────────────────────── */
const inited = new Set();

function initCarousel(track) {
  const id    = track.dataset.carousel;
  const cards = Array.from(track.querySelectorAll('.pcard'));
  const dots  = document.getElementById('dots-' + id);

  if (cards.length <= 1) {
    cards.forEach(c => c.classList.add('active'));
    return;
  }

  if (dots && dots.children.length === 0) {
    cards.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', () => scrollToCard(track, cards[i]));
      dots.appendChild(dot);
    });
  }

  updateActive(track, cards, dots);
  track.addEventListener('scroll', () => updateActive(track, cards, dots), { passive: true });
  enableDrag(track);
}

function scrollToCard(track, card) {
  const target = card.offsetLeft - (track.offsetWidth - card.offsetWidth) / 2;
  track.scrollTo({ left: target, behavior: 'smooth' });
}

function updateActive(track, cards, dots) {
  const center = track.scrollLeft + track.offsetWidth / 2;
  let activeIdx = 0;
  let minDist   = Infinity;

  cards.forEach((card, i) => {
    const dist = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
    if (dist < minDist) { minDist = dist; activeIdx = i; }
  });

  cards.forEach((c, i) => c.classList.toggle('active', i === activeIdx));

  if (dots) {
    dots.querySelectorAll('.dot').forEach((d, i) =>
      d.classList.toggle('active', i === activeIdx)
    );
  }
}

function enableDrag(track) {
  let isDragging = false;
  let startX, scrollLeft;

  track.addEventListener('mousedown', e => {
    isDragging = true;
    track.classList.add('grabbing');
    startX     = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
  });

  ['mouseleave', 'mouseup'].forEach(ev => {
    track.addEventListener(ev, () => {
      isDragging = false;
      track.classList.remove('grabbing');
    });
  });

  track.addEventListener('mousemove', e => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    track.scrollLeft = scrollLeft - (x - startX) * 1.2;
  });
}

function initAllCarousels() {
  document.querySelectorAll('.carousel-track').forEach(track => {
    if (!inited.has(track)) {
      inited.add(track);
      initCarousel(track);
    } else {
      const id    = track.dataset.carousel;
      const cards = Array.from(track.querySelectorAll('.pcard'));
      const dots  = document.getElementById('dots-' + id);
      updateActive(track, cards, dots);
    }
  });
}

/* ────────────────────────────────────────────────
   HEADER SCROLL EFFECTi
   Scroll aşağı inince header arka planı koyulaşır
   ──────────────────────────────────────────────── */
function initHeaderScroll() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // Sayfa yükleme anında da kontrol et
}

/* ────────────────────────────────────────────────
   BACK TO TOP
   ──────────────────────────────────────────────── */
function initBackToTop() {
  const btn = document.getElementById('back-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 240);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ────────────────────────────────────────────────
   SCROLL REVEAL — sub-label ve sec-head için
   IntersectionObserver ile hafif appear animasyonu
   ──────────────────────────────────────────────── */
function initScrollReveal() {
  if (!('IntersectionObserver' in window)) return;

  const style = document.createElement('style');
  style.textContent = `
    .reveal-item {
      opacity: 0;
      transform: translateY(14px);
      transition: opacity 0.45s ease, transform 0.45s ease;
    }
    .reveal-item.revealed {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.sub-label, .sec-head').forEach(el => {
    el.classList.add('reveal-item');
    observer.observe(el);
  });
}

/* ────────────────────────────────────────────────
   BAŞLAT
   ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initSizePickers();
  initAllCarousels();
  initBackToTop();
  initHeaderScroll();
  initScrollReveal();

  // Footer yılını dinamik yap
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});