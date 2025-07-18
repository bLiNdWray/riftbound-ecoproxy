// script.js
document.addEventListener('DOMContentLoaded', () => {
  const API_BASE   = 'https://script.google.com/macros/s/AKfycbxTZhEAgwVw51GeZL_9LOPAJ48bYGeR7X8eQcQMBOPWxxbEZe_A0ghsny-GdA9gdhIn/exec';
  const SHEET_NAME = 'Riftbound Cards';

  const openBtn       = document.getElementById('open-search');
  const closeBtn      = document.getElementById('close-search');
  const modal         = document.getElementById('search-modal');
  const input         = document.getElementById('card-search-input');
  const results       = document.getElementById('search-results');

  let allCards = [];

  // JSONP helper
  function jsonpFetch(params, cb) {
    const callbackName = 'jsonp_cb_' + Date.now();
    window[callbackName] = data => {
      delete window[callbackName];
      document.head.removeChild(script);
      cb(data);
    };
    const qs = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const script = document.createElement('script');
    script.src = `${API_BASE}?${qs}&callback=${callbackName}`;
    document.head.appendChild(script);
  }

  // Load all cards
  jsonpFetch({ sheet: SHEET_NAME }, data => {
    if (Array.isArray(data)) {
      allCards = data;
      console.log(`Loaded ${allCards.length} cards`);
    } else {
      console.error('Failed to load cards', data);
    }
  });

  // Modal open/close
  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    input.value = '';
    results.innerHTML = '';
    input.focus();
  });
  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });
  document.querySelector('.modal-backdrop').addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // Step 2: Live search filtering
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    results.innerHTML = '';
    if (!q) return;
    const matches = allCards.filter(card =>
      (card.name || '').toLowerCase().includes(q) ||
      (card.variantNumber || '').toLowerCase().includes(q)
    );
    if (matches.length === 0) {
      results.textContent = 'No results';
      return;
    }
    matches.forEach(card => {
      const row = document.createElement('div');
      row.className = 'search-row';
      row.textContent = `${card.name} (${card.variantNumber})`;
      results.appendChild(row);
    });
  });
});
