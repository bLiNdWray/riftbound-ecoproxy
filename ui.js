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

  // ===== Wrap addCard/removeCard with state updates =====
  const origAdd = window.addCard;
  window.addCard = function(vn) {
    const before = document.querySelectorAll(`[data-variant="${vn}"]`).length;
    const added = origAdd(vn);
    if (added) {
      // update internal counts and UI
      window.cardCounts[vn] = (window.cardCounts[vn] || 0) + 1;
      saveState();
      refreshBadge(vn);
      updateCount();
    }
    return added;
  };

  const origRm = window.removeCard;
  window.removeCard = function(vn, el) {
    const cardEl = el || document.querySelector(`[data-variant="${vn}"]`);
    if (!cardEl) return false;
    const removed = origRm(vn, cardEl);
    if (removed && window.cardCounts[vn]) {
      window.cardCounts[vn] = window.cardCounts[vn] - 1;
      if (window.cardCounts[vn] <= 0) delete window.cardCounts[vn];
      saveState();
      refreshBadge(vn);
      updateCount();
    }
    return removed;
  };

  // ===== Helpers =====
  function refreshBadge(vn) {
    const count = window.cardCounts[vn] || 0;
    document.querySelectorAll(
      `#card-container .card[data-variant="${vn}"] .qty-badge`
    ).forEach(b => b.textContent = count);
  }

  function updateCount() {
    const total = Object.values(window.cardCounts).reduce((a, b) => a + b, 0);
    if (countLabel) countLabel.textContent = total + ' card' + (total !== 1 ? 's' : '');
  }

  // ===== On Load: Initialize badges =====
  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    Object.keys(window.cardCounts).forEach(vn => {
      refreshBadge(vn);
    });
    updateCount();
  });

  // — Import List Modal —
  btnImport.addEventListener('click',()=>{
    // remove old
    const prev = document.getElementById('import-modal');
    if(prev) prev.remove();

    // build modal...
    const overlay = document.createElement('div');
    overlay.id = 'import-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `...`;
    document.body.appendChild(overlay);
    // handlers omitted for brevity
  });

  // — Other Top-Bar Buttons —
  btnPrint.addEventListener('click',()=>{ /* unchanged */ });
  btnOverview.addEventListener('click', buildOverview);
  btnFullProxy.addEventListener('click',()=>{ /* unchanged */ });
  btnReset.addEventListener('click',()=>{ /* clear state */ });

  // Function to wire Overview modal buttons
  function wireOverviewButtons(listEl) { /* unchanged */ }

  // Overview Builder
  function buildOverview() {
    const prev = document.getElementById('overview-modal');
    if (prev) prev.remove();
    const overlay = document.createElement('div');
    overlay.id        = 'overview-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `...`;
    document.body.appendChild(overlay);
    overlay.querySelector('#close-overview').onclick = () => overlay.remove();

    // Rebuild list from state
    const typesOrder = ['Legend','Runes','Battlefield','Units','Spells'];
    const groups = {};
    Object.entries(window.cardCounts).forEach(([vn, count]) => {
      const cardEl = document.querySelector(
        `#card-container .card[data-variant="${vn}"]`
      );
      const type = cardEl ? determineType(cardEl) : 'Other';
      groups[type] = groups[type] || {};
      groups[type][vn] = count;
    });
    const listEl = overlay.querySelector('#overview-list');
    typesOrder.concat(Object.keys(groups).filter(t => !typesOrder.includes(t)))
      .forEach(type => {
        const sectionData = groups[type];
        if (!sectionData) return;
        // build each section and item similar to before
      });
    wireOverviewButtons(listEl);
  }

  function determineType(cardEl) { /* logic unchanged */ }

  // Live Recount via MutationObserver
  (() => { /* optional based on state */ })();
})();
