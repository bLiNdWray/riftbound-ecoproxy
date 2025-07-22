// ui.js – UI hooks on top of script.js
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

  // — State persistence —
  function saveState() {
    localStorage.setItem('riftboundCardCounts', JSON.stringify(window.addedCounts));
  }
  function loadState() {
    try {
      const s = localStorage.getItem('riftboundCardCounts');
      window.addedCounts = s ? JSON.parse(s) : {};
    } catch {
      window.addedCounts = {};
    }
  }

  // — Badge & total counter updates —
function refreshBadge(vn) {
  const badge = document.querySelector(
    `.card[data-variant="${vn}"] .qty-badge`
  );
  if (badge) {
    badge.textContent = window.addedCounts[vn] || 0;
  }
}

function updateCount() {
  const total = Object.values(window.addedCounts)
    .reduce((sum, n) => sum + n, 0);
  if (countLabel) {
    countLabel.textContent = total + ' card' + (total !== 1 ? 's' : '');
  }
}

 // — Wrap addCard so it also refreshes UI immediately —
const origAdd = window.addCard;
window.addCard = vn => {
  const ok = origAdd(vn);
  if (ok) {
    // bump our internal count map
    window.addedCounts[vn] = (window.addedCounts[vn]||0) + 1;
    saveState();

    // **NEW**: update this variant’s badge and the top‐bar total
    refreshBadge(vn);
    updateCount();
  }
  return ok;
};

// — Wrap removeCard so it too refreshes UI immediately —
const origRm = window.removeCard;
window.removeCard = (vn, el) => {
  // find an element if none passed
  const cardEl = el || document.querySelector(`.card[data-variant="${vn}"]`);
  if (!cardEl) return false;

  const ok = origRm(vn, cardEl);
  if (ok) {
    // decrement our internal count
    window.addedCounts[vn] = Math.max(0, (window.addedCounts[vn]||0) - 1);
    saveState();

    // **NEW**: update badge & total right away
    refreshBadge(vn);
    updateCount();
  }
  return ok;
};


  // — Search modal —
  openSearchBtn.onclick  = () => searchModal.classList.remove('hidden');
  closeSearchBtn.onclick = () => searchModal.classList.add('hidden');

  // — Import List Modal —
  btnImport.onclick = () => {
    const prev = document.getElementById('import-modal');
    if (prev) prev.remove();

    const ov = document.createElement('div');
    ov.id = 'import-modal'; ov.className = 'modal-overlay';
    ov.innerHTML = `
      <div class="modal-content">
        <button id="close-import" class="modal-close">×</button>
        <h2>Import List</h2>
        <textarea id="import-area" placeholder="e.g. OGN-045-03 OGN-046-02"></textarea>
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

    close.onclick  = cancel.onclick = () => ov.remove();
    area.value     = Object.keys(window.addedCounts).join(' ');

    ok.onclick = () => {
      ov.remove();
      if (clear.checked) {
        document.getElementById('card-container').innerHTML = '';
        Object.keys(window.addedCounts).forEach(v=>window.addedCounts[v]=0);
      }
      const toks = (area.value||'').trim().split(/\s+/).filter(Boolean);
      toks.forEach(tok => {
        const [a,b] = tok.split('-');
        if (b) window.addCard(`${a}-${b}`);
      });
    };
  };

  // — Print, Full Proxy, Reset —
  btnPrint.onclick = () => {
    document.getElementById('top-bar').style.display='none';
    window.print();
    setTimeout(()=>document.getElementById('top-bar').style.display='',0);
  };
  btnFullProxy.onclick = () => {
    document.querySelectorAll('#card-container img.card-img')
      .forEach(img => img.src = img.dataset.fullArt);
  };
  btnReset.onclick = () => {
    document.getElementById('card-container').innerHTML = '';
    Object.keys(window.addedCounts).forEach(v=>window.addedCounts[v]=0);
    updateCount();
  };

  // — Live MutationObserver —
  new MutationObserver(() => {
    updateCount();
    new Set(
      [...document.querySelectorAll('.card[data-variant]')]
        .map(c=>c.dataset.variant)
    ).forEach(refreshBadge);
  }).observe(document.getElementById('card-container'),{childList:true});

  // — Overview builder & wiring —
  function wireOverview(listEl) {
    listEl.querySelectorAll('.overview-inc').forEach(b =>
      b.onclick = () => window.addCard(b.dataset.vn) && buildOverview()
    );
    listEl.querySelectorAll('.overview-dec').forEach(b =>
      b.onclick = () => window.removeCard(b.dataset.vn) && buildOverview()
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

    const typesOrder = ['Legend','Runes','Battlefield','Units','Spells'];
    const groups     = {};

    // build from addedCounts (keeps zero rows)
    Object.entries(window.addedCounts).forEach(([vn,c])=>{
      groups['All'] = groups['All']||{};
      groups['All'][vn] = c;
    });

    const listEl = document.getElementById('overview-list');
    typesOrder.concat(Object.keys(groups).filter(t=>!typesOrder.includes(t)))
      .forEach(type => {
        const data = groups[type] || (type==='All'?groups['All']:null);
        if (!data) return;
        const total = Object.values(data).reduce((a,b)=>a+b,0);
        const sec   = document.createElement('div');
        sec.className  = 'overview-section';
        sec.innerHTML = `<h3>${type} (${total})</h3>`;

        Object.entries(data).forEach(([vn, count])=>{
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

  btnOverview.onclick = buildOverview;

  // — Restore on load —
  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    Object.entries(window.addedCounts).forEach(([vn,c])=>{
      for(let i=0;i<c;i++) window.addCard(vn);
    });
    updateCount();
  });

})();
