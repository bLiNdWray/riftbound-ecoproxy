// ui.js — full updated file
(function() {
  const TOPBAR_HEIGHT = 50;

  // — Elements —
  const btnImport    = document.getElementById('btn-import');
  const btnPrint     = document.getElementById('btn-print');
  const btnOverview  = document.getElementById('btn-overview');
  const btnFullProxy = document.getElementById('btn-full-proxy');
  const btnReset     = document.getElementById('btn-reset');
  const countLabel   = document.getElementById('card-count');
  const container    = document.getElementById('card-container');

  // — State —
  window.cardCounts = {};
  let isImporting   = false;
  let fullProxy     = false;

  // ===== Persistence =====
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
    const badge = document.querySelector(`.badge[data-variant="${vn}"]`);
    if (badge) badge.textContent = window.cardCounts[vn] || 0;
    updateTotalCount();
  }
  function updateTotalCount() {
    const total = Object.values(window.cardCounts).reduce((a, b) => a + b, 0);
    countLabel.textContent = total;
  }
  function addCard(vn) {
    window.cardCounts[vn] = (window.cardCounts[vn] || 0) + 1;
    saveState();
    return true;
  }
  function removeCard(vn) {
    if ((window.cardCounts[vn] || 0) > 0) {
      window.cardCounts[vn]--;
      saveState();
      return true;
    }
    return false;
  }

  // ===== Mutation Observer =====
  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      if (m.type === 'childList') {
        // whenever cards load/change, refresh all badges
        Object.keys(window.cardCounts).forEach(refreshBadge);
      }
    });
    updateTotalCount();
  });

  // — Other Top-Bar Buttons —
  btnImport.addEventListener('click', importCards);
  btnPrint.addEventListener('click', () => {
    document.getElementById('top-bar').style.display = 'none';
    document.getElementById('search-modal').classList.add('hidden');
    window.print();
    setTimeout(() => document.getElementById('top-bar').style.display = '', 0);
  });
  btnOverview.addEventListener('click', buildOverview);
  btnFullProxy.addEventListener('click', () => {
    fullProxy = !fullProxy;
    Object.keys(window.cardCounts).forEach(vn => {
      const img = document.querySelector(`.card[data-variant="${vn}"] img.card-img`);
      if (img) img.src = fullProxy ? img.dataset.fullSrc : img.dataset.thumbSrc;
    });
  });
  btnReset.addEventListener('click', () => {
    window.cardCounts = {};
    saveState();
    document.querySelectorAll('.badge[data-variant]').forEach(b => b.textContent = 0);
    updateTotalCount();
  });

  // — Overview Builder & Wiring —
  function buildOverview() {
    // remove existing
    const prev = document.getElementById('overview-modal');
    if (prev) prev.remove();

    // overlay + modal
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

    // close button
    overlay.querySelector('#close-overview').addEventListener('click', () => overlay.remove());

    // grouping by type
    const order = ['Units','Spells','Gear','Runes','Legend','Battlefield','Other'];
    const groups = {};

    Object.entries(window.cardCounts).forEach(([vn, cnt]) => {
      if (cnt <= 0) return;
      const cardEl = document.querySelector(`.card[data-variant="${vn}"]`);
      let type = 'Other';
      if (cardEl) {
        if (cardEl.classList.contains('unit'))           type = 'Units';
        else if (cardEl.classList.contains('spell'))      type = 'Spells';
        else if (cardEl.classList.contains('gear'))       type = 'Gear';
        else if (cardEl.classList.contains('rune'))       type = 'Runes';
        else if (cardEl.classList.contains('legend'))     type = 'Legend';
        else if (cardEl.classList.contains('battlefield'))type = 'Battlefield';
      }
      groups[type] = groups[type] || {};
      groups[type][vn] = cnt;
    });

    // render sections
    const listEl = document.getElementById('overview-list');
    order.forEach(type => {
      const data = groups[type];
      if (!data) return;
      const sec = document.createElement('div');
      sec.className = 'overview-section';
      const total = Object.values(data).reduce((sum, c) => sum + c, 0);
      sec.innerHTML = `<h3>${type} (${total})</h3>`;
      Object.entries(data).forEach(([vn, cnt]) => {
        const row = document.createElement('div');
        row.className = 'overview-item';
        row.innerHTML = `
          <span class="overview-text">${vn}</span>
          <button class="overview-dec" data-vn="${vn}">−</button>
          <span class="overview-count">${cnt}</span>
          <button class="overview-inc" data-vn="${vn}">+</button>
        `;
        sec.appendChild(row);
      });
      listEl.appendChild(sec);
    });

    // wire controls
    listEl.querySelectorAll('.overview-inc').forEach(btn => {
      btn.addEventListener('click', () => {
        const vn = btn.dataset.vn;
        if (addCard(vn)) buildOverview();
      });
    });
    listEl.querySelectorAll('.overview-dec').forEach(btn => {
      btn.addEventListener('click', () => {
        const vn = btn.dataset.vn;
        if (removeCard(vn)) buildOverview();
      });
    });
  }

  // ===== Initialize =====
  loadState();
  observer.observe(container, { childList: true });
  // initial badge refresh
  Object.keys(window.cardCounts).forEach(refreshBadge);
  updateTotalCount();

})();
