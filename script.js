// script.js – Riftbound Eco Proxy
(() => {
  // … existing setup, jsonpFetch, allowedTypes, typeClassMap, etc. …

  function makeUnit(c) {
    const cols    = (c.colors||'').split(/[;]\s*/).filter(Boolean);
    const force   = cols.map(col => `<img src="images/${col}2.png" class="inline-icon" alt="${col}">`).join('');
    const might   = c.might ? `<img src="images/SwordIconRB.png" class="inline-icon" alt="Might"> ${c.might}` : '';
    const desc    = formatDescription(c.description, cols[0]||'');
    return build(c.variantNumber, `
      <div class="top-bar">
        <span class="cost">${c.energy}${force}</span>
        <span class="might">${might}</span>
      </div>
      <div class="name">${c.name}</div>
      <div class="middle">${desc}
        <div class="color-indicator">${cols.map(col => `<img src="images/${col}.png" class="inline-icon" alt="${col}">`).join('')}
        <span class="color-text">${cols.join(', ')}</span></div>
      </div>
      <div class="bottom-bar"><span class="type-line">${c.type}</span></div>`);
  }

  function makeSpell(c) {
    const cols  = (c.colors||'').split(/[;]\s*/).filter(Boolean);
    const force = cols.map(col => `<img src="images/${col}2.png" class="inline-icon" alt="${col}">`).join('');
    const desc  = formatDescription(c.description, cols[0]||'');
    return build(c.variantNumber, `
      <div class="top-bar">
        <span class="cost">${c.energy}${force}</span>
      </div>
      <div class="name">${c.name}</div>
      <div class="middle">${desc}
        <div class="color-indicator">${cols.map(col => `<img src="images/${col}.png" class="inline-icon" alt="${col}">`).join('')}
        <span class="color-text">${cols.join(', ')}</span></div>
      </div>
      <div class="bottom-bar"><span class="type-line">${c.type}</span></div>`);
  }

  function makeBattlefield(c) {
    const desc = formatDescription(c.description, '');
    return build(c.variantNumber, `
      <div class="bf-columns">
        <div class="bf-col side"><div class="bf-text">${desc}</div></div>
        <div class="bf-col center">
          <div class="bf-type-text">${c.type}</div>
          <div class="bf-name">${c.name}</div>
        </div>
        <div class="bf-col side"><div class="bf-text">${desc}</div></div>
      </div>`);
  }

  function makeLegend(c) {
    const icons = (c.colors||'').split(/[;]\s*/).map(col =>
      `<img src="images/${col}.png" class="inline-icon" alt="${col}">`
    ).join('');
    const subtitle = c.variantType || '';   // e.g. “Volibear”
    const mainTitle = c.name;               // e.g. “Relentless Storm”
    const body = formatDescription(c.description, '');

    return build(c.variantNumber, `
      <div class="legend-header">
        ${icons}
        <span class="legend-title">LEGEND</span>
      </div>
      <div class="legend-name">
        <div class="subtitle">${subtitle}</div>
        <div class="main-title">${mainTitle}</div>
      </div>
      <div class="legend-divider"></div>
      <div class="legend-body">${body}</div>`);
  }

  // … rest of your builders & build() …
})();
