// merged.js – Riftbound Eco Proxy
(() => {
  // Constants & State
  const API_BASE = 'https://script.google.com/macros/s/AKfycbxTZhEAgwVw51GeZL_9LOPAJ48bYGeR7X8eQcQMBOPWxxbEZe_A0ghsny-GdA9gdhIn/exec';
  const SHEET_NAME = 'Riftbound Cards';
  const container = document.getElementById('card-container');
  const openBtn = document.getElementById('open-search');
  const closeBtn = document.getElementById('close-search');
  const modal = document.getElementById('search-modal');
  const input = document.getElementById('card-search-input');
  const results = document.getElementById('search-results');
  const importBtn = document.getElementById('btn-import');
  const printBtn = document.getElementById('btn-print');
  const fullProxyBtn = document.getElementById('btn-full-proxy');
  const resetBtn = document.getElementById('btn-reset');
  const btnOverview = document.getElementById('btn-overview');

  // Single source of truth
  window.cardCounts = {};

  // JSONP helper
  function jsonpFetch(params, cb) {
    const callbackName = 'cb_' + Date.now() + '_' + Math.floor(Math.random() * 1e4);
    window[callbackName] = data => {
      delete window[callbackName];
      document.head.removeChild(script);
      cb(data);
    };
    const script = document.createElement('script');
    const qs = Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    script.src = `${API_BASE}?${qs}&callback=${callbackName}`;
    document.head.appendChild(script);
  }

  const allowedTypes = ['unit','spell','gear','battlefield','legend','rune'];
  const typeClassMap = { unit:'unit', spell:'spell', gear:'spell', battlefield:'battlefield', legend:'legend', rune:'rune' };
  let allCards = [];
  jsonpFetch({ sheet: SHEET_NAME }, data => { allCards = Array.isArray(data) ? data : []; });

  function formatDescription(txt = '') {
    let out = String(txt);
    function replaceCode(c,img) { out = out.replace(new RegExp(`\\s*\\[${c}\\]\\s*`,'gi'), img); }
    replaceCode('Tap', `<img src="images/Tap.png" class="inline-icon" alt="Tap">`);
    replaceCode('Might', `<img src="images/SwordIconRB.png" class="inline-icon" alt="Might">`);
    replaceCode('power', `<img src="images/RainbowRune.png" class="inline-icon" alt="Power">`);
    ['Body','Calm','Chaos','Fury','Mind','Order'].forEach(col =>
      replaceCode(col, `<img src="images/${col}.png" class="inline-icon" alt="${col}">`)
    );
    return out.replace(/>\s+</g,'><').replace(/\s{2,}/g,' ').trim();
  }

  function build(id, html) {
    const w = document.createElement('div'); w.className = 'card'; w.setAttribute('data-variant', id);
    w.insertAdjacentHTML('beforeend', html);
    const badge = document.createElement('div'); badge.className = 'qty-badge'; badge.textContent = window.cardCounts[id] || 0;
    w.appendChild(badge);
    const hover = document.createElement('div'); hover.className = 'hover-bar';
    const plus = document.createElement('button'); plus.className='add-btn'; plus.textContent='+';
    const minus = document.createElement('button'); minus.className='remove-btn'; minus.textContent='−';
    hover.append(plus,minus); w.appendChild(hover);
    plus.addEventListener('click',()=>window.addCard(id));
    minus.addEventListener('click',e=>{e.stopPropagation();window.removeCard(id,w);});
    return w;
  }

  function makeUnit(c) {
    const cols = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const icons = cols.map(col=>`<img src="images/${col}.png" class="inline-icon" alt="${col}">`).join(' ');
    return build(c.variantNumber, `
      <div class="unit-row">
        <span class="unit-icons">${icons}</span>
        <span class="unit-name">${c.name}</span>
        <span class="unit-variant">${c.variantNumber}</span>
      </div>
    `);
  }
  // spell, battlefield, legend, rune same format
  function makeSpell(c){return makeUnit(c);}  
  function makeBattlefield(c){return makeUnit(c);}  
  function makeLegend(c){return makeUnit(c);}  
  function makeRune(c){return makeUnit(c);}  

  function renderSearchResults(list) {
    results.innerHTML='';
    list.forEach(c=>{
      const t=(c.type||'').trim().toLowerCase(); if(!allowedTypes.includes(t))return;
      const el = {unit:makeUnit,spell:makeSpell,gear:makeSpell,battlefield:makeBattlefield,legend:makeLegend,rune:makeRune}[t](c);
      el.classList.add(typeClassMap[t]); results.appendChild(el);
    });
  }

  function renderCards(ids, clear=true) {
    if(clear) container.innerHTML='';
    ids.forEach(vn=>jsonpFetch({sheet:SHEET_NAME,id:vn},data=>{
      if(!Array.isArray(data)||!data[0])return;
      const c=data[0], t=(c.type||'').trim().toLowerCase();
      const el={unit:makeUnit,spell:makeSpell,gear:makeSpell,battlefield:makeBattlefield,legend:makeLegend,rune:makeRune}[t](c);
      el.classList.add(typeClassMap[t]); container.appendChild(el);
    }));
  }

  window.addCard=vn=>{renderCards([vn],false);window.cardCounts[vn]=(window.cardCounts[vn]||0)+1;refreshBadge(vn);updateCount();saveState();};
  window.removeCard=(vn,el)=>{if(el)el.remove();window.cardCounts[vn]=Math.max((window.cardCounts[vn]||0)-1,0);refreshBadge(vn);updateCount();saveState();};

  function saveState(){localStorage.setItem('riftboundCardCounts',JSON.stringify(window.cardCounts));}
  function loadState(){try{window.cardCounts=JSON.parse(localStorage.getItem('riftboundCardCounts'))||{}}catch{window.cardCounts={}}}

  function refreshBadge(vn){const b=container.querySelector(`.card[data-variant="${vn}"] .qty-badge`);if(b)b.textContent=container.querySelectorAll(`.card[data-variant="${vn}"]`).length;}
  function updateCount(){const t=container.querySelectorAll('.card').length;document.getElementById('card-count').textContent=t+' card'+(t!==1?'s':'');}

  openBtn.addEventListener('click',()=>{modal.classList.remove('hidden');input.value='';results.innerHTML='';input.focus();});
  closeBtn.addEventListener('click',()=>modal.classList.add('hidden'));
  input.addEventListener('input',()=>{
    const q=input.value.trim().toLowerCase();
    if(!q)return results.innerHTML='';
    renderSearchResults(allCards.filter(c=>(c.name||'').toLowerCase().includes(q)||(c.variantNumber||'').toLowerCase().includes(q)));
  });

  importBtn.addEventListener('click',()=>{/* import logic */});
  printBtn.addEventListener('click',()=>{document.getElementById('top-bar').style.display='none';modal.classList.add('hidden');window.print();setTimeout(()=>document.getElementById('top-bar').style.display='',0);});
  fullProxyBtn.addEventListener('click',()=>{/* toggle art */});
  resetBtn.addEventListener('click',()=>{window.cardCounts={};container.innerHTML='';saveState();updateCount();});

  function buildOverview(){
    const prev=document.getElementById('overview-modal');if(prev)return prev.remove();
    const overlay=document.createElement('div');overlay.id='overview-modal';overlay.className='modal-overlay';
    overlay.innerHTML=`
      <div class="modal-content">
        <button id="close-overview" class="modal-close">×</button>
        <h2>Overview</h2>
        <div id="overview-list"></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#close-overview').onclick=overlay.remove.bind(overlay);
    const listEl=overlay.querySelector('#overview-list');
    ['legend','battlefield','rune','unit','spell'].forEach(type=>{
      const sec=document.createElement('div');sec.innerHTML=`<h3>${type.charAt(0).toUpperCase()+type.slice(1)}</h3>`;
      Object.entries(window.cardCounts).forEach(([vn,count])=>{
        if(!count)return;
        const cardEl=container.querySelector(`.card[data-variant="${vn}"]`);
        if(!cardEl||!cardEl.classList.contains(type))return;
        const icons=Array.from(cardEl.querySelectorAll('.inline-icon')).map(i=>i.outerHTML).join(' ');
        const name=cardEl.querySelector('.unit-name').textContent;
        const row=document.createElement('div');row.className='overview-item';
        row.innerHTML=`${icons} – ${name} – ${vn}`;
        sec.appendChild(row);
      });
      listEl.appendChild(sec);
    });
  }
  btnOverview.addEventListener('click',buildOverview);

  document.addEventListener('DOMContentLoaded',()=>{loadState();Object.entries(window.cardCounts).forEach(([vn,c])=>{for(let i=0;i<c;i++)renderCards([vn],false);} );updateCount();});
})();
