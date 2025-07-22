(function() {
  const TOPBAR_HEIGHT = 50;

  // — Element refs —
  const btnImport    = document.getElementById('btn-import');
  const btnPrint     = document.getElementById('btn-print');
  const btnOverview  = document.getElementById('btn-overview');
  const btnFullProxy = document.getElementById('btn-full-proxy');
  const btnReset     = document.getElementById('btn-reset');

  // — Helpers for UI —
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
    areaEl.value      = Object.keys(window.cardCounts).join(' ');

    okBtn.onclick = () => {
      overlay.remove();
      if (clearChk.checked) {
        document.getElementById('card-container').innerHTML = '';
        Object.keys(window.cardCounts).forEach(vn => window.cardCounts[vn] = 0);
        updateCount();
      }
      const tokens = (areaEl.value||'').trim().split(/\s+/).filter(Boolean);
      tokens.forEach(tok => {
        const [a,b] = tok.split('-');
        if (b) window.addCard(`${a}-${b}`);
      });
      updateCount();
    };
  });

  // — Print, FullProxy, Reset —
  btnPrint.addEventListener('click', () => {
    document.getElementById('top-bar').style.display = 'none';
    window.print();
    setTimeout(() => document.getElementById('top-bar').style.display = '', 0);
  });

  btnFullProxy.addEventListener('click', () => {
    // just flip images—no grouping logic here
    const imgs = document.querySelectorAll('#card-container .card img.card-img');
    imgs.forEach(img => {
      img.src = img.dataset.fullArt;
    });
  });

  btnReset.addEventListener('click', () => {
    document.getElementById('card-container').innerHTML = '';
    Object.keys(window.cardCounts).forEach(vn => window.cardCounts[vn] = 0);
    updateCount();
  });

  // — MutationObserver keeps badges & top-bar live —
  (() => {
    const container = document.getElementById('card-container');
    if (!container) return;
    const obs = new MutationObserver(() => {
      updateCount();
      new Set(
        [...container.querySelectorAll('.card[data-variant]')].map(c => c.getAttribute('data-variant'))
      ).forEach(refreshBadge);
    });
    obs.observe(container, { childList: true });
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
    const groups     = {};

    Object.entries(window.cardCounts).forEach(([vn,count]) => {
      groups['All'] = groups['All'] || {};
      groups['All'][vn] = count;  // ensures row remains even at zero
    });

    const listEl = document.getElementById('overview-list');
    typesOrder.concat(Object.keys(groups).filter(t=>!typesOrder.includes(t)))
      .forEach(type => {
        const sectionData = groups[type] || (type==='All' ? groups['All'] : null);
        if (!sectionData) return;
        const total = Object.values(sectionData).reduce((a,b)=>a+b,0);
        const section = document.createElement('div');
        section.className = 'overview-section';
        section.innerHTML = `<h3>${type} (${total})</h3>`;

        Object.entries(sectionData).forEach(([vn,count]) => {
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
  document.getElementById('btn-overview').addEventListener('click', buildOverview);

})();
