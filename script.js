// script.js

document.addEventListener('DOMContentLoaded', () => {
  const API_BASE   = 'https://script.google.com/macros/s/AKfycbxTZhEAgwVw51GeZL_9LOPAJ48bYGeR7X8eQcQMBOPWxxbEZe_A0ghsny-GdA9gdhIn/exec';
  const SHEET_NAME = 'Riftbound Cards';

  const openBtn  = document.getElementById('open-search');
  const closeBtn = document.getElementById('close-search');
  const modal    = document.getElementById('search-modal');

  // 1) JSONP helper
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

  // 1) Load all cards into memory
  let allCards = [];
  jsonpFetch({ sheet: SHEET_NAME }, data => {
    if (Array.isArray(data)) {
      allCards = data;
      console.log(`Loaded cards: ${allCards.length}`);
    } else {
      console.error('Failed to load cards:', data);
    }
  });

  // Modal open/close logic (unchanged)
  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
  });
  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });
  document.querySelector('.modal-backdrop').addEventListener('click', () => {
    modal.classList.add('hidden');
  });
});
