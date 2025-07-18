// script.js
(async () => {
  const API_BASE   = 'https://script.google.com/macros/s/AKfycbxTZhEAgwVw51GeZL_9LOPAJ48bYGeR7X8eQcQMBOPWxxbEZe_A0ghsny-GdA9gdhIn/exec';
  const SHEET_NAME = 'Riftbound Cards';

  const container  = document.getElementById('card-container');
  const openBtn    = document.getElementById('open-search');
  const closeBtn   = document.getElementById('close-search');
  const modal      = document.getElementById('search-modal');
  const input      = document.getElementById('card-search-input');
  const results    = document.getElementById('search-results');

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

  // Toast
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

  // Format effects
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
  await new Promise(r => {
    jsonpFetch({ sheet: SHEET_NAME }, data => {
      allCards = Array.isArray(data) ? data : [];
      r();
    });
  });

  // 2) Initial render
  const params = new URLSearchParams(location.search);
  const initial = (params.get('id')||'')
    .split(',').map(s=>s.trim()).filter(Boolean);
  if (initial.length) renderCards(initial, true);

  // 3) Modal logic
  openBtn.onclick  = () => {
    modal.classList.remove('hidden');
    input.value = ''; results.innerHTML = '';
    input.focus();
  };
  closeBtn.onclick = () => modal.classList.add('hidden');
  input.oninput   = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) return results.innerHTML = '';
    const matches = allCards.filter(c =>
      (c.name||'').toLowerCase().includes(q) ||
      (c.variantNumber||'').toLowerCase().includes(q)
    );
    results.innerHTML = '';
    matches.forEach(c => results.appendChild(buildCard(c)));
  };

  // Render helpers
  function renderCards(vns, clear=false) {
    if (clear) container.innerHTML = '';
    vns.forEach(vn => {
      jsonpFetch({ sheet: SHEET_NAME, id: vn }, data => {
        if (!Array.isArray(data) || !data[0]) return;
        container.appendChild(buildCard(data[0]));
      });
    });
  }

  function buildCard(c) {
    const tags  = (c.tags||'').replace(/;/g,' ');
    const cols  = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const code  = cols[0]||'';
    const desc  = formatDescription(c.description, code);

    let html;
    switch ((c.type||'').toLowerCase()) {
      case 'unit':
        html = `
          <div class="top-bar">
            <span class="name">${c.name}</span>
            <span class="cost">${c.energy}</span>
          </div>
          <div class="middle"><p>${desc}</p></div>
          <div class="bottom-bar">
            <span class="type-line">Unit • ${tags}</span>
            <span class="might">${c.might
              ? `<img src="images/SwordIconRB.png" class="icon">${c.might}`
              : ''}</span>
          </div>`;
        break;
      case 'spell':
      case 'gear':
        html = `
          <div class="top-bar">
            <span class="name">${c.name}</span>
            <span class="cost">${c.energy}</span>
          </div>
          <div class="middle"><p>${desc}</p></div>
          <div class="bottom-bar">
            <span class="type-line">Spell • ${tags}</span>
          </div>`;
        break;
      case 'battlefield':
        html = `
          <div class="top-bar">
            <span class="name">${c.name}</span>
          </div>
          <div class="middle"><p>${desc}</p></div>
          <div class="bottom-bar">
            <span class="type-line">Battlefield</span>
          </div>`;
        break;
      case 'legend':
        html = `
          <div class="top-bar">
            <span class="name">${c.name}</span>
          </div>
          <div class="middle"><p>${desc}</p></div>
          <div class="bottom-bar">
            <span class="type-line">Legend • ${tags}</span>
          </div>`;
        break;
      case 'rune':
        html = `
          <div class="top-bar">
            <span class="name">${c.name}</span>
          </div>
          <div class="middle">
            <img src="images/${code}.png" class="icon" alt="${code}">
          </div>`;
        break;
      default:
        html = `<div class="middle"><p>Unknown type</p></div>`;
    }

    const el = document.createElement('div');
    el.className = `card ${c.type.toLowerCase()}`;
    el.innerHTML = html + `
      <div class="hover-controls">
        <button class="add-btn">+</button>
        <button class="remove-btn">–</button>
      </div>`;

    el.querySelector('.add-btn').onclick = () => {
      renderCards([c.variantNumber], false);
      showToast('Card added!');
    };
    el.querySelector('.remove-btn').onclick = () => el.remove();

    return el;
  }
})();
