/*
  render.js — reads editable content from /data/*.json and injects it into the page.
  This is what makes the site editable via the /admin dashboard without touching HTML.
  If a fetch fails (e.g. offline), the static fallback content already in the HTML stays visible.
*/

async function loadJSON(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load ' + path);
  return res.json();
}

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : str;
  return div.innerHTML;
}

function allergenHTML(allergens, note) {
  const parts = [];
  if (Array.isArray(allergens) && allergens.length) {
    parts.push(`<span class="allergen-list">Allergens: ${esc(allergens.join(', '))}</span>`);
  }
  if (note) {
    parts.push(`<span class="allergen-note">${esc(note)}</span>`);
  }
  if (!parts.length) return '';
  return `<div class="allergens">${parts.join(' ')}</div>`;
}

function menuItemHTML(item) {
  return `
    <div class="menu-item">
      <h4>${esc(item.name)}</h4>
      <p>${esc(item.description)}</p>
      ${item.tag ? `<span class="tag">${esc(item.tag)}</span>` : ''}
      ${allergenHTML(item.allergens, item.note)}
    </div>`;
}

function addonHTML(addon) {
  if (typeof addon === 'string') {
    return `<li>${esc(addon)}</li>`;
  }
  const bits = [esc(addon.name)];
  if (addon.tag) bits.push(`<span class="tag">${esc(addon.tag)}</span>`);
  const allergenBit = allergenHTML(addon.allergens, addon.note);
  return `<li>${bits.join(' - ')}${allergenBit}</li>`;
}

function pricingTiersHTML(tiers) {
  if (!Array.isArray(tiers) || !tiers.length) return '';
  const cols = tiers.map(t => `
    <div class="pricing-tier">
      <div class="pricing-tier-title">${esc(t.title)}</div>
      <div class="pricing-tier-detail">${esc(t.detail)}</div>
    </div>`).join('');
  return `<div class="pricing-tiers">${cols}</div>`;
}

function infoColumnHTML(col) {
  const heading = col.heading ? `<h4>${esc(col.heading)}</h4>` : '';
  const paras = (col.paragraphs || []).map(p => `<p>${esc(p)}</p>`).join('');
  return `<div class="info-page-column">${heading}${paras}</div>`;
}

function infoPageHTML(infoPage) {
  if (!infoPage || !Array.isArray(infoPage.columns)) return '';
  return `<div class="info-page">${infoPage.columns.map(infoColumnHTML).join('')}</div>`;
}

