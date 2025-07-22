(function() {
  const TOPBAR_HEIGHT = 50;

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

  // — State & persistence helpers —
  window.cardCounts = {};
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

  // — UI Helpers —
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
    if (countLabel) {
      countLabel.textContent = total + ' card' + (total !== 1 ? 's' : '');
    }
  }

  // — Wrap addCard/removeCard to update cardCounts —
  const origAdd = typeof window.addCard === 'function' ? window.addCard : () => false;
  window.addCard = function(vn) {
    const before = document.querySelectorAll(
      `#card-container .card[data-variant="${vn}"]`
    ).length;
    const ok = origAdd(vn);
    if (ok) {
      window.cardCounts[vn] = (window.cardCounts[vn]||0) + 1;
      saveState();
    }
    return ok;
  };

  const origRm = typeof window.removeCard === 'function' ? window.removeCard : () => false;
  window.removeCard = function(vn, el) {
    const cardEl = el || document.querySelector(
      `#card-container .card[data-variant="${vn}"]`
    );
    if (!cardEl) return false;
    const ok = origRm(vn, cardEl);
    if (ok && typeof window.cardCounts[vn] === 'number') {
      window.cardCounts[vn] = Math.max(0, window.cardCounts[vn] - 1);
      saveState();
    }
    return ok;
  };

  // — Search modal handlers —
  if (openSearchBtn && closeSearchBtn && searchModal) {
    openSearchBtn.addEventListener('click', () => {
      searchModal.classList.remove('hidden');
    });
    closeSearchBtn.addEventListener('click', () => {
      searchModal.classList.add('hidden');
    });
  }

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
      </div>
    `;
    document.body.appendChild(overlay);

    const areaEl   = overlay.querySelector('#import-area');
    const clearChk = overlay.querySelector('#import-clear');
    const closeBtn = overlay.querySelector('#close-import');
    const cancelBtn= overlay.querySelector('#import-cancel');
    const okBtn    = overlay.querySelector('#import-ok');

    closeBtn.onclick  = () => overlay.remove();
    cancelBtn.onclick = () => overlay.remove();
    areaEl.value      = Object.keys(window.cardCounts).join(' ');

    okBtn.onclick = () => {
      overlay.remove();
      if (clearChk.checked) {
        document.getElementById('card-container').innerHTML = '';
        Object.keys(window.cardCounts).forEach(vn => window.cardCounts[vn] = 0);
      }
      const tokens = (areaEl.value||'').trim().split(/\s+/).filter(Boolean);
      tokens.forEach(tok => {
        const parts = tok.split('-');
        if (parts.length >= 2) window.addCard(`${parts[0]}-${parts[1]}`);
      });
    };
  });

  // — Print —
  btnPrint.addEventListener('click', () => {
    document.getElementById('top-bar').style.display = 'none';
    window.print();
    setTimeout(() => document.getElementById('top-bar').style.display = '', 0);
  });

  // — Full Proxy Toggle (just flips images) —
  btnFullProxy.addEventListener('click', () => {
    document.querySelectorAll('#card-container .card img.card-img').forEach(img => {
      img.src = img.dataset.fullArt || img.src;
    });
  });

  // — Reset —
  btnReset.addEventListener('click', () => {
    document.getElementById('card-container').innerHTML = '';
    Object.keys(window.cardCounts).forEach(vn => window.cardCounts[vn] = 0);
    updateCount();
  });

  // — MutationObserver for live badge & counter updates —
  (function(){
    const container = document.getElementById('card-container');
    if (!container) return;
    const observer = new MutationObserver(() => {
      updateCount();
      new Set(
        [...container.querySelectorAll('.card[data-variant]')]
          .map(c => c.getAttribute('data-variant'))
      ).forEach(refreshBadge);
    });
    observer.observe(container, { childList: true });
  })();

  // — Wire +/– buttons by re-rendering Overview —
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

  // — Overview Builder —
  function buildOverview() {
    const prev = document.getElementById('overview-modal');
    if (prev) prev.remove();

    const overlay = document.createElement('div');
    overlay.id = 'overview-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content">
        <button id="close-overview" class="modal-close">×</button>
        <h2>Overview</h2>
        <div id="overview-list"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#close-overview').onclick = () => overlay.remove();

    const typesOrder = ['Legend','Runes','Battlefield','Units','Spells'];
    const groups     = {};

    // Build grouping from cardCounts (keeps zero-count rows)
    Object.entries(window.cardCounts).forEach(([vn, count]) => {
      // determine type via DOM
      const cardEl = document.querySelector(`#card-container .card[data-variant="${vn}"]`);
      const type = cardEl
        ? (cardEl.classList.contains('legend')      ? 'Legend'
         : cardEl.classList.contains('rune')         ? 'Runes'
         : cardEl.classList.contains('battlefield')  ? 'Battlefield'
         : cardEl.classList.contains('unit')         ? 'Units'
         : cardEl.classList.contains('spell')        ? 'Spells'
         : cardEl.classList.contains('gear')         ? 'Gear'
         : 'Other')
        : 'Other';
      groups[type] = groups[type] || {};
      groups[type][vn] = count;
    });

    const listEl = document.getElementById('overview-list');
    typesOrder
      .concat(Object.keys(groups).filter(t => !typesOrder.includes(t)))
      .forEach(type => {
        const data = groups[type];
        if (!data) return;
        const total = Object.values(data).reduce((a,b) => a+b, 0);
        const section = document.createElement('div');
        section.className = 'overview-section';
        section.innerHTML = `<h3>${type} (${total})</h3>`;

        Object.entries(data).forEach(([vn,count]) => {
          const cardEl = document.querySelector(`#card-container .card[data-variant="${vn}"]`);
          const name   = cardEl?.dataset.name || vn;
          const logo   = cardEl?.dataset.colorLogo || '';
          const row    = document.createElement('div');
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

  // — Hook top‐bar Overview button —
  btnOverview.addEventListener('click', buildOverview);

  // — Initial load from state & URL —
  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    Object.entries(window.cardCounts).forEach(([vn,count]) => {
      for (let i = 0; i < count; i++) window.addCard(vn);
    });
    updateCount();
  });
})();
