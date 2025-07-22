// ui.js – hooks on top of script.js
(function() {
  const 
    openSearchBtn  = document.getElementById('open-search'),
    closeSearchBtn = document.getElementById('close-search'),
    searchModal    = document.getElementById('search-modal'),
    btnImport      = document.getElementById('btn-import'),
    btnPrint       = document.getElementById('btn-print'),
    btnOverview    = document.getElementById('btn-overview'),
    btnFullProxy   = document.getElementById('btn-full-proxy'),
    btnReset       = document.getElementById('btn-reset'),
    countLabel     = document.getElementById('card-count');

  // Persistence
  function saveState() {
    localStorage.setItem('riftboundCardCounts', JSON.stringify(window.addedCounts));
  }
  function loadState() {
    try {
      const s = localStorage.getItem('riftboundCardCounts');
      window.addedCounts = s ? JSON.parse(s) : {};
    } catch {
      window.addedCounts = {};
    }
  }

  // Badge + top counter
  function refreshBadge(vn) {
    const n = document.querySelectorAll(
      `#card-container .card[data-variant="${vn}"]`
    ).length;
    const b = document.querySelector(
      `#card-container .card[data-variant="${vn}"] .qty-badge`
    );
    if (b) b.textContent = n;
  }
  function updateCount() {
    const total = document.querySelectorAll('#card-container .card').length;
    if (countLabel) countLabel.textContent = total + ' card' + (total!==1?'s':'');
  }

  // Wrap to persist
  const origAdd = window.addCard;
  window.addCard = vn => {
    const ok = origAdd(vn);
    if (ok) {
      window.addedCounts[vn] = (window.addedCounts[vn]||0)+1;
      saveState();
    }
    return ok;
  };
  const origRm = window.removeCard;
  window.removeCard = (vn,el) => {
    const cardEl = el || document.querySelector(`.card[data-variant="${vn}"]`);
    if (!cardEl) return false;
    const ok = origRm(vn,cardEl);
    if (ok) {
      window.addedCounts[vn] = Math.max(0,(window.addedCounts[vn]||0)-1);
      saveState();
    }
    return ok;
  };

  // Search modal
  openSearchBtn.onclick  = () => searchModal.classList.remove('hidden');
  closeSearchBtn.onclick = () => searchModal.classList.add('hidden');

  // Import List
  btnImport.onclick = () => { /* your existing import modal code */ };

  // Print
  btnPrint.onclick = () => {
    document.getElementById('top-bar').style.display='none';
    window.print();
    setTimeout(()=>document.getElementById('top-bar').style.display='',0);
  };

  // Full proxy (flip images)
  btnFullProxy.onclick = () => {
    document.querySelectorAll('#card-container img.card-img')
      .forEach(img => img.src = img.dataset.fullArt);
  };

  // Reset
  btnReset.onclick = () => {
    document.getElementById('card-container').innerHTML = '';
    Object.keys(window.addedCounts).forEach(v=>window.addedCounts[v]=0);
    updateCount();
  };

  // Live observer
  new MutationObserver(() => {
    updateCount();
    new Set(
      [...document.querySelectorAll('.card[data-variant]')]
        .map(c=>c.dataset.variant)
    ).forEach(refreshBadge);
  }).observe(document.getElementById('card-container'),{ childList:true });

  // Overview
  function wireOverview(listEl) {
    listEl.querySelectorAll('.overview-inc').forEach(b=>{
      b.onclick = ()=>{ if(window.addCard(b.dataset.vn)) buildOverview(); };
    });
    listEl.querySelectorAll('.overview-dec').forEach(b=>{
      b.onclick = ()=>{ if(window.removeCard(b.dataset.vn)) buildOverview(); };
    });
  }

  function buildOverview() {
    const prev = document.getElementById('overview-modal');
    if (prev) prev.remove();
    const ovr = document.createElement('div');
    ovr.id= 'overview-modal'; ovr.className='modal-overlay';
    ovr.innerHTML=`
      <div class="modal-content">
        <button id="close-overview" class="modal-close">×</button>
        <h2>Overview</h2>
        <div id="overview-list"></div>
      </div>`;
    document.body.appendChild(ovr);
    ovr.querySelector('#close-overview').onclick = ()=>ovr.remove();

    const typesOrder = ['Legend','Runes','Battlefield','Units','Spells'];
    const groups     = {};
    Object.entries(window.addedCounts).forEach(([vn,c])=>{
      groups['All'] = groups['All']||{}; groups['All'][vn]=c;
    });
    const listEl = document.getElementById('overview-list');
    typesOrder.concat(Object.keys(groups).filter(t=>!typesOrder.includes(t)))
      .forEach(type=>{
        const data = groups[type]|| (type==='All'?groups['All']:null);
        if (!data) return;
        const total = Object.values(data).reduce((a,b)=>a+b,0);
        const sec   = document.createElement('div');
        sec.className='overview-section';
        sec.innerHTML=`<h3>${type} (${total})</h3>`;
        Object.entries(data).forEach(([vn,count])=>{
          const cardEl = document.querySelector(`.card[data-variant="${vn}"]`);
          const name   = cardEl?.querySelector('.name')?.textContent.trim()||vn;
          const logo   = cardEl?.querySelector('img.card-img')?.src||'';
          const row    = document.createElement('div');
          row.className='overview-item';
          row.innerHTML=`
            <img src="${logo}" class="overview-logo"/>
            <span class="overview-text">${name} – ${vn}</span>
            <button class="overview-dec" data-vn="${vn}">−</button>
            <span class="overview-count">${count}</span>
            <button class="overview-inc" data-vn="${vn}">+</button>
          `;
          sec.appendChild(row);
        });
        listEl.appendChild(sec);
      });

    wireOverview(listEl);
  }

  btnOverview.onclick = buildOverview;

  // Restore on load
  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    Object.entries(window.addedCounts).forEach(([vn,c])=>{
      for(let i=0;i<c;i++) window.addCard(vn);
    });
    updateCount();
  });
})();
