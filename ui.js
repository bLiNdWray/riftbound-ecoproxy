(function() {
  // Top-bar buttons
  var openBtn      = document.getElementById('open-search');
  var btnImport    = document.getElementById('btn-import');
  var btnPrint     = document.getElementById('btn-print');
  var btnOverview  = document.getElementById('btn-overview');
  var btnFullProxy = document.getElementById('btn-full-proxy');
  var btnReset     = document.getElementById('btn-reset');
  var countLabel   = document.getElementById('card-count');

  // State & flags
  window.cardCounts    = window.cardCounts    || {};
  var fullProxy        = false;
  var isImporting      = false;

  // ===== Toasts =====
  function notify(msg) {
    var n = document.createElement('div');
    n.className = 'toast-notice';
    n.textContent = msg;
    document.getElementById('toast-container').appendChild(n);
    setTimeout(function(){ n.classList.add('visible'); }, 10);
    setTimeout(function(){ n.classList.remove('visible'); }, 4000);
    setTimeout(function(){ n.remove(); }, 4500);
  }
  function errorNotify(msg) {
    var n = document.createElement('div');
    n.className = 'toast-notice error';
    n.textContent = msg;
    document.getElementById('toast-container').appendChild(n);
    setTimeout(function(){ n.classList.add('visible'); }, 10);
    setTimeout(function(){ n.classList.remove('visible'); }, 10000);
    setTimeout(function(){ n.remove(); }, 10500);
  }
  function longNotify(msg) {
    var n = document.createElement('div');
    n.className = 'toast-notice';
    n.textContent = msg;
    document.getElementById('toast-container').appendChild(n);
    setTimeout(function(){ n.classList.add('visible'); }, 10);
    setTimeout(function(){ n.classList.remove('visible'); }, 4000);
    setTimeout(function(){ n.remove(); }, 4500);
  }

  // ===== Persistence =====
  function saveState() {
    localStorage.setItem('riftboundCardCounts', JSON.stringify(window.cardCounts));
  }
  function loadState() {
    try {
      var s = localStorage.getItem('riftboundCardCounts');
      window.cardCounts = s ? JSON.parse(s) : {};
    } catch (e) {
      console.warn('Failed to load state', e);
      window.cardCounts = {};
    }
  }

  // ===== Helpers =====
  function updateCount() {
    var total = Object.values(window.cardCounts).reduce(function(a,b){ return a+b; }, 0);
    countLabel.textContent = total + ' card' + (total!==1?'s':'');
  }
  function refreshBadge(vn) {
    var b = document.querySelector('[data-variant="' + vn + '"] .qty-badge');
    if (b) b.textContent = window.cardCounts[vn] || 0;
  }

  // ===== Wrap core addCard/removeCard =====
  var origAdd = typeof window.addCard === 'function' ? window.addCard : function(){};
  var origRm  = typeof window.removeCard === 'function' ? window.removeCard : function(){};

  window.addCard = function(vn) {
    origAdd(vn);
    // Only proceed if the card element actually exists
    var el = document.querySelector('[data-variant="' + vn + '"]');
    if (!el) return;
    // increment count
    window.cardCounts[vn] = (window.cardCounts[vn]||0) + 1;
    updateCount();
    saveState();
    refreshBadge(vn);
    // toast on manual add (skip during import)
    if (!isImporting) {
      var name = el.dataset.name || vn;
      notify(name + ' - ' + vn);
    }
  };

  window.removeCard = function(vn, el) {
    origRm(vn, el);
    if (window.cardCounts[vn] > 1) {
      window.cardCounts[vn]--;
    } else {
      delete window.cardCounts[vn];
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    updateCount();
    saveState();
    refreshBadge(vn);
  };

  // ===== Import List Modal =====
  btnImport.addEventListener('click', function(){
    window.cardCounts = window.cardCounts || {};

    // remove old modal
    var prev = document.getElementById('import-modal');
    if (prev) prev.remove();

    // build modal
    var overlay = document.createElement('div');
    overlay.id = 'import-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content large" style="max-width:600px; padding:16px;">
        <button id="close-import" class="modal-close">×</button>
        <h2>Import List</h2>
        <p>Paste your Table Top Simulator Deck Code.</p>
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

    var area  = document.getElementById('import-area'),
        clear = document.getElementById('import-clear');
    document.getElementById('close-import').onclick = closeModal;
    document.getElementById('import-cancel').onclick = closeModal;

    // prefill
    area.value = Object.keys(window.cardCounts).join(' ');

    function closeModal() { overlay.remove(); }

    document.getElementById('import-ok').onclick = function(){
      // begin import
      isImporting = true;
      closeModal();
      saveState();
      longNotify('Deck Import in Progress');

      // clear if checked
      if (clear.checked) {
        document.getElementById('card-container').innerHTML = '';
        window.cardCounts = {};
        updateCount();
        saveState();
      }

      // parse tokens
      var tokens = (area.value||'').trim().split(/\s+/).filter(Boolean),
          errors = [];
      tokens.forEach(function(tok){
        var parts = tok.split('-');
        if (parts.length < 2) { errors.push(tok); return; }
        var vn = parts[0] + '-' + parts[1];
        var before = window.cardCounts[vn] || 0;
        window.addCard(vn);
        var after = window.cardCounts[vn] || 0;
        if (after === before) errors.push(vn);
      });

      // end import mode
      isImporting = false;
      saveState();

      // show errors
      errors.forEach(function(vn){
        errorNotify(vn + " can't be found");
      });
    };
  });

  // ===== Other Top-Bar Buttons =====
  btnPrint.addEventListener('click', function(){
    document.getElementById('top-bar').style.display = 'none';
    document.getElementById('search-modal').classList.add('hidden');
    window.print();
    setTimeout(function(){
      document.getElementById('top-bar').style.display = '';
    }, 0);
  });

  btnOverview.addEventListener('click', function(){
    buildOverview();
    notify('Overview opened');
  });

  btnFullProxy.addEventListener('click', function(){
    fullProxy = !fullProxy;
    Object.keys(window.cardCounts).forEach(function(vn){
      var img = document.querySelector('[data-variant="' + vn + '"] img.card-img');
      if (img) img.src = fullProxy ? img.dataset.fullArt : img.dataset.proxyArt;
    });
    notify(fullProxy ? 'Full art ON' : 'Proxy art ON');
  });

  btnReset.addEventListener('click', function(){
    window.cardCounts = {};
    document.getElementById('card-container').innerHTML = '';
    updateCount();
    saveState();
    notify('Reset complete');
  });

  // ===== On Load: Restore State =====
  document.addEventListener('DOMContentLoaded', function(){
    loadState();
    Object.entries(window.cardCounts).forEach(function(pair){
      var vn = pair[0], cnt = pair[1];
      for (var i = 0; i < cnt; i++) window.addCard(vn);
    });
    updateCount();
    var sm = document.getElementById('search-modal'); if (sm) sm.style.top = '50px';
  });

  // ===== Overview Builder =====
  function buildOverview(){
    var ex = document.getElementById('overview-modal'); if (ex) ex.remove();
    var m = document.createElement('div'); m.id='overview-modal'; m.className='modal-overlay';
    m.innerHTML =
      '<div class="modal-content small">'+
        '<button id="close-overview" class="modal-close">×</button>'+
        '<h2>Overview</h2><div id="overview-list"></div>'+
      '</div>';
    document.body.appendChild(m);
    document.getElementById('close-overview').onclick = function(){ m.remove(); };

    var order=['Legend','Runes','Units','Spells','Gear','Battlefield'], grp={};
    Object.keys(window.cardCounts).forEach(function(vn){
      var el = document.querySelector('[data-variant="'+vn+'"]');
      var t  = (el&&el.dataset.type)?el.dataset.type:'Other';
      (grp[t]=grp[t]||[]).push(vn);
    });
    var cntEl=document.getElementById('overview-list');
    order.forEach(function(type){
      if (grp[type]){
        var sec=document.createElement('div'), h=document.createElement('h3');
        h.textContent=type; sec.appendChild(h);
        grp[type].forEach(function(vn){
          var el=document.querySelector('[data-variant="'+vn+'"]'),
              name=(el&&el.dataset.name)?el.dataset.name:vn,
              setNo=(el&&el.dataset.set)?el.dataset.set:'',
              logo=(el&&el.dataset.colorLogo)?el.dataset.colorLogo:'';
          var row=document.createElement('div'); row.className='overview-item';
          row.innerHTML=
            '<img src="'+logo+'" class="overview-logo"/>'+
            '<span>'+name+' ('+setNo+')</span>'+
            '<button class="overview-dec" data-vn="'+vn+'">–</button>'+
            '<span class="overview-count">'+window.cardCounts[vn]+'</span>'+
            '<button class="overview-inc" data-vn="'+vn+'">+</button>';
          sec.appendChild(row);
        });
        cntEl.appendChild(sec);
      }
    });
  }
})();
