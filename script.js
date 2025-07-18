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

  // Format effect text tokens
  function formatDescription(txt = '', color) {
    return txt
      .replace(/\[Tap\]/gi,   `<img src="images/Tap.png" class="icon" alt="Tap">`)
      .replace(/\[Might\]/gi, `<img src="images/SwordIconRB.png" class="icon" alt="Might">`)
      .replace(/\[power\]/gi, `<img src="images/RainbowRune.png" class="icon" alt="Power">`)
      .replace(/\[S\]/g,      `<img src="images/SwordIconRB.png" class="icon" alt="S">`)
      .replace(/\[C\]/g,      `<img src="images/${color}2.png" class="icon" alt="C">`)
      .replace(/\n/g, '<br>');
  }

  // 1) Load sheet
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
        container.appendChild(renderCard(c));
        showToast('Card added!');
        modal.classList.add('hidden');
      };
      results.appendChild(row);
    });
  };

  // Renders full card based on type
  function renderCard(c) {
    const colors = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const mainColor = colors[0] || '';
    const desc = formatDescription(c.description, mainColor);

    let html = '';
    switch ((c.type||'').toLowerCase()) {
      case 'unit':
        html = `
          <div class="top-bar">
            <span class="name">${c.name}</span>
            <span class="cost">${c.energy}</span>
          </div>
          <div class="middle"><p>${desc}</p></div>
          <div class="bottom-bar">
            <span class="type-line">Unit • ${c.tags.replace(/;/g,' ') || ''}</span>
            <span class="might">
              <img src="images/SwordIconRB.png" class="icon" alt="Might">${c.might}
            </span>
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
            <span class="type-line">${c.type} • ${c.tags.replace(/;/g,' ')}</span>
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
        // two-color icons
        const colorIcons = colors.map(col =>
          `<img src="images/${col}.png" class="icon" alt="${col}">`
        ).join('');
        html = `
          <div class="top-bar">
            <div class="legend-colors">${colorIcons}</div>
            <span class="legend-label">Legend</span>
          </div>
          <div class="middle"><p>${desc}</p></div>
          <div class="bottom-bar">
            <span class="type-line">Legend • ${c.tags.replace(/;/g,' ')}</span>
          </div>`;
        break;

      case 'rune':
        html = `
          <div class="top-bar">
            <span class="name">${c.name}</span>
          </div>
          <div class="middle rune-middle">
            <img src="images/${mainColor}.png" class="rune-icon" alt="${mainColor}">
          </div>`;
        break;

      default:
        html = `<div class="middle"><p>Unknown type</p></div>`;
    }

    const el = document.createElement('div');
    el.className = `card ${c.type.toLowerCase()}`;
    el.innerHTML = html + `
      <div class="hover-controls">
        <button class="remove-btn">Remove</button>
      </div>`;

    el.querySelector('.remove-btn').onclick = () => el.remove();
    return el;
  }
})();
