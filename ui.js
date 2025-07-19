(function() {
  // Top-bar buttons
  const btnImport    = document.getElementById('btn-import');
  const btnPrint     = document.getElementById('btn-print');
  const btnOverview  = document.getElementById('btn-overview');
  const btnFullProxy = document.getElementById('btn-full-proxy');
  const btnReset     = document.getElementById('btn-reset');
  const countLabel   = document.getElementById('card-count');
  const TOPBAR_HEIGHT = 50; // px

  // State
  window.cardCounts = {};

  // — Persistence —
  function saveState() {
    localStorage.setItem('riftboundCardCounts', JSON.stringify(window.cardCounts));
  }
  function loadState() {
    try {
      const s = localStorage.getItem('riftboundCardCounts');
      window.cardCounts = s ? JSON.parse(s) : {};
    } catch {
      window.cardCounts = {};
    }
  }

  // — Helpers —
  function updateCount() {
    const total = Object.values(window.cardCounts).reduce((a,b) => a + b, 0);
    countLabel.textContent = total + ' card' + (total !== 1 ? 's' : '');
  }
  function refreshBadge(vn) {
    const b = document.querySelector(`[data-variant="${vn}"] .qty-badge`);
    if (b) b.textContent = window.cardCounts[vn] || 0;
  }

  // — Wrap addCard/removeCard from script.js —
  const origAdd = typeof window.addCard === 'function'
    ? window.addCard
    : () => {};
  window.addCard = function(vn) {
    const before = document.querySelectorAll(`[data-variant="${vn}"]`).length;
    origAdd(vn);
    const after = document.querySelectorAll(`[data-variant="${vn}"]`).length;
    if (after > before) {
      window.cardCounts[vn] = (window.cardCounts[vn]||0) + 1;
      saveState();
      refreshBadge(vn);
      updateCount();
      return true;
    }
    return false;
  };

  const origRm = typeof window.removeCard === 'function'
    ? window.removeCard
    : () => {};
  window.removeCard = function(vn, el) {
    origRm(vn, el);
    if (window.cardCounts[vn] > 1) {
      window.cardCounts[vn]--;
    } else {
      delete window.cardCounts[vn];
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    saveState();
    refreshBadge(vn);
    updateCount();
  };

  // — Import List Modal —
  btnImport.addEventListener('click', function(){
    // remove any existing
    const prev = document.getElementById('import-modal');
    if (prev) prev.remove();

    // build overlay
    const overlay = document.createElement('div');
    overlay.id = 'import-modal';
    overlay.className = 'modal-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: TOPBAR_HEIGHT + 'px',
      left: 0,
      width: '100%',
      height: `calc(100% - ${TOPBAR_HEIGHT}px)`,
      overflowY: 'auto',
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'start',
      padding: '20px 0',
      zIndex: 2000
    });

    overlay.innerHTML = `
      <div class="modal-content" style="background:#fff;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);width:90%;max-width:600px;position:relative;padding:16px;">
        <button id="close-import" class="modal-close" style="position:absolute;top:8px;right:8px;border:none;background:transparent;font-size:1.25rem;cursor:pointer;">×</button>
        <h2>Import List</h2>
        <textarea id="import-area" style="width:100%;height:200px;font-family:monospace;border:1px solid #ccc;border-radius:4px;padding:8px;margin-top:8px;" placeholder="e.g. OGN-045-03 OGN-046-02"></textarea>
        <label style="display:block;margin:8px 0;">
          <input type="checkbox" id="import-clear" /> Clear existing cards before import
        </label>
        <div style="text-align:right;margin-top:12px;">
          <button id="import-cancel" class="topbar-btn" style="background:#007bff;color:#fff;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;margin-left:8px;">Cancel</button>
          <button id="import-ok" class="topbar-btn" style="background:#007bff;color:#fff;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;margin-left:8px;">Import</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    // refs
    const areaEl   = overlay.querySelector('#import-area');
    const clearChk = overlay.querySelector('#import-clear');
    const closeBtn = overlay.querySelector('#close-import');
    const cancelBtn = overlay.querySelector('#import-cancel');
    const okBtn    = overlay.querySelector('#import-ok');

    // wire up
    closeBtn.onclick  = () => overlay.remove();
    cancelBtn.onclick = () => overlay.remove();

    // prefill with current variants
    areaEl.value = Object.keys(window.cardCounts).join(' ');

    okBtn.onclick = function(){
      overlay.remove();

      if (clearChk.checked) {
        document.getElementById('card-container').innerHTML = '';
        window.cardCounts = {};
      }

      const tokens = (areaEl.value||'').trim().split(/\s+/).filter(Boolean);
      tokens.forEach(tok => {
        const parts = tok.split('-');
        if (parts.length < 2) return;
        const vn = parts[0] + '-' + parts[1];
        window.addCard(vn);
      });

      saveState();
      updateCount();
    };
  });

  // — Other Top-Bar Buttons —
  btnPrint.addEventListener('click', function(){
    document.getElementById('top-bar').style.display = 'none';
    document.getElementById('search-modal').classList.add('hidden');
    window.print();
    setTimeout(() => document.getElementById('top-bar').style.display = '', 0);
  });
  btnOverview.addEventListener('click', buildOverview);
  btnFullProxy.addEventListener('click', function(){
    fullProxy = !fullProxy;
    Object.keys(window.cardCounts).forEach(vn => {
      const img = document.querySelector(`[data-variant="${vn}"] img.card-img`);
      if (img) img.src = fullProxy ? img.dataset.fullArt : img.dataset.proxyArt;
    });
  });
  btnReset.addEventListener('click', function(){
    window.cardCounts = {};
    document.getElementById('card-container').innerHTML = '';
    saveState();
    updateCount();
  });

  // — On Load: Restore State —
  document.addEventListener('DOMContentLoaded', function(){
    loadState();
    Object.entries(window.cardCounts).forEach(([vn,c]) => {
      for (let i = 0; i < c; i++) window.addCard(vn);
    });
    updateCount();
  });

  // — Overview Builder —
  function buildOverview(){
    const prev = document.getElementById('overview-modal');
    if (prev) prev.remove();

    const overlay = document.createElement('div');
    overlay.id = 'overview-modal';
    overlay.className = 'modal-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: TOPBAR_HEIGHT + 'px',
      left: 0,
      width: '100%',
      height: `calc(100% - ${TOPBAR_HEIGHT}px)`,
      overflowY: 'auto',
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'start',
      padding: '20px 0',
      zIndex: 2000
    });

    overlay.innerHTML = `
      <div class="modal-content" style="background:#fff;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);width:90%;max-width:600px;position:relative;padding:16px;">
        <button id="close-overview" class="modal-close" style="position:absolute;top:8px;right:8px;border:none;background:transparent;font-size:1.25rem;cursor:pointer;">×</button>
        <h2>Overview</h2>
        <div id="overview-list"></div>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('#close-overview').onclick = () => overlay.remove();

    const order = ['Legend','Runes','Units','Spells','Gear','Battlefield'];
    const grp = {};
    Object.keys(window.cardCounts).forEach(vn => {
      const el = document.querySelector(`[data-variant="${vn}"]`);
      const t = el && el.dataset.type ? el.dataset.type : 'Other';
      (grp[t] = grp[t]||[]).push(vn);
    });

    const listEl = document.getElementById('overview-list');
    order.forEach(type => {
      if (!grp[type]) return;
      const sec = document.createElement('div');
      const h   = document.createElement('h3');
      h.textContent = type;
      sec.appendChild(h);
      grp[type].forEach(vn => {
        const el    = document.querySelector(`[data-variant="${vn}"]`);
        const name  = el && el.dataset.name ? el.dataset.name : vn;
        const setNo = el && el.dataset.set  ? el.dataset.set  : '';
        const logo  = el && el.dataset.colorLogo ? el.dataset.colorLogo : '';
        const row   = document.createElement('div');
        row.className = 'overview-item';
        row.innerHTML = `
          <img src="${logo}" class="overview-logo"/>
          <span>${name} (${setNo})</span>
          <button class="overview-dec" data-vn="${vn}">–</button>
          <span class="overview-count">${window.cardCounts[vn]}</span>
          <button class="overview-inc" data-vn="${vn}">+</button>`;
        sec.appendChild(row);
      });
      listEl.appendChild(sec);
    });
  }

})();
