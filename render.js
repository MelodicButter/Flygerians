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

function menuItemHTML(item) {
  return `
    <div class="menu-item">
      <h4>${esc(item.name)}</h4>
      <p>${esc(item.description)}</p>
      ${item.tag ? `<span class="tag">${esc(item.tag)}</span>` : ''}
    </div>`;
}

function categoryHTML(cat) {
  const items = (cat.items || []).map(menuItemHTML).join('');
  const addons = (cat.addons && cat.addons.length)
    ? `<div class="addons"><h4>Add Ons</h4><ul>${cat.addons.map(a => `<li>${esc(a)}</li>`).join('')}</ul></div>`
    : '';
  return `
    <div class="menu-block">
      <h3 class="menu-heading">${esc(cat.name)}</h3>
      <div class="menu-grid">${items}</div>
      ${addons}
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
    el.innerHTML = data.categories.map(categoryHTML).join('');
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
      packages.innerHTML = data.categories.map(categoryHTML).join('');
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
