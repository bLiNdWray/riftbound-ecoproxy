// script.js
(async () => {
  const API_BASE   = 'https://script.google.com/macros/s/AKfycbxTZhEAgwVw51GeZL_9LOPAJ48bYGeR7X8eQcQMBOPWxxbEZe_A0ghsny-GdA9gdhIn/exec';
  const SHEET_NAME = 'Riftbound Cards';

  const container = document.getElementById('card-container');
  const openBtn   = document.getElementById('open-search');
  const closeBtn  = document.getElementById('close-search');
  const modal     = document.getElementById('search-modal');
  const input     = document.getElementById('card-search-input');
  const results   = document.getElementById('search-results');

  let allCards = [];

  // JSONP helper
  function jsonpFetch(params, cb) {
    const cbName = 'jsonp_cb_' + Date.now();
    window[cbName] = data => {
      delete window[cbName];
      document.head.removeChild(script);
      cb(data);
    };
    const qs = Object.entries(params)
      .map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const script = document.createElement('script');
    script.src = `${API_BASE}?${qs}&callback=${cbName}`;
    document.head.appendChild(script);
  }

  // Toast helper
  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => {
      t.classList.add('hide');
      t.addEventListener('transitionend', () => t.remove());
    }, 1500);
  }

  // Format tokens (Tap, Might, power, etc.)
  function formatDescription(txt = '', colorCode) {
    return txt
      .replace(/\[Tap\]/gi,   `<img src="images/Tap.png" class="icon" alt="Tap">`)
      .replace(/\[Might\]/gi, `<img src="images/SwordIconRB.png" class="icon" alt="Might">`)
      .replace(/\[power\]/gi, `<img src="images/RainbowRune.png" class="icon" alt="Power">`)
      .replace(/\[S\]/g,      `<img src="images/SwordIconRB.png" class="icon" alt="S">`)
      .replace(/\[C\]/g,      `<img src="images/${colorCode}2.png" class="icon" alt="C">`)
      .replace(/\n/g, '<br>');
  }

  // 1) Load all cards
  await new Promise(res =>
    jsonpFetch({ sheet: SHEET_NAME }, data => {
      allCards = Array.isArray(data) ? data : [];
      console.log(`Loaded ${allCards.length} cards`);
      res();
    })
  );

  // Modal open/close
  openBtn.onclick  = () => {
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
      (c.name||'').toLowerCase().includes(q) ||
      (c.variantNumber||'').toLowerCase().includes(q)
    );
    if (matches.length === 0) {
      results.textContent = 'No results';
      return;
    }
    matches.forEach(c => {
      const row = document.createElement('div');
      row.className = 'search-row';
      row.textContent = `${c.name} (${c.variantNumber})`;
      row.onclick = () => {
        container.appendChild(buildCard(c));
        showToast('Card added!');
        modal.classList.add('hidden');
      };
      results.appendChild(row);
    });
  };

  // Build a card with hover‐controls
  function buildCard(c) {
    const name  = c.name;
    const cost  = c.energy;
    const desc  = formatDescription(c.description, (c.colors||'').split(/[;,]\s*/)[0]||'');
    const type  = c.type;
    const might = c.might || '';

    const el = document.createElement('div');
    el.className = `card ${type.toLowerCase()}`;
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
      <div class="hover-controls">
        <button class="remove-btn">Remove</button>
      </div>`;

    el.querySelector('.remove-btn').onclick = () => el.remove();
    return el;
  }
})();
