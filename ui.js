(function() {
  const TOPBAR_HEIGHT = 50; // px

  // — Elements —
  const openBtn     = document.getElementById('open-search');
  const searchModal = document.getElementById('search-modal');
  const closeSearch = document.getElementById('close-search');

  const btnImport    = document.getElementById('btn-import');
  const btnPrint     = document.getElementById('btn-print');
  const btnOverview  = document.getElementById('btn-overview');
  const btnFullProxy = document.getElementById('btn-full-proxy');
  const btnReset     = document.getElementById('btn-reset');
  const countLabel   = document.getElementById('card-count');

  // — State —
  window.cardCounts = {};
  let fullProxy     = false;
  let isImporting   = false;

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

  // — Counter Helpers —
  function updateCount() {
    const lbl = document.getElementById('card-count');
    const total = Object.values(window.cardCounts).reduce((a,b) => a + b, 0);
    if (lbl) lbl.textContent = total + ' card' + (total !== 1 ? 's' : '');
  }
  function refreshBadge(vn) {
    const b = document.querySelector(`[data-variant="${vn}"] .qty-badge`);
    if (b) b.textContent = window.cardCounts[vn] || 0;
  }

  // — Wrap script.js addCard/removeCard —
  const origAdd = typeof window.addCard === 'function' ? window.addCard : () => {};
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

  const origRm = typeof window.removeCard === 'function' ? window.removeCard : () => {};
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

  // — Search Modal Toggle (restore working) —
  if (searchModal) {
    searchModal.classList.add('hidden');
    openBtn.addEventListener('click', () => searchModal.classList.remove('hidden'));
    closeSearch.addEventListener('click', () => searchModal.classList.add('hidden'));
    searchModal.addEventListener('click', e => {
      if (e.target === searchModal) searchModal.classList.add('hidden');
    });
  }

  // — Import List Modal —
  btnImport.addEventListener('click', function(){
    const prev = document.getElementById('import-modal');
    if (prev) prev.remove();

    const overlay = document.createElement('div');
    overlay.id = 'import-modal';
    overlay.className = 'modal-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      top:    TOPBAR_HEIGHT + 'px',
      left:   0,
      width:  '100%',
      height: `calc(100% - ${TOPBAR_HEIGHT}px)`,
      background: 'rgba(0,0,0,0.4)',
      display:    'flex',
      justifyContent: 'center',
      alignItems: 'start',
      padding:    '20px 0',
      overflowY:  'auto',
      zIndex:     2000
    });
    overlay.innerHTML = `
      <div class="modal-content">
        <button id="close-import" class="modal-close">×</button>
        <h2>Import List</h2>
        <textarea id="import-area" placeholder="e.g. OGN-045-03 OGN-046-02"></textarea>
        <label><input type="checkbox" id="import-clear" /> Clear existing cards before import</label>
        <div style="text-align:right; margin-top:12px;">
          <button id="import-cancel" class="topbar-btn">Cancel</button>
          <button id="import-ok"     class="topbar-btn">Import</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const areaEl   = overlay.querySelector('#import-area');
    const clearChk = overlay.querySelector('#import-clear');
    const closeBtn = overlay.querySelector('#close-import');
    const cancelBtn= overlay.querySelector('#import-cancel');
    const okBtn    = overlay.querySelector('#import-ok');

    closeBtn.onclick  = () => overlay.remove();
    cancelBtn.onclick = () => overlay.remove();

    areaEl.value = Object.keys(window.cardCounts).join(' ');

    okBtn.onclick = function(){
      overlay.remove();
      if (clearChk.checked) {
        document.getElementById('card-container').innerHTML = '';
        window.cardCounts = {};
        updateCount();
      }
      const tokens = (areaEl.value||'').trim().split(/\s+/).filter(Boolean);
      isImporting = true;
      tokens.forEach(tok => {
        const parts = tok.split('-');
        if (parts.length < 2) return;
        const vn = parts[0] + '-' + parts[1];
        window.addCard(vn);
      });
      isImporting = false;
      saveState();
      updateCount();
    };
  });

  // — Other Top-Bar Buttons —
  btnPrint.addEventListener('click', ()=>{
    document.getElementById('top-bar').style.display = 'none';
    document.getElementById('search-modal').classList.add('hidden');
    window.print();
    setTimeout(()=>document.getElementById('top-bar').style.display = '', 0);
  });
  btnOverview.addEventListener('click', buildOverview);
  btnFullProxy.addEventListener('click', ()=>{
    fullProxy = !fullProxy;
    Object.keys(window.cardCounts).forEach(vn => {
      const img = document.querySelector(`[data-variant="${vn}"] img.card-img`);
      if (img) img.src = fullProxy ? img.dataset.fullArt : img.dataset.proxyArt;
    });
  });
  btnReset.addEventListener('click', ()=>{
    window.cardCounts = {};
    document.getElementById('card-container').innerHTML = '';
    saveState();
    updateCount();
  });

  // — On Load: Restore State —
  document.addEventListener('DOMContentLoaded', ()=>{
    loadState();
    Object.entries(window.cardCounts).forEach(([vn,c])=>{
      for(let i=0;i<c;i++) window.addCard(vn);
    });
    updateCount();
  });

  // — Overview Builder —
  function buildOverview(){
    const prev = document.getElementById('overview-modal');
    if(prev) prev.remove();
    const overlay = document.createElement('div');
    overlay.id = 'overview-modal';
    overlay.className = 'modal-overlay';
    Object.assign(overlay.style, {
      position:'fixed', top:TOPBAR_HEIGHT+'px', left:0,
      width:'100%', height:`calc(100% - ${TOPBAR_HEIGHT}px)`,
      background:'rgba(0,0,0,0.4)', display:'flex', justifyContent:'center',
      alignItems:'start', padding:'20px 0', overflowY:'auto', zIndex:2000
    });
    overlay.innerHTML = `
      <div class="modal-content">
        <button id="close-overview" class="modal-close">×</button>
        <h2>Overview</h2>
        <div id="overview-list"></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#close-overview').onclick = ()=>overlay.remove();

    const order=['Legend','Runes','Units','Spells','Gear','Battlefield'], grp={};
    Object.keys(window.cardCounts).forEach(vn=>{
      const el = document.querySelector(`[data-variant="${vn}"]`);
      const t  = el && el.dataset.type ? el.dataset.type : 'Other';
      (grp[t]=grp[t]||[]).push(vn);
    });
    const listEl = document.getElementById('overview-list');
    order.forEach(type=>{
      if(!grp[type]) return;
      const sec = document.createElement('div');
      const h   = document.createElement('h3'); h.textContent = type; sec.appendChild(h);
      grp[type].forEach(vn=>{
        const el    = document.querySelector(`[data-variant="${vn}"]`);
        const name  = el&&el.dataset.name?el.dataset.name:vn;
        const setNo = el&&el.dataset.set?el.dataset.set:'';
        const logo  = el&&el.dataset.colorLogo?el.dataset.colorLogo:'';
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
