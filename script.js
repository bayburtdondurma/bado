/* ════════════════════════════════════════════════
   BADO – script.js
   ════════════════════════════════════════════════ */

'use strict';

/* ────────────────────────────────────────────────
   TAB YÖNETİMİ
   data-tab attribute'u okuyarak çalışır.
   HTML'de onclick kullanılmaz.
   ──────────────────────────────────────────────── */
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;

      // Tüm sekmeleri kapat
      document.querySelectorAll('.menu-section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });

      // Seçilen sekmeyi aç
      const target = document.getElementById('tab-' + tabId);
      if (target) target.classList.add('active');
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // Butonu görünür alana kaydır (mobil)
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

      // Layout hazır olduktan sonra carousel'ları yenile
      requestAnimationFrame(() => setTimeout(initAllCarousels, 50));
    });
  });
}

/* ────────────────────────────────────────────────
   BOYUT SEÇİCİ (Meyve Suyu vb.)
   data-price ve data-src attribute'larıyla çalışır.
   ──────────────────────────────────────────────── */
function initSizePickers() {
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation(); // carousel sürüklemeyle çakışmasın

      const row = btn.closest('.size-row');
      if (!row) return;

      // Seçimi güncelle
      row.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const card = btn.closest('.pcard');
      if (!card) return;

      // Fiyatı güncelle
      const priceEl = card.querySelector('.pcard-price');
      if (priceEl && btn.dataset.price) {
        priceEl.textContent = btn.dataset.price;
      }

      // Görseli güncelle (opsiyonel — data-src yoksa değiştirmez)
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

/**
 * Tek bir carousel track'ini başlatır.
 * @param {HTMLElement} track
 */
function initCarousel(track) {
  const id   = track.dataset.carousel;
  const dots = document.getElementById('dots-' + id);

  // Kartları her zaman DOM'dan taze oku
  const cards = Array.from(track.querySelectorAll('.pcard'));

  // Tek kart varsa direkt active
  if (cards.length <= 1) {
    cards.forEach(c => c.classList.add('active'));
    return;
  }

  // Dot'ları oluştur (sadece bir kez)
  if (dots && dots.children.length === 0) {
    cards.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', () => scrollToCard(track, Array.from(track.querySelectorAll('.pcard'))[i]));
      dots.appendChild(dot);
    });
  }

  // İlk aktif kartı belirle
  updateActive(track, dots);

  // Scroll listener'ı yalnızca bir kez ekle — _scrollBound flag ile kontrol et
  if (!track._scrollBound) {
    track._scrollBound = true;
    track.addEventListener('scroll', () => updateActive(track, dots), { passive: true });
  }

  // Masaüstü sürükleme
  enableDrag(track);
}

/**
 * Kartı merkezde gösterecek şekilde scroll eder.
 * @param {HTMLElement} track
 * @param {HTMLElement} card
 */
function scrollToCard(track, card) {
  const target = card.offsetLeft - (track.offsetWidth - card.offsetWidth) / 2;
  track.scrollTo({ left: target, behavior: 'smooth' });
}

/**
 * Merkeze en yakın kartı .active yapar, dot'ları günceller.
 * cards'ı her çağrıda DOM'dan taze okur — Firestore geç yüklense de sorun olmaz.
 */
function updateActive(track, dots) {
  const cards  = Array.from(track.querySelectorAll('.pcard'));
  if (!cards.length) return;

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

/**
 * Masaüstü mouse sürükleme desteği.
 */
function enableDrag(track) {
  if (track._dragBound) return;
  track._dragBound = true;

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

/**
 * Sayfadaki tüm carousel'ları başlatır veya günceller.
 * Tab geçişlerinde de çağrılır.
 */
function initAllCarousels() {
  document.querySelectorAll('.carousel-track').forEach(track => {
    if (!inited.has(track)) {
      inited.add(track);
    }
    // Her zaman initCarousel çağır — içi zaten _scrollBound / _dragBound ile korumalı
    initCarousel(track);
  });
}

/* ────────────────────────────────────────────────
   BACK TO TOP
   ──────────────────────────────────────────────── */
function initBackToTop() {
  const btn = document.getElementById('back-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 220);
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Footer yılını dinamik yap
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
