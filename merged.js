// merged.js – Riftbound Eco Proxy
(() => {
  const API_BASE     = 'https://script.google.com/macros/s/AKfycbxTZhEAgwVw51GeZL_9LOPAJ48bYGeR7X8eQcQMBOPWxxbEZe_A0ghsny-GdA9gdhIn/exec';
  const SHEET_NAME   = 'Riftbound Cards';
  const container    = document.getElementById('card-container');
  const openBtn      = document.getElementById('open-search');
  const closeBtn     = document.getElementById('close-search');
  const modal        = document.getElementById('search-modal');
  const input        = document.getElementById('card-search-input');
  const results      = document.getElementById('search-results');
  const importBtn    = document.getElementById('btn-import');
  const printBtn     = document.getElementById('btn-print');
  const fullProxyBtn = document.getElementById('btn-full-proxy');
  const resetBtn     = document.getElementById('btn-reset');
  const btnOverview  = document.getElementById('btn-overview');

  window.cardCounts = {};

  function jsonpFetch(params, cb) {
    const callbackName = 'cb_' + Date.now() + '_' + Math.floor(Math.random() * 1e4);
    const script = document.createElement('script');
    window[callbackName] = data => {
      delete window[callbackName];
      document.head.removeChild(script);
      cb(data);
    };
    const qs = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    script.src = `${API_BASE}?${qs}&callback=${callbackName}`;
    document.head.appendChild(script);
  }

  const allowedTypes = ['unit','spell','gear','battlefield','legend','rune'];
  const typeClassMap = {
    unit: 'unit', spell: 'spell', gear: 'spell',
    battlefield: 'battlefield', legend: 'legend', rune: 'rune'
  };
  let allCards = [];
  jsonpFetch({ sheet: SHEET_NAME }, data => { allCards = Array.isArray(data) ? data : []; });

  function formatDescription(txt = '') {
    let out = String(txt);
    function replaceCode(c, i) {
      out = out.replace(new RegExp(`\\s*\\[${c}\\]\\s*`, 'gi'), i);
    }
    replaceCode('Tap', `<img src="images/Tap.png" class="inline-icon" alt="Tap">`);
    replaceCode('Might', `<img src="images/SwordIconRB.png" class="inline-icon" alt="Might">`);
    replaceCode('power', `<img src="images/RainbowRune.png" class="inline-icon" alt="Power">`);
    ['Body','Calm','Chaos','Fury','Mind','Order'].forEach(col =>
      replaceCode(col, `<img src="images/${col}.png" class="inline-icon" alt="${col}">`)
    );
    return out.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
  }

  function build(id, html) {
    const w = document.createElement('div');
    w.className = 'card';
    w.setAttribute('data-variant', id);
    w.insertAdjacentHTML('beforeend', html);

    const b = document.createElement('div'); b.className = 'qty-badge';
    b.textContent = window.cardCounts[id] || 0;
    w.appendChild(b);

    const hb = document.createElement('div'); hb.className = 'hover-bar';
    const a = document.createElement('button'); a.className = 'add-btn'; a.textContent = '+';
    const r = document.createElement('button'); r.className = 'remove-btn'; r.textContent = '−';
    hb.append(a, r); w.appendChild(hb);

    a.addEventListener('click', () => window.addCard(id));
    r.addEventListener('click', e => { e.stopPropagation(); window.removeCard(id, w); });
    return w;
  }

  function makeUnit(c) {
    const cols = (c.colors || '').split(/[;,]\s*/).filter(Boolean);
    const costN = Number(c.energy) || 0;
    const powN = Number(c.power) || 0;
    const icons = cols.map(col => `<img src="images/${col}.png" class="inline-icon" alt="${col}">`).join(' ');
    const costIcons = Array(powN).fill().map(_ =>
      `<img src="images/${cols[0]||'Body'}2.png" class="cost-icon" alt="">`
    ).join('');
    const mightHTML = c.might ? `<img src="images/SwordIconRB.png" class="might-icon" alt="Might"> ${c.might}` : '';
    const descHTML = formatDescription(c.description);
    return build(c.variantNumber, `
      <div class="unit-row">
        <span class="unit-icons">${icons}</span>
        <span class="unit-name">${c.name}</span>
        <span class="unit-variant">${c.variantNumber}</span>
      </div>`
    );
  }

  function makeSpell(c) { return makeUnit(c); }
  function makeBattlefield(c) { return makeUnit(c); }
  function makeLegend(c) { return makeUnit(c); }
  function makeRune(c) { return makeUnit(c); }

  function renderSearchResults(list) {
    results.innerHTML = '';
    list.forEach(c => {
      const t = (c.type||'').trim().toLowerCase();
      if (!allowedTypes.includes(t)) return;
      const el = { unit: makeUnit, spell: makeSpell, gear: makeSpell,
                   battlefield: makeBattlefield, legend: makeLegend, rune: makeRune }[t](c);
      el.classList.add(typeClassMap[t]);
      results.appendChild(el);
    });
  }

  function renderCards(ids, clear = true) {
    if (clear) container.innerHTML = '';
    ids.forEach(vn => {
      jsonpFetch({ sheet: SHEET_NAME, id: vn }, data => {
        if (!data[0]) return;
        const c = data[0];
        const el = { unit: makeUnit, spell: makeSpell, gear: makeSpell,
                     battlefield: makeBattlefield, legend: makeLegend, rune: makeRune }[(c.type||'').toLowerCase()](c);
        container.appendChild(el);
      });
    });
  }

  window.addCard = vn => {
    renderCards([vn], false);
    window.cardCounts[vn] = (window.cardCounts[vn]||0) + 1;
    saveState();
  };
  window.removeCard = (vn, el) => {
    if (el) el.remove();
    window.cardCounts[vn] = Math.max((window.cardCounts[vn]||0)-1,0);
    saveState();
  };

  function saveState() { localStorage.setItem('riftboundCardCounts', JSON.stringify(window.cardCounts)); }
  function loadState() { try{window.cardCounts=JSON.parse(localStorage.getItem('riftboundCardCounts'))}catch{window.cardCounts={}} }

  openBtn.addEventListener('click', () => { modal.classList.remove('hidden'); input.value=''; results.innerHTML=''; });
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  input.addEventListener('input', () => renderSearchResults(allCards));

  importBtn.addEventListener('click', () => { /* import logic */ });
  printBtn.addEventListener('click', () => window.print());
  fullProxyBtn.addEventListener('click', () => {});
  resetBtn.addEventListener('click', () => { container.innerHTML=''; window.cardCounts={}; saveState(); });

  function buildOverview() {
    const prev = document.getElementById('overview-modal'); if(prev) return prev.remove();
    const overlay = document.createElement('div'); overlay.id='overview-modal'; overlay.className='modal-overlay';
    overlay.innerHTML = `<div class="modal-content"><button id="close-overview" class="modal-close">×</button><h2>Overview</h2><div id="overview-list"></div></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#close-overview').onclick=overlay.remove.bind(overlay);
    const listEl = overlay.querySelector('#overview-list');
    ['legend','battlefield','rune','unit','spell'].forEach(type=>{
      const sec = document.createElement('div'); sec.innerHTML=`<h3>${type}</h3>`;
      Object.entries(window.cardCounts).filter(([vn,c])=>c).forEach(([vn])=>{
        const cardEl=container.querySelector(`[data-variant="${vn}"]`);
        if(!cardEl||!cardEl.classList.contains(type))return;
        const icons=cardEl.querySelectorAll('.inline-icon');
        const iconHTML=Array.from(icons).map(i=>i.outerHTML).join(' ');
        const name=cardEl.querySelector('.card-name')?.textContent||vn;
        sec.innerHTML+=`<div>${iconHTML} - ${name} - ${vn}</div>`;
      });
      listEl.appendChild(sec);
    });
  }
  btnOverview.addEventListener('click', buildOverview);

  document.addEventListener('DOMContentLoaded', ()=>{ loadState(); renderCards(Object.keys(window.cardCounts)); });
})();
