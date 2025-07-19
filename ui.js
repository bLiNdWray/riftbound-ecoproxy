(function() {
  // Top-bar height
  const TOPBAR_HEIGHT = 50;

  // ————— Top-bar buttons —————
  var openBtn      = document.getElementById('open-search');
  var btnImport    = document.getElementById('btn-import');
  var btnPrint     = document.getElementById('btn-print');
  var btnOverview  = document.getElementById('btn-overview');
  var btnFullProxy = document.getElementById('btn-full-proxy');
  var btnReset     = document.getElementById('btn-reset');
  var countLabel   = document.getElementById('card-count');

  // ————— State & flags —————
  window.cardCounts = {};
  var fullProxy    = false;
  var isImporting  = false;

  // ————— Persistence —————
  function saveState() {
    localStorage.setItem('riftboundCardCounts', JSON.stringify(window.cardCounts));
  }
  function loadState() {
    try {
      var s = localStorage.getItem('riftboundCardCounts');
      window.cardCounts = s ? JSON.parse(s) : {};
    } catch {
      window.cardCounts = {};
    }
  }

  // ————— Helpers —————
  function updateCount() {
    var total = Object.values(window.cardCounts).reduce((a,b)=>a+b, 0);
    countLabel.textContent = total + ' card' + (total !== 1 ? 's' : '');
  }
  function refreshBadge(vn) {
    var b = document.querySelector('[data-variant="' + vn + '"] .qty-badge');
    if (b) b.textContent = window.cardCounts[vn] || 0;
  }

  // ————— Wrap original addCard/removeCard —————
  var origAdd = typeof window.addCard === 'function' ? window.addCard : ()=>{};
  window.addCard = function(vn) {
    var before = document.querySelectorAll('[data-variant="' + vn + '"]').length;
    origAdd(vn);
    var after = document.querySelectorAll('[data-variant="' + vn + '"]').length;
    if (after > before) {
      window.cardCounts[vn] = (window.cardCounts[vn]||0) + 1;
      saveState();
      refreshBadge(vn);
      updateCount();
      return true;
    }
    return false;
  };

  var origRm = typeof window.removeCard === 'function' ? window.removeCard : ()=>{};
  window.removeCard = function(vn,el) {
    origRm(vn,el);
    if (window.cardCounts[vn] > 1) {
      window.cardCounts[vn]--;
    } else {
      delete window.cardCounts[vn];
      if (el&&el.parentNode) el.parentNode.removeChild(el);
    }
    saveState();
    refreshBadge(vn);
    updateCount();
  };

  // ————— Import List Modal —————
  btnImport.addEventListener('click', function(){
    // remove old
    var prev = document.getElementById('import-modal');
    if (prev) prev.remove();

    // build and append
    var overlay = document.createElement('div');
    overlay.id = 'import-modal';
    overlay.className = 'modal-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top      = TOPBAR_HEIGHT + 'px';
    overlay.style.left     = '0';
    overlay.style.width    = '100%';
    overlay.style.height   = `calc(100% - ${TOPBAR_HEIGHT}px)`;
    overlay.style.overflowY= 'auto';
    overlay.style.zIndex   = '2000';
    overlay.innerHTML = `
      <div class="modal-content large" style="max-width:600px; margin:20px auto; position:relative;">
        <button id="close-import" class="modal-close">×</button>
        <h2>Import List</h2>
        <p>Paste your Table Top Simulator Code.</p>
        <textarea id="import-area"
          style="width:100%; height:200px; font-family:monospace;"
          placeholder="e.g. OGN-045-03 OGN-046-02"></textarea>
        <label style="display:block; margin:8px 0;">
          <input type="checkbox" id="import-clear" />
          Clear existing cards before import
        </label>
        <div style="text-align:right; margin-top:12px;">
          <button id="import-cancel" class="topbar-btn">Cancel</button>
          <button id="import-ok"     class="topbar-btn">Import</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    // refs
    var areaEl    = overlay.querySelector('#import-area');
    var clearChk  = overlay.querySelector('#import-clear');
    var closeBtn  = overlay.querySelector('#close-import');
    var cancelBtn = overlay.querySelector('#import-cancel');
    var okBtn     = overlay.querySelector('#import-ok');

    closeBtn.onclick  = () => overlay.remove();
    cancelBtn.onclick = () => overlay.remove();

    // prefill
    areaEl.value = Object.keys(window.cardCounts).join(' ');

    okBtn.onclick = function(){
      overlay.remove();
      // clear if checked
      if (clearChk.checked) {
        document.getElementById('card-container').innerHTML = '';
        window.cardCounts = {};
      }
      // parse & add
      var tokens = (areaEl.value||'').trim().split(/\s+/).filter(Boolean);
      isImporting = true;
      tokens.forEach(tok => {
        var parts = tok.split('-');
        if (parts.length < 2) return;
        var vn = parts[0] + '-' + parts[1];
        window.addCard(vn);
      });
      isImporting = false;

      saveState();
      updateCount();
    };
  });

  // ————— Search Modal Styling —————
  document.addEventListener('DOMContentLoaded', function(){
    var sm = document.getElementById('search-modal');
    if (sm) {
      sm.style.position   = 'fixed';
      sm.style.top        = TOPBAR_HEIGHT + 'px';
      sm.style.left       = '0';
      sm.style.width      = '100%';
      sm.style.maxHeight  = `calc(100% - ${TOPBAR_HEIGHT}px)`;
      sm.style.overflowY  = 'auto';
      sm.style.zIndex     = '2000';
      // Pin the search bar at top of that modal
      var header = sm.querySelector('.search-header');
      if (header) {
        header.style.position = 'sticky';
        header.style.top      = '0';
        header.style.background= '#fff';
        header.style.zIndex   = '2001';
      }
    }
  });

  // ————— Other Top-Bar Buttons —————
  btnPrint.addEventListener('click', function(){
    document.getElementById('top-bar').style.display = 'none';
    document.getElementById('search-modal').classList.add('hidden');
    window.print();
    setTimeout(()=>document.getElementById('top-bar').style.display='', 0);
  });
  btnOverview.addEventListener('click', buildOverview);
  btnFullProxy.addEventListener('click', function(){
    fullProxy = !fullProxy;
    Object.keys(window.cardCounts).forEach(vn=>{
      var img = document.querySelector(`[data-variant="${vn}"] img.card-img`);
      if(img) img.src = fullProxy ? img.dataset.fullArt : img.dataset.proxyArt;
    });
  });
  btnReset.addEventListener('click', function(){
    window.cardCounts = {};
    document.getElementById('card-container').innerHTML = '';
    saveState();
    updateCount();
  });

  // ————— On Load: Restore State —————
document.addEventListener('DOMContentLoaded', function(){
  loadState();
  Object.entries(window.cardCounts).forEach(function([vn,c]){
    for (let i = 0; i < c; i++) window.addCard(vn);
  });
  // ensure the counter reflects what we just loaded
  updateCount();

  // existing search-modal positioning…
});

  // ————— Overview Builder —————
  function buildOverview(){
    var ex = document.getElementById('overview-modal');
    if(ex) ex.remove();
    var m = document.createElement('div');
    m.id = 'overview-modal'; m.className = 'modal-overlay';
    m.style.position  = 'fixed';
    m.style.top       = TOPBAR_HEIGHT + 'px';
    m.style.left      = '0';
    m.style.width     = '100%';
    m.style.height    = `calc(100% - ${TOPBAR_HEIGHT}px)`;
    m.style.overflowY = 'auto';
    m.style.zIndex    = '2000';
    m.innerHTML =
      '<div class="modal-content small" style="margin:20px auto;position:relative;">' +
        '<button id="close-overview" class="modal-close">×</button>' +
        '<h2>Overview</h2><div id="overview-list"></div>' +
      '</div>';
    document.body.appendChild(m);
    document.getElementById('close-overview').onclick = ()=>m.remove();

    var order=['Legend','Runes','Units','Spells','Gear','Battlefield'], grp={};
    Object.keys(window.cardCounts).forEach(vn=>{
      var el=document.querySelector(`[data-variant="${vn}"]`);
      var t=(el&&el.dataset.type)?el.dataset.type:'Other';
      (grp[t]=grp[t]||[]).push(vn);
    });
    var cntEl=document.getElementById('overview-list');
    order.forEach(type=>{
      if(grp[type]){
        var sec=document.createElement('div'),
            h=document.createElement('h3');
        h.textContent=type; sec.appendChild(h);
        grp[type].forEach(vn=>{
          var el=document.querySelector(`[data-variant="${vn}"]`),
              name=(el&&el.dataset.name)?el.dataset.name:vn,
              setNo=(el&&el.dataset.set)?el.dataset.set:'',
              logo=(el&&el.dataset.colorLogo)?el.dataset.colorLogo:'',
              row=document.createElement('div');
          row.className='overview-item';
          row.innerHTML=
            `<img src="${logo}" class="overview-logo"/>
             <span>${name} (${setNo})</span>
             <button class="overview-dec" data-vn="${vn}">–</button>
             <span class="overview-count">${window.cardCounts[vn]}</span>
             <button class="overview-inc" data-vn="${vn}">+</button>`;
          sec.appendChild(row);
        });
        cntEl.appendChild(sec);
      }
    });
  }
})();