function plainListHTML(items) {
  if (!Array.isArray(items) || !items.length) return '';
  return `<ul class="plain-list">${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
}

function groupHTML(group) {
  const heading = group.heading ? `<h4>${esc(group.heading)}</h4>` : '';
  const note = group.note ? `<p class="group-note">${esc(group.note)}</p>` : '';
  return `<div class="menu-group">${heading}${note}${plainListHTML(group.items)}</div>`;
}

function categoryHTML(cat) {
  const subtitle = cat.subtitle ? `<p class="category-subtitle">${esc(cat.subtitle)}</p>` : '';
  const infoPage = infoPageHTML(cat.infoPage);
  const items = (cat.items || []).map(menuItemHTML).join('');
  const listItems = plainListHTML(cat.listItems);
  const groups = (cat.groups && cat.groups.length)
    ? `<div class="menu-groups">${cat.groups.map(groupHTML).join('')}</div>`
    : '';
  const addonSingle = cat.addon ? `<p class="category-addon">${esc(cat.addon)}</p>` : '';
  const addons = (cat.addons && cat.addons.length)
    ? `<div class="addons"><h4>Add Ons</h4><ul>${cat.addons.map(addonHTML).join('')}</ul></div>`
    : '';
  const note = cat.note ? `<p class="category-note">${esc(cat.note)}</p>` : '';
  const tiers = pricingTiersHTML(cat.pricingTiers);
  return `
    <div class="menu-block">
      <h3 class="menu-heading">${esc(cat.name)}</h3>
      ${infoPage}
      ${subtitle}
      <div class="menu-grid">${items}</div>
      ${listItems}
      ${groups}
      ${note}
      ${addonSingle}
      ${addons}
      ${tiers}
    </div>`;
}

function allergenKeyHTML(allergenKey, disclaimer) {
  if (!allergenKey) return '';
  const rows = Object.entries(allergenKey)
    .map(([code, label]) => `<li><strong>${esc(code)}</strong> - ${esc(label)}</li>`)
    .join('');
  const disclaimerHTML = disclaimer ? `<p class="allergy-disclaimer">${esc(disclaimer)}</p>` : '';
  return `
    <div class="menu-block allergen-key-block">
      <h3 class="menu-heading">Allergen Key</h3>
      <ul class="allergen-key-list">${rows}</ul>
      ${disclaimerHTML}
    </div>`;
}

async function hydrateHero() {
  const el = document.getElementById('heroContent');
  if (!el) return;
  try {
    const data = await loadJSON('data/site.json');
    const h = data.hero;
    el.querySelector('.eyebrow').textContent = h.eyebrow;
    el.querySelector('h1').textContent = h.title;
    el.querySelector('.hero-text').textContent = h.text;
  } catch (e) { console.warn(e); }
}

async function hydrateHours() {
  const table = document.getElementById('hoursTable');
  const addressEls = document.querySelectorAll('.js-address');
  try {
    const data = await loadJSON('data/site.json');
    if (table) {
      table.innerHTML = data.hours.map(h => `<tr><td>${esc(h.day)}</td><td>${esc(h.time)}</td></tr>`).join('');
    }
    addressEls.forEach(el => el.textContent = data.address);
    const dirLink = document.getElementById('directionsLink');
    if (dirLink && data.mapsUrl) dirLink.href = data.mapsUrl;
    const mapFrame = document.getElementById('mapFrame');
    if (mapFrame && data.mapsUrl) mapFrame.src = data.mapsUrl + '&output=embed';
  } catch (e) { console.warn(e); }
}

async function hydrateMenu() {
  const el = document.getElementById('menuContent');
  if (!el) return;
  try {
    const data = await loadJSON('data/menu.json');
    let html = data.categories.map(categoryHTML).join('');

    if (data.sundayOnly) {
      html += categoryHTML(data.sundayOnly);
    }

    if (Array.isArray(data.extras) && data.extras.length) {
      html += `
        <div class="menu-block">
          <h3 class="menu-heading">Extras</h3>
          <div class="menu-grid">${data.extras.map(menuItemHTML).join('')}</div>
        </div>`;
    }

    html += allergenKeyHTML(data.allergenKey, data.allergyDisclaimer);

    el.innerHTML = html;
  } catch (e) { console.warn(e); }
}

async function hydrateCatering() {
  const info = document.getElementById('cateringInfo');
  const packages = document.getElementById('cateringPackages');
  const note = document.getElementById('cateringNote');
  try {
    const data = await loadJSON('data/catering.json');
    if (info) {
      info.innerHTML = data.info.map(i => `<div class="info-item"><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p></div>`).join('');
    }
    if (packages) {
      let html = data.categories.map(categoryHTML).join('');
      html += allergenKeyHTML(data.allergenKey, data.allergyDisclaimer);
      packages.innerHTML = html;
    }
    if (note) note.textContent = data.note;
  } catch (e) { console.warn(e); }
}

async function hydrateLinks() {
  const el = document.getElementById('linksContent');
  if (!el) return;
  try {
    const data = await loadJSON('data/links.json');
    const cookbookLink = document.getElementById('cookbookLink');
    if (cookbookLink) {
      cookbookLink.href = data.cookbook.amazonUrl;
      cookbookLink.textContent = data.cookbook.buttonText;
    }
    const merchCard = el.querySelectorAll('.link-card')[1];
    if (merchCard) {
      const badge = merchCard.querySelector('.badge');
      if (data.merch.status === 'live' && data.merch.shopUrl) {
        merchCard.querySelector('.notify-form').outerHTML =
          `<a href="${esc(data.merch.shopUrl)}" class="btn btn-primary" target="_blank" rel="noopener">Shop Merch</a>`;
        if (badge) badge.remove();
      } else if (badge) {
        badge.textContent = data.merch.badgeText;
      }
      merchCard.querySelector('p').textContent = data.merch.description;
    }
  } catch (e) { console.warn(e); }
}

async function hydrateSocial() {
  const row = document.getElementById('socialRow');
  if (!row) return;
  try {
    const data = await loadJSON('data/site.json');
    row.innerHTML = data.social.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join('');
  } catch (e) { console.warn(e); }
}

document.addEventListener('DOMContentLoaded', () => {
  hydrateHero();
  hydrateHours();
  hydrateMenu();
  hydrateCatering();
  hydrateLinks();
  hydrateSocial();
});
