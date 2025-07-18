(function(){
  // Grab all buttons from the top-bar
  var openBtn       = document.getElementById('open-search');
  var btnImport     = document.getElementById('btn-import');
  var btnPrint      = document.getElementById('btn-print');
  var btnOverview   = document.getElementById('btn-overview');
  var btnFullProxy  = document.getElementById('btn-full-proxy');
  var btnReset      = document.getElementById('btn-reset');
  var countLabel    = document.getElementById('card-count');

  // State
  window.addedVariants = window.addedVariants || [];
  var fullProxy = false;

  // Toast helper
  function notify(msg) {
    var n = document.createElement('div');
    n.className = 'toast-notice';
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(function(){ n.classList.add('visible'); }, 10);
    setTimeout(function(){ n.classList.remove('visible'); }, 2000);
    setTimeout(function(){ n.remove(); }, 3000);
  }

  // ACTIVITY: import, print, overview, full-proxy, reset…
  btnImport.addEventListener('click', function(){
    var text = prompt('Paste variant numbers (one per line):');
    if (!text) return;
    var list = text.split(/\r?\n/), imp=0;
    list.forEach(function(line){
      var vn=line.trim();
      if (vn && window.addedVariants.indexOf(vn)===-1){
        window.addCard(vn);
        imp++;
      }
    });
    updateCount(); cacheState();
    notify(imp + ' cards imported');
  });

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
    window.addedVariants.forEach(function(vn){
      var img = document.querySelector('[data-variant="'+vn+'"] img.card-img');
      if (img) img.src = fullProxy ? img.dataset.fullArt : img.dataset.proxyArt;
    });
    notify(fullProxy ? 'Full art ON' : 'Proxy art ON');
  });

  btnReset.addEventListener('click', function(){
    history.replaceState({},'', window.location.pathname);
    window.addedVariants = [];
    document.getElementById('card-container').innerHTML = '';
    updateCount();
    notify('Reset complete');
  });

  // Update the nav-bar counter
  function updateCount(){
    var t=window.addedVariants.length;
    countLabel.textContent = t + ' card' + (t!==1?'s':'');
  }

  // Keep URL in sync
  function cacheState(){
    var p=new URLSearchParams();
    window.addedVariants.forEach(function(vn){ p.append('id',vn); });
    history.replaceState({},'', window.location.pathname + '?' + p.toString());
  }

  // Wrap the global hooks to also update UI & URL
  var origAdd = typeof window.addCard==='function'
    ? window.addCard
    : function(vn){ console.warn('addCard not defined'); };
  var origRm  = typeof window.removeCard==='function'
    ? window.removeCard
    : function(vn,el){ console.warn('removeCard not defined'); };

  function refreshBadge(vn){
    var b = document.querySelector('[data-variant="'+vn+'"] .qty-badge');
    if (b) b.textContent = window.addedVariants.filter(x=>x===vn).length;
  }

  window.addCard = function(vn){
    origAdd(vn);
    if (window.addedVariants.indexOf(vn)===-1) window.addedVariants.push(vn);
    updateCount(); cacheState(); refreshBadge(vn);
  };

  window.removeCard = function(vn, el){
    origRm(vn, el);
    var i = window.addedVariants.indexOf(vn);
    if (i>-1) window.addedVariants.splice(i,1);
    updateCount(); cacheState(); refreshBadge(vn);
  };

  // On load: restore from URL, position modal
  document.addEventListener('DOMContentLoaded', function(){
    var ps=new URLSearchParams(window.location.search);
    ps.getAll('id').forEach(function(vn){ window.addCard(vn); });
    updateCount();
    var sm = document.getElementById('search-modal');
    if (sm) sm.style.top = '50px';
  });

  // Build the Overview modal
  function buildOverview(){
    var ex=document.getElementById('overview-modal');
    if (ex) ex.remove();
    var m=document.createElement('div');
    m.id='overview-modal'; m.className='modal-overlay';
    m.innerHTML =
      '<div class="modal-content small">'+
        '<button id="close-overview" class="modal-close">×</button>'+
        '<h2>Overview</h2><div id="overview-list"></div>'+
      '</div>';
    document.body.appendChild(m);
    document.getElementById('close-overview').onclick = function(){ m.remove(); };
    var order=['Legend','Runes','Units','Spells','Gear','Battlefield'], grp={};
    window.addedVariants.forEach(function(vn){
      var el=document.querySelector('[data-variant="'+vn+'"]');
      var t=(el&&el.dataset.type)?el.dataset.type:'Other';
      grp[t]=grp[t]||[]; grp[t].push(vn);
    });
    var cnt=document.getElementById('overview-list');
    order.forEach(function(t){
      if (grp[t]){
        var s=document.createElement('div'),
            h=document.createElement('h3');
        h.textContent=t; s.appendChild(h);
        grp[t].forEach(function(vn){
          var el=document.querySelector('[data-variant="'+vn+'"]'),
              name=(el&&el.dataset.name)?el.dataset.name:vn,
              setNo=(el&&el.dataset.set)?el.dataset.set:'',
              logo=(el&&el.dataset.colorLogo)?el.dataset.colorLogo:'';
          var row=document.createElement('div');
          row.className='overview-item';
          row.innerHTML=
            '<img src="'+logo+'" class="overview-logo" />'+
            '<span>'+name+' ('+setNo+')</span>'+
            '<button class="overview-dec" data-vn="'+vn+'">–</button>'+
            '<span class="overview-count">'+
               window.addedVariants.filter(x=>x===vn).length+
            '</span>'+
            '<button class="overview-inc" data-vn="'+vn+'">+</button>';
          s.appendChild(row);
        });
        cnt.appendChild(s);
      }
    });
  }

})();
