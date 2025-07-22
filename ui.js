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
    const total = document.querySelectorAll('#card-container .card').length;
    if (countLabel) countLabel.textContent = total + ' card' + (total !== 1 ? 's' : '');
  }

  // ===== MutationObserver for live updates =====
  const container = document.getElementById('card-container');
  const observer = new MutationObserver(() => {
    updateCount();
    new Set(
      [...container.querySelectorAll('.card[data-variant]')]
        .map(c => c.getAttribute('data-variant'))
    ).forEach(refreshBadge);
  });
  observer.observe(container, { childList: true });

  // ===== Wrap addCard/removeCard =====
  const origAdd = window.addCard;
  window.addCard = function(vn) {
    const before = document.querySelectorAll(`[data-variant="${vn}"]`).length;
    const added  = origAdd(vn);
    return added;
  };

  const origRm = window.removeCard;
  window.removeCard = function(vn, el) {
    const cardEl = el || document.querySelector(`[data-variant="${vn}"]`);
    if (!cardEl) return false;
    const removed = origRm(vn, cardEl);
    return removed;
  };

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

    okBtn.onclick = () => {
      overlay.remove();
      if (clearChk.checked) {
        container.innerHTML = '';
        window.cardCounts = {};
        saveState();
      }
      const tokens = (areaEl.value || '').trim().split(/\s+/).filter(Boolean);
      tokens.forEach(tok => {
        const parts = tok.split('-');
        if (parts.length < 2) return;
        const vn = parts[0] + '-' + parts[1];
        window.addCard(vn);
      });
      saveState();
    };
  });

  // — Other Top-Bar Buttons —
  btnPrint.addEventListener('click', () => {
    document.getElementById('top-bar').style.display = 'none';
    document.getElementById('search-modal').classList.add('hidden');
    window.print();
    setTimeout(() => document.getElementById('top-bar').style.display = '', 0);
  });

  btnOverview.addEventListener('click', buildOverview);

  btnFullProxy.addEventListener('click', () => {
    fullProxy = !fullProxy;
    // full proxy logic here
  });

  btnReset.addEventListener('click', () => {
    container.innerHTML = '';
    window.cardCounts = {};
    saveState();
  });

  // — On Load: Restore State —
  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    Object.entries(window.cardCounts).forEach(([vn, c]) => {
      for (let i = 0; i < c; i++) window.addCard(vn);
    });
  });

  // — Overview Builder & Wiring —
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
      const cardEl = document.querySelector(
        `#card-container .card[data-variant="${vn}"]`
      );
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

    const listEl = document.getElementById('overview-list');
    typesOrder
      .concat(Object.keys(groups).filter(t => !typesOrder.includes(t)))
      .forEach(type => {
        const sectionData = groups[type];
        if (!sectionData) return;
        const total = Object.values(sectionData).reduce((a,b) => a + b, 0);
        const section = document.createElement('div');
        section.className = 'overview-section';
        section.innerHTML = `<h3>${type} (${total})</h3>`;
        Object.entries(sectionData).forEach(([vn, count]) => {
          const cardEl = document.querySelector(
            `#card-container .card[data-variant="${vn}"]`
          );
          const name = cardEl?.dataset.name || vn;
          const logo = cardEl?.dataset.colorLogo || '';
          const row  = document.createElement('div');
          row.className = 'overview-item';
          row.innerHTML = `
            <img src="${logo}" class="overview-logo" alt="icon"/>
            <span class="overview-text">${name} – ${vn}</span>
            <button class="overview-dec" data-vn="${vn}">−</button>
            <span class="overview-count">${count}</span>
            <button class="overview-inc" data-vn="${vn}">+</button>
          `;
          section.appendChild(row);
        });
        listEl.appendChild(section);
      });

    wireOverviewButtons(listEl);
  }
})();
