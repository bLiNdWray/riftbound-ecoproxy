(function() {
  const TOPBAR_HEIGHT = 50;

  // — Elements —
  const btnImport    = document.getElementById('btn-import');
  const btnPrint     = document.getElementById('btn-print');
  const btnOverview  = document.getElementById('btn-overview');
  const btnFullProxy = document.getElementById('btn-full-proxy');
  const btnReset     = document.getElementById('btn-reset');
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
  const before = document.querySelectorAll(`[data-variant="${vn}"]`).length;
  origAdd(vn);
  return document.querySelectorAll(`[data-variant="${vn}"]`).length > before;
};

  
const origRm = window.removeCard;
window.removeCard = function(vn, el) {
  // find a real cardEl if none passed
  const cardEl = el || document.querySelector(`[data-variant="${vn}"]`);
  if (!cardEl) return false;
  origRm(vn, cardEl);
  return true;
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
document
  .querySelectorAll('#card-container .card[data-variant]')
  .forEach(card => {
    const vn   = card.getAttribute('data-variant');
    // figure out type from its CSS class
    const type = card.classList.contains('legend')      ? 'Legend'
               : card.classList.contains('rune')        ? 'Runes'
               : card.classList.contains('battlefield') ? 'Battlefield'
               : card.classList.contains('unit')        ? 'Units'
               : card.classList.contains('spell')       ? 'Spells'
               : card.classList.contains('gear')        ? 'Gear'
               : 'Other';

    groups[type] = groups[type] || {};
    groups[type][vn] = (groups[type][vn] || 0) + 1;
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

// — Wire up Overview buttons — 
function wireOverviewButtons(listEl) {
  // “+” buttons
  listEl.querySelectorAll('.overview-inc').forEach(btn => {
    btn.addEventListener('click', () => {
      const vn = btn.dataset.vn;
      if (window.addCard(vn)) {
        buildOverview();
      }
    });
  });

  // “–” buttons
  listEl.querySelectorAll('.overview-dec').forEach(btn => {
    btn.addEventListener('click', () => {
      const vn = btn.dataset.vn;
      if (window.removeCard(vn)) {
        buildOverview();
      }
    });
  });
}

// — Overview Builder —
function buildOverview() {
  // Remove any existing modal
  const prev = document.getElementById('overview-modal');
  if (prev) prev.remove();

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id        = 'overview-modal';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content">
      <button id="close-overview" class="modal-close">×</button>
      <h2>Overview</h2>
      <div id="overview-list"></div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#close-overview').onclick = () => overlay.remove();

  // Define the order
  const typesOrder = ['Legend','Runes','Battlefield','Units','Spells'];
 // 1) Group from cardCounts
  const groups = {};
  Object.entries(window.cardCounts).forEach(([vn, count]) => {
    const cardEl = document.querySelector(`#card-container .card[data-variant="${vn}"]`);
    const type = cardEl
      ? ( cardEl.classList.contains('legend')      ? 'Legend'
        : cardEl.classList.contains('rune')        ? 'Runes'
        : cardEl.classList.contains('battlefield') ? 'Battlefield'
        : cardEl.classList.contains('unit')        ? 'Units'
        : cardEl.classList.contains('spell')       ? 'Spells'
        : cardEl.classList.contains('gear')        ? 'Gear'
        : 'Other')
      : 'Other';
    groups[type] = groups[type] || {};
    groups[type][vn] = count;
  });

  // 2) Render each type in order…
  const typesOrder = ['Legend','Runes','Battlefield','Units','Spells'];
  const listEl = document.getElementById('overview-list');
  typesOrder
    .concat(Object.keys(groups).filter(t=>!typesOrder.includes(t)))
    .forEach(type => {
      const sectionData = groups[type];
      if (!sectionData) return;
      const total = Object.values(sectionData).reduce((a,b)=>a+b,0);
      const section = document.createElement('div');
      section.className = 'overview-section';
      section.innerHTML = `<h3>${type} (${total})</h3>`;

      Object.entries(sectionData).forEach(([vn, count]) => {
        const cardEl = document.querySelector(`#card-container .card[data-variant="${vn}"]`);
        const name  = cardEl?.dataset.name || vn;
        const logo  = cardEl?.dataset.colorLogo || '';
        const row   = document.createElement('div');
        row.className = 'overview-item';
        row.innerHTML = `
          <img src="${logo}" class="overview-logo"/>
          <span class="overview-text">${name} – ${vn}</span>
          <button class="overview-dec" data-vn="${vn}">−</button>
          <span class="overview-count">${count}</span>
          <button class="overview-inc" data-vn="${vn}">+</button>
        `;
        section.appendChild(row);
      });

      listEl.appendChild(section);
    });

  // 3) Wire buttons to re-render entire Overview
  wireOverviewButtons(listEl);
}
   
// — Live Recount via MutationObserver —
(() => {
 const observer = new MutationObserver(() => {
  updateCount();
  // refreshBadge for every variant left in the DOM
  new Set(
    [...document.querySelectorAll('.card[data-variant]')]
      .map(c=>c.getAttribute('data-variant'))
  ).forEach(refreshBadge);
});
observer.observe(document.getElementById('card-container'), { childList: true });

})();
})();
