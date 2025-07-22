(function() {
  const TOPBAR_HEIGHT = 50;

  // — Elements —
  const btnImport    = document.getElementById('btn-import');
  const btnPrint     = document.getElementById('btn-print');
  const btnOverview  = document.getElementById('btn-overview');
  const btnFullProxy = document.getElementById('btn-full-proxy');
  // const btnReset     = document.getElementById('btn-reset');
  const countLabel   = document.getElementById('card-count');

  // — State —
  window.cardCounts = {};
  let isImporting   = false;
  let fullProxy     = false;

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

 // ===== Helpers =====
function refreshBadge(vn) {
  // count DOM elements for this variant
  const count = document.querySelectorAll(
    `#card-container .card[data-variant="${vn}"]`
  ).length;
  const badge = document.querySelector(
    `#card-container .card[data-variant="${vn}"] .qty-badge`
  );
  if (badge) badge.textContent = count;
}

function updateCount() {
  // total = all cards in container
  const total = document.querySelectorAll('#card-container .card').length;
  const lbl   = document.getElementById('card-count');
  if (lbl) lbl.textContent = total + ' card' + (total !== 1 ? 's' : '');
}

// ===== Wrap addCard/removeCard =====
const origAdd = window.addCard;
window.addCard = function(vn) {
  const beforeDOM = document.querySelectorAll(
    `#card-container .card[data-variant="${vn}"]`
  ).length;
  origAdd(vn);
  const afterDOM = document.querySelectorAll(
    `#card-container .card[data-variant="${vn}"]`
  ).length;
  if (afterDOM > beforeDOM) {
    // only refresh the badge for this vn
    refreshBadge(vn);
    // and update the global counter
    updateCount();
    return true;
  }
  return false;
};

const origRm = window.removeCard;
window.removeCard = function(vn, el) {
  origRm(vn, el);
  // after DOM removal, update this badge & total
  refreshBadge(vn);
  updateCount();
};

// ===== On Load: Recount everything =====
document.addEventListener('DOMContentLoaded', () => {
  // once cards are initially drawn:
  document.querySelectorAll('#card-container .card').forEach(card => {
    const vn = card.getAttribute('data-variant');
    refreshBadge(vn);
  });
  updateCount();
});


  // — Import List Modal —
  btnImport.addEventListener('click',()=>{
    // remove old
    const prev = document.getElementById('import-modal');
    if(prev) prev.remove();

    // build modal (inline styles removed)
    const overlay = document.createElement('div');
    overlay.id = 'import-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content">
        <button id="close-import" class="modal-close">×</button>
        <h2>Import List</h2>
        <textarea id="import-area" placeholder="e.g. OGN-045-03 OGN-046-02"></textarea>
        <label><input type="checkbox" id="import-clear" /> Clear existing cards before import</label>
        <div class="modal-actions">
          <button id="import-cancel" class="topbar-btn">Cancel</button>
          <button id="import-ok"     class="topbar-btn">Import</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    // refs
    const areaEl   = overlay.querySelector('#import-area');
    const clearChk = overlay.querySelector('#import-clear');
    const closeBtn = overlay.querySelector('#close-import');
    const cancelBtn= overlay.querySelector('#import-cancel');
    const okBtn    = overlay.querySelector('#import-ok');

    closeBtn.onclick  = ()=>overlay.remove();
    cancelBtn.onclick = ()=>overlay.remove();

    // prefill
    areaEl.value = Object.keys(window.cardCounts).join(' ');

    okBtn.onclick = ()=>{
      overlay.remove();
      if(clearChk.checked) {
        document.getElementById('card-container').innerHTML = '';
        window.cardCounts = {};
        updateCount();
      }
      const tokens = (areaEl.value||'').trim().split(/\s+/).filter(Boolean);
      isImporting = true;
      tokens.forEach(tok=>{
        const parts = tok.split('-');
        if(parts.length<2) return;
        const vn = parts[0]+'-'+parts[1];
        window.addCard(vn);
      });
      isImporting = false;
      saveState();
      updateCount();
    };
  });

  // — Other Top-Bar Buttons —
  btnPrint.addEventListener('click',()=>{
    document.getElementById('top-bar').style.display='none';
    document.getElementById('search-modal').classList.add('hidden');
    window.print();
    setTimeout(()=>document.getElementById('top-bar').style.display='',0);
  });
  btnOverview.addEventListener('click',buildOverview);
  btnFullProxy.addEventListener('click',()=>{
    fullProxy = !fullProxy;
    Object.keys(window.cardCounts).forEach(vn=>{
      const img = document.querySelector(`[data-variant="${vn}"] img.card-img`);
      if(img) img.src = fullProxy ? img.dataset.fullArt : img.dataset.proxyArt;
    });
  });
  btnReset.addEventListener('click',()=>{
    window.cardCounts = {};
    document.getElementById('card-container').innerHTML = '';
    saveState();
    updateCount();
  });

  // — On Load: Restore State —
  document.addEventListener('DOMContentLoaded',()=>{
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
    overlay.innerHTML = `
      <div class="modal-content">
        <button id="close-overview" class="modal-close">×</button>
        <h2>Overview</h2>
        <div id="overview-list"></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#close-overview').onclick = ()=>overlay.remove();

    const order = ['Legend','Runes','Units','Spells','Gear','Battlefield'];
    const grp = {};
    Object.keys(window.cardCounts).forEach(vn=>{
      const el = document.querySelector(`[data-variant="${vn}"]`);
      const t  = el&&el.dataset.type?el.dataset.type:'Other';
      (grp[t]=grp[t]||[]).push(vn);
    });
    const listEl = document.getElementById('overview-list');
    order.forEach(type=>{
      if(!grp[type]) return;
      const sec = document.createElement('div');
      const h = document.createElement('h3');
      h.textContent = type; sec.appendChild(h);
      grp[type].forEach(vn=>{
        const el    = document.querySelector(`[data-variant="${vn}"]`);
        const name  = el&&el.dataset.name?el.dataset.name:vn;
        const setNo = el&&el.dataset.set?el.dataset.set:'';
        const logo  = el&&el.dataset.colorLogo?el.dataset.colorLogo:'';
        const row = document.createElement('div');
        row.className = 'overview-item';
        row.innerHTML=`
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
// — Live Recount via MutationObserver —
(() => {
  const container = document.getElementById('card-container');
  if (!container) return;

  const observer = new MutationObserver(() => {
    // Recount top-bar total
    updateCount();

    // Recount each variant’s badge
    // Gather all variants currently in the DOM
    const variants = new Set();
    container.querySelectorAll('.card[data-variant]').forEach(card => {
      variants.add(card.getAttribute('data-variant'));
    });
    // Update each badge
    variants.forEach(vn => refreshBadge(vn));
  });

  observer.observe(container, { childList: true });
})();
})();
