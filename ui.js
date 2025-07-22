// ui.js – UI Layer & Counters
(function() {
  // — Element refs —
  const openSearchBtn  = document.getElementById('open-search');
  const closeSearchBtn = document.getElementById('close-search');
  const searchModal    = document.getElementById('search-modal');
  const btnImport      = document.getElementById('btn-import');
  const btnPrint       = document.getElementById('btn-print');
  const btnOverview    = document.getElementById('btn-overview');
  const btnFullProxy   = document.getElementById('btn-full-proxy');
  const btnReset       = document.getElementById('btn-reset');
  const countLabel     = document.getElementById('card-count');

  // — Sync function to inventory DOM and update all counters —
  function syncCounts() {
    const counts = {};
    document.querySelectorAll('#card-container .card[data-variant]').forEach(card => {
      const vn = card.dataset.variant;
      counts[vn] = (counts[vn]||0) + 1;
    });
    // update badges
    document.querySelectorAll('#card-container .card').forEach(card => {
      const vn    = card.dataset.variant;
      const badge = card.querySelector('.qty-badge');
      badge.textContent = counts[vn] || 0;
    });
    // update top-bar
    const total = Object.values(counts).reduce((a,b)=>a+b,0);
    if (countLabel) {
      countLabel.textContent = total + ' card' + (total!==1?'s':'');
    }
  }

  // — Wrap add/remove to call syncCounts() —
  const rawAdd = window.addCard;
  window.addCard = vn => {
    const ok = rawAdd(vn);
    if (ok) syncCounts();
    return ok;
  };
  const rawRm  = window.removeCard;
  window.removeCard = (vn,el) => {
    const cardEl = el || document.querySelector(`.card[data-variant="${vn}"]`);
    if (!cardEl) return false;
    const ok = rawRm(vn, cardEl);
    if (ok) syncCounts();
    return ok;
  };

  // — Search modal —
  openSearchBtn?.addEventListener('click', () => searchModal.classList.remove('hidden'));
  closeSearchBtn?.addEventListener('click', () => searchModal.classList.add('hidden'));

  // — Import List Modal —
  btnImport.addEventListener('click', () => {
    const prev = document.getElementById('import-modal');
    if (prev) prev.remove();
    const ov = document.createElement('div');
    ov.id = 'import-modal'; ov.className = 'modal-overlay';
    ov.innerHTML = `
      <div class="modal-content">
        <button id="close-import" class="modal-close">×</button>
        <h2>Import List</h2>
        <textarea id="import-area" placeholder="e.g. OGN-045-03"></textarea>
        <label><input type="checkbox" id="import-clear"> Clear existing cards</label>
        <div class="modal-actions">
          <button id="import-cancel" class="topbar-btn">Cancel</button>
          <button id="import-ok"     class="topbar-btn">Import</button>
        </div>
      </div>`;
    document.body.appendChild(ov);

    const area   = ov.querySelector('#import-area');
    const clear  = ov.querySelector('#import-clear');
    const close  = ov.querySelector('#close-import');
    const cancel = ov.querySelector('#import-cancel');
    const ok     = ov.querySelector('#import-ok');

    close.onclick = cancel.onclick = () => ov.remove();
    area.value    = ''; // start blank

    ok.onclick = () => {
      ov.remove();
      if (clear.checked) {
        document.getElementById('card-container').innerHTML = '';
      }
      (area.value||'').trim().split(/\s+/).forEach(tok => {
        const [a,b] = tok.split('-');
        if (b) window.addCard(`${a}-${b}`);
      });
    };
  });

  // — Print, Full Proxy, Reset —
  btnPrint.addEventListener('click', () => {
    document.getElementById('top-bar').style.display = 'none';
    window.print();
    setTimeout(()=>document.getElementById('top-bar').style.display = '', 0);
  });
  btnFullProxy.addEventListener('click', () => {
    document.querySelectorAll('#card-container img.card-img')
      .forEach(img => img.src = img.dataset.fullArt || img.src);
  });
  btnReset.addEventListener('click', () => {
    document.getElementById('card-container').innerHTML = '';
    syncCounts();
  });

  // — Overview wiring & builder —
  function wireOverview(listEl) {
    listEl.querySelectorAll('.overview-inc').forEach(b=>
      b.addEventListener('click', ()=> window.addCard(b.dataset.vn) && buildOverview())
    );
    listEl.querySelectorAll('.overview-dec').forEach(b=>
      b.addEventListener('click', ()=> window.removeCard(b.dataset.vn) && buildOverview())
    );
  }

  function buildOverview() {
    const prev = document.getElementById('overview-modal');
    if (prev) prev.remove();
    const ov = document.createElement('div');
    ov.id = 'overview-modal'; ov.className = 'modal-overlay';
    ov.innerHTML = `
      <div class="modal-content">
        <button id="close-overview" class="modal-close">×</button>
        <h2>Overview</h2>
        <div id="overview-list"></div>
      </div>`;
    document.body.appendChild(ov);
    ov.querySelector('#close-overview').onclick = () => ov.remove();

    const variants = {};
    document.querySelectorAll('#card-container .card[data-variant]').forEach(c=>{
      const vn = c.dataset.variant;
      variants[vn] = (variants[vn]||0) + 1;
    });

    const typesOrder = ['Legend','Runes','Battlefield','Units','Spells'];
    const grouped = {};
    Object.entries(variants).forEach(([vn, count])=>{
      const cardEl = document.querySelector(`.card[data-variant="${vn}"]`);
      const type = cardEl?.classList.contains('legend')      ? 'Legend'
                 : cardEl?.classList.contains('rune')        ? 'Runes'
                 : cardEl?.classList.contains('battlefield') ? 'Battlefield'
                 : cardEl?.classList.contains('unit')        ? 'Units'
                 : cardEl?.classList.contains('spell')       ? 'Spells'
                 : 'Other';
      grouped[type] = grouped[type] || {};
      grouped[type][vn] = count;
    });

    const listEl = document.getElementById('overview-list');
    typesOrder.concat(Object.keys(grouped).filter(t=>!typesOrder.includes(t)))
    .forEach(type => {
      const data = grouped[type];
      if (!data) return;
      const total = Object.values(data).reduce((a,b)=>a+b,0);
      const sec = document.createElement('div');
      sec.className = 'overview-section';
      sec.innerHTML = `<h3>${type} (${total})</h3>`;
      Object.entries(data).forEach(([vn,count])=>{
        const cardEl = document.querySelector(`.card[data-variant="${vn}"]`);
        const name   = cardEl?.querySelector('.name')?.textContent.trim() || vn;
        const logo   = cardEl?.querySelector('img.card-img')?.src || '';
        const row    = document.createElement('div');
        row.className = 'overview-item';
        row.innerHTML = `
          <img src="${logo}" class="overview-logo" alt="icon"/>
          <span class="overview-text">${name} – ${vn}</span>
          <button class="overview-dec" data-vn="${vn}">−</button>
          <span class="overview-count">${count}</span>
          <button class="overview-inc" data-vn="${vn}">+</button>
        `;
        sec.appendChild(row);
      });
      listEl.appendChild(sec);
    });

    wireOverview(listEl);
  }

  btnOverview.addEventListener('click', buildOverview);

  // — Initial sync on load —
  document.addEventListener('DOMContentLoaded', syncCounts);
})();
