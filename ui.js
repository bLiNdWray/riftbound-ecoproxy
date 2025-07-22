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
    const count = document.querySelectorAll(
      `#card-container .card[data-variant="${vn}"]`
    ).length;
    const badge = document.querySelector(
      `#card-container .card[data-variant="${vn}"] .qty-badge`
    );
    if (badge) badge.textContent = count;
  }

  function updateCount() {
    const total = Object.values(window.cardCounts).reduce((a, b) => a + b, 0);
    if (countLabel) countLabel.textContent = total + ' card' + (total !== 1 ? 's' : '');
  }

  // ===== Wrap addCard/removeCard =====
  const origAdd = window.addCard;
  window.addCard = function(vn) {
    const before = document.querySelectorAll(
      `#card-container .card[data-variant="${vn}"]`
    ).length;
    const result = origAdd(vn);
    const after = document.querySelectorAll(
      `#card-container .card[data-variant="${vn}"]`
    ).length;
    if (after > before) {
      window.cardCounts[vn] = (window.cardCounts[vn] || 0) + 1;
      saveState();
      updateCount();
      refreshBadge(vn);
      return true;
    }
    return false;
  };

  const origRm = window.removeCard;
  window.removeCard = function(vn, el) {
    const selector = `#card-container .card[data-variant=\"${vn}\"]`;
    const before = document.querySelectorAll(selector).length;
    const cardEl = el || document.querySelector(selector);
    if (!cardEl) return false;
    const result = origRm(vn, cardEl);
    const after = document.querySelectorAll(selector).length;
    if (after < before) {
      window.cardCounts[vn] = (window.cardCounts[vn] || 1) - 1;
      if (window.cardCounts[vn] <= 0) delete window.cardCounts[vn];
      saveState();
      updateCount();
      refreshBadge(vn);
      return true;
    }
    return false;
  };

  // ===== On Load: Restore state =====
  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    Object.entries(window.cardCounts).forEach(([vn, count]) => {
      for (let i = 0; i < count; i++) {
        origAdd(vn);
      }
    });
    Object.keys(window.cardCounts).forEach(refreshBadge);
    updateCount();
  });

  // — Import List Modal —
  btnImport.addEventListener('click', () => {
    const prev = document.getElementById('import-modal');
    if (prev) prev.remove();

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
          <button id="import-ok" class="topbar-btn">Import</button>
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

    okBtn.onclick = () => {
      overlay.remove();
      if (clearChk.checked) {
        document.getElementById('card-container').innerHTML = '';
        window.cardCounts = {};
        saveState();
        updateCount();
      }
      const tokens = (areaEl.value||'').trim().split(/\s+/).filter(Boolean);
      tokens.forEach(tok => {
        const parts = tok.split('-');
        if (parts.length<2) return;
        const vn = parts[0]+'-'+parts[1];
        window.addCard(vn);
      });
    };
  });

  // — Other Top-Bar Buttons —
  btnPrint.addEventListener('click', () => {
    document.getElementById('top-bar').style.display='none';
    document.getElementById('search-modal').classList.add('hidden');
    window.print();
    setTimeout(()=>document.getElementById('top-bar').style.display='',0);
  });
  btnOverview.addEventListener('click', buildOverview);
  btnFullProxy.addEventListener('click',()=>{ fullProxy = !fullProxy; });
  btnReset.addEventListener('click',()=>{
    window.cardCounts = {};
    saveState();
    document.getElementById('card-container').innerHTML = '';
    updateCount();
  });

  // Function to wire Overview modal buttons
  function wireOverviewButtons(listEl) {
    listEl.querySelectorAll('.overview-inc').forEach(btn => {
      btn.addEventListener('click', () => {
        const vn = btn.dataset.vn;
        if (window.addCard(vn)) buildOverview();
      });
    });
    listEl.querySelectorAll('.overview-dec').forEach(btn => {
      btn.addEventListener('click', () => {
        const vn = btn.dataset.vn;
        if (window.removeCard(vn)) buildOverview();
      });
    });
  }

  // Overview Builder
  function buildOverview() {
    const prev = document.getElementById('overview-modal');
    if (prev) prev.remove();

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

    const typesOrder = ['Legend','Runes','Battlefield','Units','Spells'];
    const groups = {};

    Object.entries(window.cardCounts).forEach(([vn, count]) => {
      groups['All'] = groups['All'] || {};
      groups['All'][vn] = count;
    });

    const listEl = document.getElementById('overview-list');
    if (Object.keys(groups).length === 0 || Object.keys(groups['All'] || {}).length === 0) {
      listEl.innerHTML = '<p class="overview-empty">No cards to display</p>';
      return;
    }

    Object.entries(groups['All']).forEach(([vn, count]) => {
      const cardEl = document.querySelector(
        `#card-container .card[data-variant="${vn}"]`
      );
      const name = cardEl?.dataset.name || vn;
      const logo = cardEl?.dataset.colorLogo || '';
      const row = document.createElement('div');
      row.className = 'overview-item';
      row.innerHTML = `
        <img src="${logo}" class="overview-logo" alt="icon"/>
        <span class="overview-text">${name} – ${vn}</span>
        <button class="overview-dec" data-vn="${vn}">−</button>
        <span class="overview-count">${count}</span>
        <button class="overview-inc" data-vn="${vn}">+</button>
      `;
      listEl.appendChild(row);
    });

    wireOverviewButtons(listEl);
  }
})();
