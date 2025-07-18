// script.js
document.addEventListener('DOMContentLoaded', () => {
  const API_BASE   = 'https://script.google.com/macros/s/AKfycbxTZhEAgwVw51GeZL_9LOPAJ48bYGeR7X8eQcQMBOPWxxbEZe_A0ghsny-GdA9gdhIn/exec';
  const SHEET_NAME = 'Riftbound Cards';

  const openBtn   = document.getElementById('open-search');
  const closeBtn  = document.getElementById('close-search');
  const modal     = document.getElementById('search-modal');
  const input     = document.getElementById('card-search-input');
  const results   = document.getElementById('search-results');
  const container = document.getElementById('card-container');

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
      .map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const script = document.createElement('script');
    script.src = `${API_BASE}?${qs}&callback=${callbackName}`;
    document.head.appendChild(script);
  }

  // Load all cards
  jsonpFetch({ sheet: SHEET_NAME }, data => {
    allCards = Array.isArray(data) ? data : [];
    console.log(`Loaded ${allCards.length} cards`);
  });

  // Modal open/close
  openBtn.onclick = () => {
    modal.classList.remove('hidden');
    input.value = ''; 
    results.innerHTML = '';
    input.focus();
  };
  closeBtn.onclick = () => modal.classList.add('hidden');
  document.querySelector('.modal-backdrop').onclick = () => modal.classList.add('hidden');

  // Live search
  input.oninput = () => {
    const q = input.value.trim().toLowerCase();
    results.innerHTML = '';
    if (!q) return;
    const matches = allCards.filter(c =>
      (c.name||c.NAME||'').toLowerCase().includes(q) ||
      (c.variantNumber||c.NUMBER||'').toLowerCase().includes(q)
    );
    if (!matches.length) {
      results.textContent = 'No results';
      return;
    }
    matches.forEach(c => {
      const row = document.createElement('div');
      row.className = 'search-row';
      // show name and ID
      row.textContent = `${c.name || c.NAME} (${c.variantNumber || c.NUMBER})`;
      // when clicked, add the card to the main container:
      row.onclick = () => {
        container.appendChild(buildCard(c));
        modal.classList.add('hidden');
      };
      results.appendChild(row);
    });
  };

  // Build a card element from the card data
  function buildCard(c) {
    // pull fields (falling back to uppercase keys if needed)
    const name  = c.name || c.NAME || '';
    const cost  = c.energy || c.cost || c.COST || '';
    const desc  = c.description || c.effect || c.EFFECT || '';
    const type  = c.type || c.TYPE || '';
    const might = c.might || c.MIGHT || '';
    // decide CSS type class: unit, spell, etc.
    const typeClass = type.toLowerCase();

    // create element
    const el = document.createElement('div');
    el.className = `card ${typeClass}`;
    el.innerHTML = `
      <div class="top-bar">
        <span class="name">${name}</span>
        <span class="cost">${cost}</span>
      </div>
      <div class="middle"><p>${desc}</p></div>
      <div class="bottom-bar">
        <span class="type-line">${type}</span>
        <span class="might">${might}</span>
      </div>
    `;
    return el;
  }
});
