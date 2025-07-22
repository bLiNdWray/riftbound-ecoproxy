(function() {
  const TOPBAR_HEIGHT = 50;

  // — Elements —
  const btnImport    = document.getElementById('btn-import');
  const btnPrint     = document.getElementById('btn-print');
  const btnOverview  = document.getElementById('btn-overview');
  const btnFullProxy = document.getElementById('btn-full-proxy');
  const btnReset     = document.getElementById('btn-reset');
  
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
    const cardEl = el || document.querySelector(`[data-variant="${vn}"]`);
    if (!cardEl) return false;
    origRm(vn, cardEl);
    return true;
  };

  // ===== On Load: Recount everything =====
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#card-container .card').forEach(card => {
      const vn = card.getAttribute('data-variant');
      refreshBadge(vn);
    });
    updateCount();
  });

  // — Import List Modal —
  btnImport.addEventListener('click',()=>{/* existing import code unchanged */});

  // — Other Top-Bar Buttons —
  btnPrint.addEventListener('click',()=>{/* existing print code unchanged */});
  btnOverview.addEventListener('click', buildOverview);
  btnFullProxy.addEventListener('click',()=>{/* existing fullProxy code unchanged */});
  btnReset.addEventListener('click',()=>{/* existing reset code unchanged */});

  document.addEventListener('DOMContentLoaded',()=>{
    loadState();
    Object.entries(window.cardCounts).forEach(([vn,c])=>{
      for(let i=0;i<c;i++) window.addCard(vn);
    });
    updateCount();
  });

  // ===== Overview Builder =====
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

    // Group by window.cardCounts
    const typesOrder = ['Legend','Runes','Battlefield','Units','Spells'];
    const groups = {};
    Object.entries(window.cardCounts).forEach(([vn, count]) => {
      if (count < 1) return;
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

  // Live Recount via MutationObserver
  (() => {
    const observer = new MutationObserver(() => {
      updateCount();
      Object.keys(window.cardCounts).forEach(refreshBadge);
    });
    observer.observe(document.getElementById('card-container'), { childList: true });
  })();
})();
