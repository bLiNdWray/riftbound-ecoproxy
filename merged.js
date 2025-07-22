// merged.js – Riftbound Eco Proxy
(() => {
  const API_BASE = 'https://script.google.com/macros/s/AKfycbxTZhEAgw51GeZL_9LOPAJ48bYGeR7X8eQcQMBOPWxxbEZe_A0ghsny-GdA9gdhIn/exec', SHEET_NAME = 'Riftbound Cards';
  const container = document.getElementById('card-container'), openBtn = document.getElementById('open-search'),
        closeBtn = document.getElementById('close-search'), modal = document.getElementById('search-modal'),
        input = document.getElementById('card-search-input'), results = document.getElementById('search-results'),
        importBtn = document.getElementById('btn-import'), printBtn = document.getElementById('btn-print'),
        fullProxyBtn = document.getElementById('btn-full-proxy'), resetBtn = document.getElementById('btn-reset'),
        btnOverview = document.getElementById('btn-overview');
  window.cardCounts = {};
  function jsonpFetch(p,cb){const cbName='cb_'+Date.now()+'_'+Math.floor(Math.random()*1e4);window[cbName]=d=>{delete window[cbName];document.head.removeChild(s);cb(d)};const qs=Object.entries(p).map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&'),s=document.createElement('script');s.src=`${API_BASE}?${qs}&callback=${cbName}`;document.head.appendChild(s);}
  const allowedTypes=['unit','spell','gear','battlefield','legend','rune'], typeClassMap={unit:'unit',spell:'spell',gear:'spell',battlefield:'battlefield',legend:'legend',rune:'rune'};let allCards=[];
  jsonpFetch({sheet:SHEET_NAME},d=>{allCards=Array.isArray(d)?d:[]});
  function formatDescription(t){let o=String(t);function r(c,i){o=o.replace(new RegExp(`\\s*\\[${c}\\]\\s*`,'gi'),i)};r('Tap',`<img src="images/Tap.png" class="inline-icon" alt="Tap">`);r('Might',`<img src="images/SwordIconRB.png" class="inline-icon" alt="Might">`);r('power',`<img src="images/RainbowRune.png" class="inline-icon" alt="Power">`);['Body','Calm','Chaos','Fury','Mind','Order'].forEach(c=>r(c,`<img src="images/${c}.png" class="inline-icon" alt="${c}">`));return o.replace(/>\\s+</g,'><').replace(/\\s{2,}/g,' ').trim();}
  function build(id,html){const w=document.createElement('div');w.className='card';w.dataset.variant=id;w.insertAdjacentHTML('beforeend',html);const b=document.createElement('div');b.className='qty-badge';b.textContent=window.cardCounts[id]||0;w.appendChild(b);const h=document.createElement('div');h.className='hover-bar';const p=document.createElement('button'),m=document.createElement('button');p.className='add-btn';p.textContent='+';m.className='remove-btn';m.textContent='−';h.append(p,m);w.appendChild(h);p.addEventListener('click',()=>window.addCard(id));m.addEventListener('click',e=>{e.stopPropagation();window.removeCard(id,w)});return w;}
  function makeUnit(c){const cols=(c.colors||'').split(/[;,]\\s*/).filter(Boolean),costN=+c.energy||0,powN=+c.power||0,costIcons=Array(powN).fill().map(_=>`<img src="images/${cols[0]||'Body'}2.png" class="cost-icon" alt="">`).join(''),mightHTML=c.might?`<img src="images/SwordIconRB.png" class="might-icon" alt="Might"> ${c.might}`:'',desc=formatDescription(c.description),tags=(c.tags||'').split(/;\\s*/).join(' '),colorIcon=`<img src="images/${cols[0]||'Body'}.png" class="inline-icon" alt="">`;return build(c.variantNumber,`<div class="top-bar"><span class="cost">${costN}${costIcons}</span><span class="might">${mightHTML}</span></div><div class="name">${c.name}</div><div class="middle"><div class="desc-wrap">${desc}</div><div class="color-indicator">${colorIcon}<span class="color-text">${cols.join(' ')}</span></div></div><div class="bottom-bar"><span class="type-line">${c.type}${tags?' - '+tags:''}</span></div>`)}
  function makeSpell(c){const cols=(c.colors||'').split(/[;,]\\s*/).filter(Boolean),costN=+c.energy||0,powN=+c.power||0,costIcons=Array(powN).fill().map(_=>`<img src="images/${cols[0]||'Body'}2.png" class="cost-icon" alt="">`).join(''),desc=formatDescription(c.description),tags=(c.tags||'').split(/;\\s*/).join(' '),colorIcon=`<img src="images/${cols[0]||'Body'}.png" class="inline-icon" alt="">`;return build(c.variantNumber,`<div class="top-bar"><span class="cost">${costN}${costIcons}</span></div><div class="name">${c.name}</div><div class="middle"><div class="desc-wrap">${desc}</div><div class="color-indicator">${colorIcon}<span class="color-text">${cols.join(' ')}</span></div></div><div class="bottom-bar"><span class="type-line">${c.type}${tags?' - '+tags:''}</span></div>`)}
  function makeBattlefield(c){const d=c.description||'';return build(c.variantNumber,`<div class="bf-columns"><div class="bf-col side left"><div class="bf-text">${d}</div></div><div class="bf-col center"><div class="bf-type-text">${c.type.toUpperCase()}</div><div class="bf-name">${c.name}</div></div><div class="bf-col side right"><div class="bf-text">${d}</div></div></div>`)}
  function makeLegend(c){const cols=(c.colors||'').split(/[;,]\\s*/).filter(Boolean),iconsHTML=cols.map(col=>`<img src="images/${col}.png" alt="${col}">`).join(' '),[charName,moniker]=(c.name||'').split(',').map(s=>s.trim()),body=formatDescription(c.description);return build(c.variantNumber,`<div class="legend-header"><div class="legend-icons">${iconsHTML}</div><div class="legend-title">LEGEND</div></div><div class="legend-name"><div class="main-title">${charName}</div>${moniker?`<div class="subtitle">${moniker}</div>`:''}</div><div class="legend-body"><div class="legend-body-text">${body}</div></div>`)}
  function makeRune(c){const cols=(c.colors||'').split(/[;,]\\s*/).filter(Boolean),img=cols[0]||'Body';return build(c.variantNumber,`<div class="rune-title">${c.name}</div><div class="rune-image"><img src="images/${img}.png" alt="${c.name}"></div>`)}
  function renderSearchResults(list){results.innerHTML='';list.forEach(c=>{const t=(c.type||'').trim().toLowerCase();if(!allowedTypes.includes(t))return;const e={unit:makeUnit,spell:makeSpell,gear:makeSpell,battlefield:makeBattlefield,legend:makeLegend,rune:makeRune}[t](c);e.classList.add(typeClassMap[t]);results.appendChild(e)})}
  function renderCards(ids,clr=true){if(clr)container.innerHTML='';ids.forEach(vn=>jsonpFetch({sheet:SHEET_NAME,id:vn},d=>{if(!d[0])return;const c=d[0],t=(c.type||'').trim().toLowerCase();if(!allowedTypes.includes(t))return;const e={unit:makeUnit,spell:makeSpell,gear:makeSpell,battlefield:makeBattlefield,legend:makeLegend,rune:makeRune}[t](c);e.classList.add(typeClassMap[t]);container.appendChild(e)}))}
  // ── Add with sorted insertion ──────────────────────────────────────
  const TYPE_ORDER=['legend','battlefield','rune','unit','spell','gear'];
  window.addCard = function(vn) {
    const c=allCards.find(x=>x.variantNumber===vn); if(!c)return;
    const t=(c.type||'').trim().toLowerCase(), el={unit:makeUnit,spell:makeSpell,gear:makeSpell,battlefield:makeBattlefield,legend:makeLegend,rune:makeRune}[t](c); el.classList.add(typeClassMap[t]);
    window.cardCounts[vn]=(window.cardCounts[vn]||0)+1; refreshBadge(vn); updateCount(); saveState();
    let inserted=false;Array.from(container.children).forEach(existing=>{if(inserted)return;const exType=TYPE_ORDER.find(type=>existing.classList.contains(type))||'spell';if(TYPE_ORDER.indexOf(exType)>TYPE_ORDER.indexOf(t)){container.insertBefore(el,existing);inserted=true;}else if(exType===t){const exName=(existing.querySelector('.name, .main-title, .bf-name, .rune-title').textContent||'').toLowerCase();if(c.name.toLowerCase()<exName){container.insertBefore(el,existing);inserted=true;}}});if(!inserted)container.appendChild(el);
  };
  window.removeCard=v=>{ /* unchanged */ };
  function saveState(){localStorage.setItem('riftboundCardCounts',JSON.stringify(window.cardCounts));}
  function loadState(){try{window.cardCounts=JSON.parse(localStorage.getItem('riftboundCardCounts'))||{}}catch{window.cardCounts={}}}
  function refreshBadge(v){const b=container.querySelector(`.card[data-variant="${v}"] .qty-badge`);if(b)b.textContent=container.querySelectorAll(`.card[data-variant="${v}"]`).length;}
  function updateCount(){const tot=container.querySelectorAll('.card').length;document.getElementById('card-count').textContent=tot+' card'+(tot!==1?'s':'');}
  openBtn.addEventListener('click',()=>{/*...*/}); closeBtn.addEventListener('click',()=>{/*...*/}); input.addEventListener('input',()=>{/*...*/});
  importBtn.addEventListener('click',()=>{/*...*/}); printBtn.addEventListener('click',()=>{/*...*/}); fullProxyBtn.addEventListener('click',()=>{/*...*/}); resetBtn.addEventListener('click',()=>{/*...*/});
  // ── Overview ────────────────────────────────────────────────────────
  function buildOverview() {
    const prev=document.getElementById('overview-modal');if(prev){prev.remove();return;}
    const overlay=document.createElement('div');overlay.id='overview-modal';overlay.className='modal-overlay';
    overlay.innerHTML='<div class="modal-content"><button id="close-overview" class="modal-close">×</button><h2>Overview</h2><div id="overview-list"></div></div>';
    document.body.appendChild(overlay);overlay.querySelector('#close-overview').onclick=()=>overlay.remove();
    const order=['Legend','Battlefield','Runes','Units','Spells'],grp={};
    Object.entries(window.cardCounts).forEach(([vn,count])=>{if(!count)return;const sel='.card[data-variant="'+vn+'"]';const cardEl=container.querySelector(sel);if(!cardEl)return;let type='Other';if(cardEl.classList.contains('legend'))type='Legend';else if(cardEl.classList.contains('battlefield'))type='Battlefield';else if(cardEl.classList.contains('rune'))type='Runes';else if(cardEl.classList.contains('unit'))type='Units';else if(cardEl.classList.contains('spell'))type='Spells';grp[type]=grp[type]||{};grp[type][vn]=count;});
    const listEl=overlay.querySelector('#overview-list');
    order.forEach(type=>{if(!grp[type])return;const section=document.createElement('div');section.innerHTML='<h3>'+type+'</h3>';
      Object.entries(grp[type]).forEach(([vn,count])=>{const sel='.card[data-variant="'+vn+'"]';const cardEl=container.querySelector(sel);if(!cardEl)return;
        let icons='',colWrap=cardEl.querySelector('.color-indicator');
        if(colWrap)icons=[...colWrap.querySelectorAll('img.inline-icon')].map(i=>i.outerHTML).join(' ');
        else if(cardEl.querySelector('.legend-icons'))icons=[...cardEl.querySelectorAll('.legend-icons img')].map(i=>i.outerHTML).join(' ');
        else if(cardEl.querySelector('.rune-image img'))icons=cardEl.querySelector('.rune-image img').outerHTML;
        const nameEl=cardEl.querySelector('.name')||cardEl.querySelector('.main-title')||cardEl.querySelector('.bf-name')||cardEl.querySelector('.rune-title'),
              name=nameEl?nameEl.textContent.trim():vn;
        const row=document.createElement('div');row.className='overview-item';
        row.innerHTML='<span class="overview-label">'+icons+'<span class="overview-text">'+name+'</span></span>'
          +'<span class="overview-variant">'+vn+'</span>'
          +'<span class="overview-controls"><button class="overview-dec" data-vn="'+vn+'">−</button><span class="overview-count">'+count+'</span><button class="overview-inc" data-vn="'+vn+'">+</button></span>';
        section.appendChild(row);
      });
      listEl.appendChild(section);
    });
    listEl.querySelectorAll('.overview-inc').forEach(b=>b.onclick=()=>window.addCard(b.dataset.vn));
    listEl.querySelectorAll('.overview-dec').forEach(b=>b.onclick=()=>window.removeCard(b.dataset.vn));
  }
  btnOverview.addEventListener('click', buildOverview);
  new MutationObserver(()=>{updateCount();Object.keys(window.cardCounts).forEach(refreshBadge);}).observe(container,{childList:true});
  document.addEventListener('DOMContentLoaded',()=>{
    loadState();Object.entries(window.cardCounts).forEach(([vn,c])=>{for(let i=0;i<c;i++)renderCards([vn],false);});updateCount();
  });
})();
