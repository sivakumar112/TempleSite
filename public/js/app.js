const API = '/api';
const FALLBACK_IMG = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" fill="%23141b27"><rect width="400" height="200"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23d4a853" font-family="sans-serif" font-size="40">&#x1F6D5;</text></svg>');

document.addEventListener('error', function (e) {
  if (e.target.tagName === 'IMG' && !e.target.dataset.fallback) {
    e.target.dataset.fallback = '1';
    e.target.src = FALLBACK_IMG;
  }
}, true);

// ─── Religion Helpers ───────────────────────────────────────────────────────

function religionIcon(religion) {
  const r = (religion || '').toLowerCase();
  if (r.includes('islam') || r.includes('muslim')) return '<i class="fas fa-mosque"></i>';
  if (r.includes('christian') || r.includes('church')) return '<i class="fas fa-church"></i>';
  if (r.includes('sikh') || r.includes('gurdwara') || r.includes('gurudwara')) return '<i class="fas fa-khanda"></i>';
  if (r.includes('buddhis')) return '<i class="fas fa-dharmachakra"></i>';
  if (r.includes('jain')) return '<i class="fas fa-hand-holding-heart"></i>';
  return '<i class="fas fa-om"></i>';
}

function religionBadge(religion) {
  if (!religion) return '';
  const r = (religion || '').toLowerCase();
  let cls = 'hindu';
  if (r.includes('islam') || r.includes('muslim')) cls = 'islam';
  else if (r.includes('christian')) cls = 'christian';
  else if (r.includes('sikh')) cls = 'sikh';
  else if (r.includes('buddhis')) cls = 'buddhist';
  else if (r.includes('jain')) cls = 'jain';
  return `<span class="religion-badge ${cls}">${religionIcon(religion)} ${escapeHtml(religion)}</span>`;
}

function religionCardIcon(religion) {
  const r = (religion || '').toLowerCase();
  if (r.includes('islam')) return 'fa-mosque';
  if (r.includes('christian')) return 'fa-church';
  if (r.includes('sikh')) return 'fa-khanda';
  if (r.includes('buddhis')) return 'fa-dharmachakra';
  if (r.includes('jain')) return 'fa-hand-holding-heart';
  return 'fa-place-of-worship';
}

// ─── Navigation ─────────────────────────────────────────────────────────────

function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const section = document.getElementById('section-' + sectionId);
  const link = document.querySelector('[data-page="' + sectionId + '"]');
  if (section) section.classList.add('active');
  if (link) link.classList.add('active');
  if (sectionId === 'temples') loadTemples();
  if (sectionId === 'festivals') loadFestivals();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    const page = this.getAttribute('data-page');
    if (page) showSection(page);
  });
});

window.addEventListener('hashchange', () => {
  showSection((location.hash || '#home').slice(1) || 'home');
});
if (location.hash) showSection((location.hash || '#home').slice(1));
else showSection('home');

// ─── Global Religion Selector ────────────────────────────────────────────────

const globalReligionSelect = document.getElementById('global-religion');
let _globalReligion = localStorage.getItem('globalReligion') || '';

function getGlobalReligion() { return _globalReligion; }

const RELIGION_META = {
  '':         { label: 'All Religions', icon: 'fa-place-of-worship', placeWord: 'sacred places', searchHint: 'temple, mosque, church, gurudwara' },
  'Hindu':    { label: 'Hindu', icon: 'fa-om', placeWord: 'temples', searchHint: 'temple, mandir', deity: 'Lord Shiva, Lord Vishnu, Goddess Devi' },
  'Islam':    { label: 'Islam', icon: 'fa-mosque', placeWord: 'mosques & dargahs', searchHint: 'mosque, masjid, dargah', deity: 'Allah' },
  'Christian':{ label: 'Christian', icon: 'fa-church', placeWord: 'churches & cathedrals', searchHint: 'church, cathedral, basilica', deity: 'Jesus Christ' },
  'Sikh':     { label: 'Sikh', icon: 'fa-khanda', placeWord: 'gurudwaras', searchHint: 'gurudwara, gurdwara', deity: 'Guru Nanak' },
  'Buddhist': { label: 'Buddhist', icon: 'fa-dharmachakra', placeWord: 'monasteries & viharas', searchHint: 'monastery, vihara, pagoda', deity: 'Lord Buddha' },
  'Jain':     { label: 'Jain', icon: 'fa-hand-holding-heart', placeWord: 'Jain temples & derasars', searchHint: 'jain temple, derasar', deity: 'Lord Mahavira' }
};

function getReligionMeta() { return RELIGION_META[_globalReligion] || RELIGION_META['']; }

function applyGlobalReligion(religion) {
  _globalReligion = religion || '';
  localStorage.setItem('globalReligion', _globalReligion);
  if (globalReligionSelect) globalReligionSelect.value = _globalReligion;

  // Update body data attribute (drives CSS accent color)
  if (_globalReligion) {
    document.body.setAttribute('data-religion', _globalReligion);
  } else {
    document.body.removeAttribute('data-religion');
  }

  // Update select styling
  globalReligionSelect?.classList.remove('religion-hindu','religion-islam','religion-christian','religion-sikh','religion-buddhist','religion-jain');
  if (_globalReligion) globalReligionSelect?.classList.add('religion-' + _globalReligion.toLowerCase());

  const meta = getReligionMeta();

  // Update hero text
  const heroH1 = document.querySelector('.hero h1');
  const heroSub = document.querySelector('.hero .hero-sub');
  if (heroH1) heroH1.innerHTML = `<i class="fas ${meta.icon}"></i> ${_globalReligion ? 'Discover ' + meta.placeWord.charAt(0).toUpperCase() + meta.placeWord.slice(1) : 'Discover Sacred Places'}. Plan Your Divine Journey.`;
  if (heroSub) heroSub.textContent = _globalReligion ? `Explore ${meta.placeWord} — AI-powered search, trip planning & multilingual pilgrim guide for ${meta.label}` : 'Temples, Mosques, Churches, Gurudwaras & more — AI-powered search, trip planning & multilingual pilgrim guide for ALL religions';

  // Update search placeholder
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.placeholder = _globalReligion ? `Search ${meta.placeWord}...` : 'Search any sacred place — temple, mosque, church, gurudwara...';

  // Update filter-religion dropdown to match
  const filterReligion = document.getElementById('filter-religion');
  if (filterReligion) filterReligion.value = _globalReligion;

  // Update map filter buttons
  if (_globalReligion) {
    document.querySelectorAll('.map-filter').forEach(b => {
      b.classList.remove('active');
      if (b.dataset.filter === _globalReligion) b.classList.add('active');
    });
  } else {
    document.querySelectorAll('.map-filter').forEach(b => {
      b.classList.remove('active');
      if (b.dataset.filter === 'all') b.classList.add('active');
    });
  }

  // Update planner deity selector
  const plannerDeity = document.getElementById('planner-deity');
  if (plannerDeity && _globalReligion) {
    for (const opt of plannerDeity.options) {
      if (opt.textContent.toLowerCase().includes(_globalReligion.toLowerCase())) { plannerDeity.value = opt.value; break; }
    }
  } else if (plannerDeity) { plannerDeity.value = ''; }

  // Update rec-deity selector
  const recDeity = document.getElementById('rec-deity');
  if (recDeity && _globalReligion) {
    for (const opt of recDeity.options) {
      if (opt.textContent.toLowerCase().includes(_globalReligion.toLowerCase())) { recDeity.value = opt.value; break; }
    }
  } else if (recDeity) { recDeity.value = ''; }

  // Update map search placeholder
  const mapSearch = document.getElementById('map-search-input');
  if (mapSearch) mapSearch.placeholder = _globalReligion ? `Search ${meta.placeWord}...` : 'Search any temple, mosque, church, gurudwara...';

  // Show/hide religion-specific quick buttons in AI Guide
  document.querySelectorAll('.ai-quick').forEach(btn => {
    if (!_globalReligion) { btn.style.display = ''; return; }
    const q = (btn.dataset.q || '').toLowerCase();
    const r = _globalReligion.toLowerCase();
    const isRelevant = q.includes(r) || q.includes('multi') || q.includes('all');
    btn.style.display = isRelevant ? '' : 'none';
  });
}

function refreshAllForReligion() {
  const currentSection = document.querySelector('.section.active');
  const sectionId = currentSection ? currentSection.id.replace('section-', '') : 'home';

  // Re-load home sections
  loadTempleOfDay();
  loadMantra();
  loadDidYouKnow();
  loadFeaturedTemples();

  // Re-load active section data
  if (sectionId === 'temples') loadTemples();
  if (sectionId === 'festivals') loadFestivals();
  if (sectionId === 'map' && templeMap) {
    const filtered = _globalReligion ? allMapTemples.filter(t => (t.religion || '').includes(_globalReligion)) : allMapTemples;
    plotMapTemples(filtered);
  }
}

if (globalReligionSelect) {
  globalReligionSelect.value = _globalReligion;
  globalReligionSelect.addEventListener('change', function () {
    applyGlobalReligion(this.value);
    showToast(_globalReligion ? `Switched to ${_globalReligion} mode` : 'Showing all religions', 'success');
    refreshAllForReligion();
  });
}

// Apply on initial load
applyGlobalReligion(_globalReligion);

// ─── Helpers ────────────────────────────────────────────────────────────────

function escapeHtml(s) {
  if (!s) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function templeCardHTML(t) {
  const img = t.thumbnail || (t.gallery && t.gallery[0]) || '';
  const iconCls = religionCardIcon(t.religion);
  return `
    <div class="temple-card" data-id="${t.id}" data-religion="${escapeHtml(t.religion || '')}">
      <div class="temple-card-image" data-bg="${escapeHtml(img)}"><i class="fas ${iconCls} card-icon"></i></div>
      <div class="temple-card-body">
        <h3>${escapeHtml(t.name)}</h3>
        ${t.religion ? religionBadge(t.religion) : ''}
        <div class="meta">${religionIcon(t.religion)} ${escapeHtml(t.deity || '')} &bull; <i class="fas fa-map-marker-alt"></i> ${escapeHtml(t.location || t.city || '')}</div>
        <div class="timings"><i class="fas fa-clock"></i> ${escapeHtml(t.timings || '')}</div>
      </div>
    </div>`;
}

function loadCardImages(container) {
  container.querySelectorAll('.temple-card-image[data-bg]').forEach(el => {
    const url = el.dataset.bg;
    if (!url) return;
    const img = new Image();
    img.onload = () => {
      el.style.backgroundImage = `url('${url}')`;
      const icon = el.querySelector('.card-icon');
      if (icon) icon.remove();
    };
    img.onerror = () => {};
    img.src = url;
  });
}

function exploreCardHTML(t) {
  const img = t.thumbnail || '';
  const iconCls = religionCardIcon(t.religion);
  return `
    <div class="temple-card explore-card" data-name="${escapeHtml(t.name)}" data-lat="${t.lat}" data-lon="${t.lon}" data-religion="${escapeHtml(t.religion || '')}">
      <div class="temple-card-image ${img ? '' : 'explore-img'}" ${img ? `data-bg="${escapeHtml(img)}"` : ''}><i class="fas ${iconCls} card-icon"></i></div>
      <div class="temple-card-body">
        <h3>${escapeHtml(t.name)}</h3>
        ${t.religion ? religionBadge(t.religion) : ''}
        <div class="meta">${religionIcon(t.religion)} ${escapeHtml(t.deity || '')} &bull; <i class="fas fa-map-marker-alt"></i> ${escapeHtml(t.city)}</div>
        ${t.address ? `<div class="timings"><i class="fas fa-road"></i> ${escapeHtml(t.address)}</div>` : ''}
        ${t.lat ? `<a href="https://www.openstreetmap.org/?mlat=${t.lat}&mlon=${t.lon}#map=17/${t.lat}/${t.lon}" target="_blank" class="osm-link"><i class="fas fa-map"></i> View on Map</a>` : ''}
      </div>
    </div>`;
}

function bindCardClicks(container) {
  container.querySelectorAll('.temple-card[data-id]').forEach(card => {
    card.addEventListener('click', () => showTempleDetail(card.dataset.id));
  });
}

function formatAIText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^(\d+)\.\s/gm, '<br><strong>$1.</strong> ')
    .replace(/^[-•]\s/gm, '<br>&bull; ')
    .replace(/\n/g, '<br>');
}

// ─── Real-time LLM Alerts ───────────────────────────────────────────────────

let alertData = null;

async function loadAlerts() {
  try {
    const rel = getGlobalReligion();
    const res = await fetch(API + '/ai/alerts' + (rel ? '?religion=' + encodeURIComponent(rel) : ''));
    alertData = await res.json();
    if (alertData.alerts && alertData.alerts.length) {
      const items = alertData.alerts.map(a => {
        const iconMap = { calendar: 'fa-calendar', star: 'fa-star', moon: 'fa-moon', sun: 'fa-sun', bell: 'fa-bell' };
        const icon = iconMap[a.icon] || 'fa-bell';
        return `<span class="ticker-item"><i class="fas ${icon} priority-${a.priority || 'medium'}"></i> <strong>${escapeHtml(a.title)}:</strong> ${escapeHtml(a.message)}</span>`;
      }).join('');
      document.getElementById('ticker-content').innerHTML = items + items;
    }
    if (alertData.panchang) loadPanchang(alertData.panchang);
  } catch {
    document.getElementById('ticker-content').innerHTML =
      '<span class="ticker-item"><i class="fas fa-om"></i> Welcome to Temple Hub - AI-Powered Pilgrim Guide</span>' +
      '<span class="ticker-item"><i class="fas fa-om"></i> Welcome to Temple Hub - AI-Powered Pilgrim Guide</span>';
  }
}

// ─── Panchang ───────────────────────────────────────────────────────────────

function loadPanchang(panchang) {
  const grid = document.getElementById('panchang-grid');
  if (!grid || !panchang) return;
  const items = [
    { label: 'Tithi', value: panchang.tithi, icon: 'moon' },
    { label: 'Nakshatra', value: panchang.nakshatra, icon: 'star' },
    { label: 'Yoga', value: panchang.yoga, icon: 'om' },
    { label: 'Sunrise', value: panchang.sunrise, icon: 'sun' },
    { label: 'Sunset', value: panchang.sunset, icon: 'cloud-sun' },
    { label: 'Rahu Kaal', value: panchang.rahukaal, icon: 'exclamation-triangle' },
    { label: 'Auspicious Time', value: panchang.auspiciousTime, icon: 'check-circle' },
    { label: 'Karana', value: panchang.karana, icon: 'circle' }
  ].filter(i => i.value);
  grid.innerHTML = items.map(i => `
    <div class="panchang-item">
      <div class="label"><i class="fas fa-${i.icon}"></i> ${i.label}</div>
      <div class="value">${escapeHtml(i.value)}</div>
    </div>`).join('');
}

// ─── Temple of the Day ──────────────────────────────────────────────────────

async function loadTempleOfDay() {
  try {
    const rel = getGlobalReligion();
    const res = await fetch(API + '/ai/temple-of-day' + (rel ? '?religion=' + encodeURIComponent(rel) : ''));
    const t = await res.json();
    const content = document.getElementById('tod-content');
    const imgEl = document.getElementById('tod-image');

    if (t.thumbnail) {
      imgEl.style.backgroundImage = `url('${t.thumbnail}')`;
      imgEl.querySelector('i').style.display = 'none';
    }

    content.innerHTML = `
      <h3>${escapeHtml(t.name || 'Temple of the Day')}</h3>
      <div class="tod-tagline">"${escapeHtml(t.tagline || '')}"</div>
      <div class="tod-meta">
        <span><i class="fas fa-om"></i> ${escapeHtml(t.deity || '')}</span>
        <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(t.location || '')}</span>
        <span><i class="fas fa-clock"></i> ${escapeHtml(t.timings || '')}</span>
      </div>
      <p style="font-size:0.9rem;color:var(--text-muted);margin-bottom:0.75rem">${escapeHtml(t.whyVisit || '')}</p>
      ${t.funFact ? `<div class="tod-fact"><i class="fas fa-lightbulb" style="color:var(--accent);margin-right:0.4rem"></i> <strong>Fun Fact:</strong> ${escapeHtml(t.funFact)}</div>` : ''}
    `;

    document.getElementById('tod-image')?.parentElement?.addEventListener('click', () => {
      if (t.name) showExploreTempleDetail(t.name);
    });
  } catch {
    document.getElementById('tod-content').innerHTML = '<p style="color:var(--text-muted)">Could not load Temple of the Day</p>';
  }
}

// ─── Mantra of the Day ──────────────────────────────────────────────────────

async function loadMantra() {
  const el = document.getElementById('mantra-section');
  try {
    const rel = getGlobalReligion();
    const res = await fetch(API + '/ai/mantra' + (rel ? '?religion=' + encodeURIComponent(rel) : ''));
    const m = await res.json();
    el.innerHTML = `
      <div class="mantra-sanskrit">${escapeHtml(m.sanskrit || 'Om')}</div>
      <div class="mantra-transliteration">${escapeHtml(m.transliteration || '')}</div>
      <div class="mantra-meaning">${escapeHtml(m.meaning || '')}</div>
      ${m.deity ? `<div class="mantra-deity"><i class="fas fa-om"></i> ${escapeHtml(m.deity)} ${m.chantCount ? '&bull; Chant ' + escapeHtml(m.chantCount) + ' times' : ''}</div>` : ''}
    `;
  } catch {
    el.innerHTML = '<div class="mantra-sanskrit">Om Namah Shivaya</div><div class="mantra-meaning">I bow to Lord Shiva</div>';
  }
}

// ─── Did You Know ───────────────────────────────────────────────────────────

async function loadDidYouKnow() {
  const el = document.getElementById('dyk-cards');
  try {
    const rel = getGlobalReligion();
    const res = await fetch(API + '/ai/did-you-know' + (rel ? '?religion=' + encodeURIComponent(rel) : ''));
    const facts = await res.json();
    if (Array.isArray(facts) && facts.length) {
      el.innerHTML = facts.map(f => `
        <div class="dyk-card">
          <div class="dyk-icon"><i class="fas fa-lightbulb"></i></div>
          <p>${escapeHtml(f.fact)}</p>
          ${f.temple ? `<div class="dyk-temple"><i class="fas fa-place-of-worship"></i> ${escapeHtml(f.temple)}</div>` : ''}
          ${f.category ? `<span class="dyk-category">${escapeHtml(f.category)}</span>` : ''}
        </div>`).join('');
    }
  } catch {
    el.innerHTML = '<p style="color:var(--text-muted)">Could not load facts.</p>';
  }
}

// ─── Home: Featured Temples ─────────────────────────────────────────────────

async function loadFeaturedTemples() {
  const grid = document.getElementById('home-temple-grid');
  if (!grid) return;
  const rel = getGlobalReligion();
  try {
    const params = rel ? '?religion=' + encodeURIComponent(rel) : '';
    const res = await fetch(API + '/temples' + params);
    let list = await res.json();

    if (!list.length) {
      const meta = getReligionMeta();
      grid.innerHTML = '<div class="loading"><i class="fas fa-robot fa-spin"></i> Loading featured ' + escapeHtml(meta.placeWord) + ' from AI...</div>';
      try {
        const aiRes = await fetch(API + '/ai/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: rel ? 'top 6 most famous ' + rel + ' ' + meta.placeWord + ' in India' : 'top 6 most famous sacred places in India', religion: rel })
        });
        const aiData = await aiRes.json();
        if (aiData.temples && aiData.temples.length) list = aiData.temples;
      } catch {}
    }

    grid.innerHTML = list.slice(0, 6).map(t => templeCardHTML(t)).join('');
    bindCardClicks(grid);
    loadCardImages(grid);

    if (list[0] && list[0].source === 'ai') {
      grid.querySelectorAll('.temple-card').forEach(card => {
        card.onclick = null;
        card.addEventListener('click', () => {
          const temple = list.find(t => t.id === card.dataset.id);
          if (temple) showAITempleDetail(temple);
        });
      });
    }

    document.getElementById('stat-temples').textContent = (list.length > 6 ? list.length : '100') + '+';
  } catch {
    grid.innerHTML = '<p>Could not load temples.</p>';
  }
}

// ─── AI Quick Recommendations ───────────────────────────────────────────────

document.getElementById('rec-btn')?.addEventListener('click', async function () {
  const region = document.getElementById('rec-region').value;
  const deity = document.getElementById('rec-deity').value;
  const season = document.getElementById('rec-season').value;
  const resultsEl = document.getElementById('rec-results');
  resultsEl.classList.remove('hidden');
  resultsEl.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Getting AI recommendations...</div>';
  try {
    const res = await fetch(API + '/ai/smart-recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ region, deity: deity || (getGlobalReligion() ? getReligionMeta().placeWord : ''), season, preference: 'spiritual pilgrimage', religion: getGlobalReligion() })
    });
    const data = await res.json();
    if (data.reply) {
      resultsEl.innerHTML = '<div class="rec-reply">' + formatAIText(data.reply) + '</div>';
    } else {
      resultsEl.innerHTML = '<p>Could not get recommendations. ' + (data.error || '') + '</p>';
    }
  } catch {
    resultsEl.innerHTML = '<p>Network error. Please try again.</p>';
  }
});

// ─── Search (home) ──────────────────────────────────────────────────────────

document.getElementById('search-btn')?.addEventListener('click', doSearch);
document.getElementById('search-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

function doSearch() {
  const q = document.getElementById('search-input')?.value?.trim();
  if (!q) return;
  showSection('temples');
  document.getElementById('filter-name').value = q;
  setTimeout(() => document.getElementById('filter-btn')?.click(), 100);
}

// ─── Temples List + Filters ─────────────────────────────────────────────────

async function loadTemples() {
  const name = document.getElementById('filter-name')?.value?.trim() || '';
  const location = document.getElementById('filter-location')?.value?.trim() || '';
  const deity = document.getElementById('filter-deity')?.value?.trim() || '';
  const religion = document.getElementById('filter-religion')?.value || getGlobalReligion();
  const params = new URLSearchParams();
  if (name) params.set('q', name);
  if (location) params.set('location', location);
  if (deity) params.set('deity', deity);
  if (religion) params.set('religion', religion);
  const grid = document.getElementById('temples-grid');
  if (!grid) return;

  try {
    const res = await fetch(API + '/temples?' + params.toString());
    const localList = await res.json();

    if (localList.length) {
      grid.innerHTML = localList.map(t => templeCardHTML(t)).join('');
      bindCardClicks(grid);
      loadCardImages(grid);
      return;
    }

    const searchQuery = [name, location, deity].filter(Boolean).join(' ');
    if (!searchQuery) {
      grid.innerHTML = '<p>Enter a search term.</p>';
      return;
    }

    grid.innerHTML = '<div class="loading"><i class="fas fa-robot fa-spin"></i> Searching with AI for <strong>"' + escapeHtml(searchQuery) + '"</strong>...</div>';

    const aiRes = await fetch(API + '/ai/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchQuery })
    });
    const aiData = await aiRes.json();

    if (aiData.temples && aiData.temples.length) {
      grid.innerHTML = '<div class="ai-search-badge"><i class="fas fa-robot"></i> AI-powered results (Groq LLM) — ' + aiData.count + ' temples found</div>' +
        aiData.temples.map(t => templeCardHTML(t)).join('');
      grid.querySelectorAll('.temple-card').forEach(card => {
        card.addEventListener('click', () => {
          const temple = aiData.temples.find(t => t.id === card.dataset.id);
          if (temple) showAITempleDetail(temple);
        });
      });
      loadCardImages(grid);
    } else {
      grid.innerHTML = '<p>No temples found. Try a different search.</p>';
    }
  } catch {
    grid.innerHTML = '<p>Could not load temples.</p>';
  }
}

// ─── AI Temple Detail ───────────────────────────────────────────────────────

function showAITempleDetail(t) {
  showSection('temple-detail');
  setDetailActions(t.name);
  const content = document.getElementById('temple-detail-content');
  const gallery = document.getElementById('temple-gallery');
  const wikiSection = document.getElementById('wiki-section');
  const wikiContent = document.getElementById('wiki-content');
  const wikiLink = document.getElementById('wiki-link');

  const ritualsHtml = Array.isArray(t.rituals)
    ? t.rituals.map(r => '<li>' + escapeHtml(r) + '</li>').join('')
    : '<li>' + escapeHtml(t.rituals || '—') + '</li>';

  content.innerHTML = `
    <div class="ai-search-badge"><i class="fas fa-robot"></i> Temple info powered by Groq LLM</div>
    <div class="temple-detail-header">
      <h2>${escapeHtml(t.name)}</h2>
      <p class="meta"><i class="fas fa-om"></i> ${escapeHtml(t.deity)} &bull; <i class="fas fa-map-marker-alt"></i> ${escapeHtml(t.location)}</p>
    </div>
    <div class="detail-grid">
      <div class="detail-block"><h4><i class="fas fa-clock"></i> Timings</h4><p>${escapeHtml(t.timings || '—')}</p></div>
      <div class="detail-block"><h4><i class="fas fa-tshirt"></i> Dress Code</h4><p>${escapeHtml(t.dressCode || 'Traditional attire recommended.')}</p></div>
      <div class="detail-block"><h4><i class="fas fa-pray"></i> Rituals</h4><ul>${ritualsHtml}</ul></div>
      <div class="detail-block"><h4><i class="fas fa-landmark"></i> History</h4><p>${escapeHtml(t.history || '—')}</p></div>
      <div class="detail-block"><h4><i class="fas fa-info-circle"></i> Visitor Guidelines</h4><p>${escapeHtml(t.visitorGuidelines || '—')}</p></div>
      <div class="detail-block"><h4><i class="fas fa-sun"></i> Best Time to Visit</h4><p>${escapeHtml(t.bestTimeToVisit || '—')}</p></div>
      ${(t.festivals && t.festivals.length) ? '<div class="detail-block"><h4><i class="fas fa-calendar"></i> Festivals</h4><p>' + t.festivals.map(escapeHtml).join(', ') + '</p></div>' : ''}
    </div>`;

  wikiSection.classList.add('hidden');
  gallery.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading images...</div>';

  Promise.allSettled([
    fetch(API + '/wiki/' + encodeURIComponent(t.name)).then(r => r.json()),
    fetch(API + '/images/' + encodeURIComponent(t.name)).then(r => r.json())
  ]).then(([wikiRes, imgRes]) => {
    if (wikiRes.status === 'fulfilled' && wikiRes.value.extract) {
      const w = wikiRes.value;
      wikiSection.classList.remove('hidden');
      const srcTag = w.source === 'ai' ? ' <span class="ai-search-badge" style="display:inline;padding:0.2rem 0.5rem;font-size:0.75rem"><i class="fas fa-robot"></i> AI</span>' : '';
      wikiContent.innerHTML = `${w.thumbnail ? '<img src="' + w.thumbnail + '" class="wiki-thumb" alt="' + escapeHtml(w.title) + '">' : ''}
        <p>${escapeHtml(w.extract)}${srcTag}</p>`;
      if (w.url) { wikiLink.href = w.url; wikiLink.classList.remove('hidden'); }
      else wikiLink.classList.add('hidden');
    }
    if (imgRes.status === 'fulfilled' && imgRes.value.images && imgRes.value.images.length) {
      gallery.innerHTML = imgRes.value.images.map(img =>
        '<img src="' + escapeHtml(img.url) + '" alt="' + escapeHtml(img.title) + '" loading="lazy">'
      ).join('');
    } else {
      gallery.innerHTML = '<p>No images found on Wikimedia Commons.</p>';
    }
  });
}

document.getElementById('filter-btn')?.addEventListener('click', loadTemples);

// ─── Explore City ───────────────────────────────────────────────────────────

document.getElementById('explore-btn')?.addEventListener('click', exploreCity);
document.getElementById('explore-city')?.addEventListener('keydown', e => { if (e.key === 'Enter') exploreCity(); });

async function exploreCity() {
  const city = document.getElementById('explore-city')?.value?.trim();
  if (!city) return;
  const grid = document.getElementById('explore-grid');
  const status = document.getElementById('explore-status');
  const rel = getGlobalReligion();
  const meta = getReligionMeta();
  grid.innerHTML = '';
  status.classList.remove('hidden');
  status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching for ' + escapeHtml(rel ? meta.placeWord : 'sacred places') + ' in <strong>' + escapeHtml(city) + '</strong>...';
  try {
    const res = await fetch(API + '/explore/' + encodeURIComponent(city));
    const data = await res.json();
    let temples = data.temples || [];
    if (rel) temples = temples.filter(t => (t.religion || '').toLowerCase().includes(rel.toLowerCase()));
    if (temples.length) {
      const srcLabel = data.source === 'ai'
        ? '<i class="fas fa-robot"></i> Found <strong>' + temples.length + '</strong> ' + escapeHtml(rel ? meta.placeWord : 'sacred places') + ' in <strong>' + escapeHtml(city) + '</strong> (via Groq LLM)'
        : '<i class="fas fa-check-circle"></i> Found <strong>' + temples.length + '</strong> ' + escapeHtml(rel ? meta.placeWord : 'sacred places') + ' in <strong>' + escapeHtml(city) + '</strong> (via OpenStreetMap)';
      status.innerHTML = srcLabel;
      grid.innerHTML = temples.map(t => exploreCardHTML(t)).join('');
      loadCardImages(grid);
      grid.querySelectorAll('.explore-card').forEach(card => {
        card.addEventListener('click', () => showExploreTempleDetail(card.dataset.name));
      });
    } else {
      status.innerHTML = '<i class="fas fa-info-circle"></i> No temples found in "' + escapeHtml(city) + '". Try a different city.';
    }
  } catch {
    status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error searching temples. Try again.';
  }
}

// ─── Explore Temple Detail (Wikipedia + LLM) ────────────────────────────────

async function showExploreTempleDetail(templeName) {
  showSection('temple-detail');
  setDetailActions(templeName);
  const content = document.getElementById('temple-detail-content');
  const gallery = document.getElementById('temple-gallery');
  const wikiSection = document.getElementById('wiki-section');
  const wikiContent = document.getElementById('wiki-content');
  const wikiLink = document.getElementById('wiki-link');

  content.innerHTML = `<div class="temple-detail-header"><h2>${escapeHtml(templeName)}</h2></div>
    <div class="loading"><i class="fas fa-spinner fa-spin"></i> Fetching temple info from AI + Wikipedia...</div>`;
  gallery.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading images...</div>';

  const [wikiRes, imgRes, llmRes] = await Promise.allSettled([
    fetch(API + '/wiki/' + encodeURIComponent(templeName)).then(r => r.json()),
    fetch(API + '/images/' + encodeURIComponent(templeName + ' temple')).then(r => r.json()),
    fetch(API + '/ai/temple-detail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: templeName })
    }).then(r => r.json())
  ]);

  const llmData = (llmRes.status === 'fulfilled' && llmRes.value.name) ? llmRes.value : null;

  if (llmData) {
    const ritualsHtml = Array.isArray(llmData.rituals)
      ? llmData.rituals.map(r => '<li>' + escapeHtml(r) + '</li>').join('')
      : '';
    content.innerHTML = `
      <div class="ai-search-badge"><i class="fas fa-robot"></i> Temple info powered by Groq LLM</div>
      <div class="temple-detail-header">
        <h2>${escapeHtml(llmData.name || templeName)}</h2>
        <p class="meta"><i class="fas fa-om"></i> ${escapeHtml(llmData.deity || '')} &bull; <i class="fas fa-map-marker-alt"></i> ${escapeHtml(llmData.location || '')}</p>
      </div>
      <div class="detail-grid">
        <div class="detail-block"><h4><i class="fas fa-clock"></i> Timings</h4><p>${escapeHtml(llmData.timings || '—')}</p></div>
        <div class="detail-block"><h4><i class="fas fa-tshirt"></i> Dress Code</h4><p>${escapeHtml(llmData.dressCode || 'Traditional attire')}</p></div>
        ${ritualsHtml ? '<div class="detail-block"><h4><i class="fas fa-pray"></i> Rituals</h4><ul>' + ritualsHtml + '</ul></div>' : ''}
        <div class="detail-block"><h4><i class="fas fa-landmark"></i> History</h4><p>${escapeHtml(llmData.history || '—')}</p></div>
        <div class="detail-block"><h4><i class="fas fa-info-circle"></i> Visitor Guidelines</h4><p>${escapeHtml(llmData.visitorGuidelines || '—')}</p></div>
        <div class="detail-block"><h4><i class="fas fa-sun"></i> Best Time</h4><p>${escapeHtml(llmData.bestTimeToVisit || '—')}</p></div>
        ${(llmData.festivals && llmData.festivals.length) ? '<div class="detail-block"><h4><i class="fas fa-calendar"></i> Festivals</h4><p>' + llmData.festivals.map(escapeHtml).join(', ') + '</p></div>' : ''}
        ${(llmData.nearbyTemples && llmData.nearbyTemples.length) ? '<div class="detail-block"><h4><i class="fas fa-map-signs"></i> Nearby</h4><p>' + llmData.nearbyTemples.map(escapeHtml).join(', ') + '</p></div>' : ''}
      </div>`;
  } else {
    content.innerHTML = `<div class="temple-detail-header"><h2>${escapeHtml(templeName)}</h2></div>`;
  }

  if (wikiRes.status === 'fulfilled' && wikiRes.value.extract) {
    const w = wikiRes.value;
    wikiSection.classList.remove('hidden');
    const srcTag = w.source === 'ai' ? ' <span class="ai-search-badge" style="display:inline;padding:0.2rem 0.5rem;font-size:0.75rem"><i class="fas fa-robot"></i> AI</span>' : '';
    wikiContent.innerHTML = `${w.thumbnail ? `<img src="${w.thumbnail}" class="wiki-thumb" alt="${escapeHtml(w.title)}">` : ''}
      <p>${escapeHtml(w.extract)}${srcTag}</p>`;
    if (w.url) { wikiLink.href = w.url; wikiLink.classList.remove('hidden'); }
    else wikiLink.classList.add('hidden');
  } else {
    wikiSection.classList.add('hidden');
  }

  if (imgRes.status === 'fulfilled' && imgRes.value.images && imgRes.value.images.length) {
    gallery.innerHTML = imgRes.value.images.map(img =>
      `<img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.title)}" loading="lazy">`
    ).join('');
  } else {
    gallery.innerHTML = '<p>No images found on Wikimedia Commons.</p>';
  }
}

// ─── Temple Detail (local DB) ───────────────────────────────────────────────

async function showTempleDetail(id) {
  showSection('temple-detail');
  const content = document.getElementById('temple-detail-content');
  // setDetailActions will be called after we know the name
  const gallery = document.getElementById('temple-gallery');
  const wikiSection = document.getElementById('wiki-section');
  const wikiContent = document.getElementById('wiki-content');
  const wikiLink = document.getElementById('wiki-link');

  content.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading temple details...</div>';

  try {
    const res = await fetch(API + '/temples/' + encodeURIComponent(id));
    const t = await res.json();
    setDetailActions(t.name);

    const ritualsHtml = Array.isArray(t.rituals)
      ? t.rituals.map(r => '<li>' + escapeHtml(r) + '</li>').join('')
      : '<li>' + escapeHtml(t.rituals || '—') + '</li>';

    content.innerHTML = `
      <div class="temple-detail-header">
        <h2>${escapeHtml(t.name)}</h2>
        <p class="meta"><i class="fas fa-om"></i> ${escapeHtml(t.deity)} &bull; <i class="fas fa-map-marker-alt"></i> ${escapeHtml(t.location || t.city)}</p>
      </div>
      <div class="detail-grid">
        <div class="detail-block"><h4><i class="fas fa-clock"></i> Timings</h4><p>${escapeHtml(t.timings || '—')}</p></div>
        <div class="detail-block"><h4><i class="fas fa-tshirt"></i> Dress Code</h4><p>${escapeHtml(t.dressCode || 'Traditional attire recommended.')}</p></div>
        <div class="detail-block"><h4><i class="fas fa-pray"></i> Rituals</h4><ul>${ritualsHtml}</ul></div>
        <div class="detail-block"><h4><i class="fas fa-landmark"></i> History</h4><p>${escapeHtml(t.history || '—')}</p></div>
        <div class="detail-block"><h4><i class="fas fa-info-circle"></i> Guidelines</h4><p>${escapeHtml(t.visitorGuidelines || '—')}</p></div>
        <div class="detail-block"><h4><i class="fas fa-sun"></i> Best Time</h4><p>${escapeHtml(t.bestTimeToVisit || '—')}</p></div>
        ${(t.festivals && t.festivals.length) ? `<div class="detail-block"><h4><i class="fas fa-calendar"></i> Festivals</h4><p>${t.festivals.map(escapeHtml).join(', ')}</p></div>` : ''}
      </div>`;

    const [wikiRes, imgRes] = await Promise.allSettled([
      fetch(API + '/wiki/' + encodeURIComponent(t.name)).then(r => r.json()),
      fetch(API + '/images/' + encodeURIComponent(t.name)).then(r => r.json())
    ]);

    if (wikiRes.status === 'fulfilled' && wikiRes.value.extract) {
      const w = wikiRes.value;
      wikiSection.classList.remove('hidden');
      const srcTag = w.source === 'ai' ? ' <span class="ai-search-badge" style="display:inline;padding:0.2rem 0.5rem;font-size:0.75rem"><i class="fas fa-robot"></i> AI</span>' : '';
      wikiContent.innerHTML = `${w.thumbnail ? `<img src="${w.thumbnail}" class="wiki-thumb" alt="${escapeHtml(w.title)}">` : ''}
        <p>${escapeHtml(w.extract)}${srcTag}</p>`;
      if (w.url) { wikiLink.href = w.url; wikiLink.classList.remove('hidden'); }
      else wikiLink.classList.add('hidden');
    } else {
      wikiSection.classList.add('hidden');
    }

    if (imgRes.status === 'fulfilled' && imgRes.value.images && imgRes.value.images.length) {
      gallery.innerHTML = imgRes.value.images.map(img =>
        `<img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.title)}" loading="lazy">`
      ).join('');
    } else if (t.gallery && t.gallery.length) {
      gallery.innerHTML = t.gallery.map(url => `<img src="${escapeHtml(url)}" alt="Temple" loading="lazy">`).join('');
    } else {
      gallery.innerHTML = '<p>No images available.</p>';
    }
  } catch {
    content.innerHTML = '<p>Could not load temple details.</p>';
  }
}

document.getElementById('back-from-detail')?.addEventListener('click', () => showSection('temples'));

// ─── Detail Page Action Buttons (Story, Nearby, Quiz) ───────────────────────

let currentTempleName = '';

function setDetailActions(templeName) {
  currentTempleName = templeName;
  const actionsEl = document.getElementById('detail-actions');
  if (!actionsEl) return;
  document.getElementById('temple-story-section')?.classList.add('hidden');
  document.getElementById('temple-nearby-section')?.classList.add('hidden');
  actionsEl.innerHTML = `
    <button class="btn btn-outline" id="btn-story"><i class="fas fa-book-open"></i> Temple Story</button>
    <button class="btn btn-outline" id="btn-nearby"><i class="fas fa-map-signs"></i> Nearby Essentials</button>
  `;
  document.getElementById('btn-story')?.addEventListener('click', () => loadTempleStory(templeName));
  document.getElementById('btn-nearby')?.addEventListener('click', () => loadNearbyEssentials(templeName));
}

async function loadTempleStory(name) {
  const el = document.getElementById('temple-story-section');
  el.classList.remove('hidden');
  el.innerHTML = '<div class="loading"><i class="fas fa-book-open fa-spin"></i> Loading mythological story...</div>';
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  try {
    const res = await fetch(API + '/ai/story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!data.story) { el.innerHTML = '<p>Could not load story.</p>'; return; }
    const paragraphs = data.story.split('\n').filter(Boolean).map(p => '<p>' + escapeHtml(p) + '</p>').join('');
    el.innerHTML = `
      <h3><i class="fas fa-book-open"></i> ${escapeHtml(data.title || 'The Legend of ' + name)}</h3>
      <div class="story-text">${paragraphs}</div>
      ${data.characters && data.characters.length ? '<div class="story-characters">' + data.characters.map(c => `<span class="story-character"><i class="fas fa-user"></i> ${escapeHtml(c.name)} — ${escapeHtml(c.role)}</span>`).join('') + '</div>' : ''}
      ${data.moralLesson ? `<div class="story-moral"><i class="fas fa-pray" style="color:var(--accent);margin-right:0.4rem"></i> <strong>Spiritual Lesson:</strong> ${escapeHtml(data.moralLesson)}</div>` : ''}
      ${data.funFact ? `<div class="story-moral" style="border-left-color:var(--info)"><i class="fas fa-lightbulb" style="color:var(--info);margin-right:0.4rem"></i> <strong>Did You Know?</strong> ${escapeHtml(data.funFact)}</div>` : ''}
      ${data.source ? `<div class="story-source"><i class="fas fa-scroll"></i> Source: ${escapeHtml(typeof data.source === 'string' ? data.source : 'Hindu Scriptures')}</div>` : ''}
    `;
  } catch {
    el.innerHTML = '<p>Error loading story. Try again.</p>';
  }
}

async function loadNearbyEssentials(name) {
  const el = document.getElementById('temple-nearby-section');
  el.classList.remove('hidden');
  el.innerHTML = '<div class="loading"><i class="fas fa-map-signs fa-spin"></i> Loading nearby essentials...</div>';
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  try {
    const res = await fetch(API + '/ai/nearby', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ temple: name })
    });
    const d = await res.json();
    let html = `<h3><i class="fas fa-map-signs"></i> Nearby Essentials — ${escapeHtml(name)}</h3><div class="nearby-grid">`;

    if (d.food && d.food.length) {
      html += '<div class="nearby-card"><h4><i class="fas fa-utensils"></i> Food & Prasad</h4>';
      d.food.forEach(f => {
        html += `<div class="nearby-item"><strong>${escapeHtml(f.name)}</strong> <span style="color:var(--accent);font-size:0.78rem">${escapeHtml(f.type || '')}</span>
          <div class="sub"><i class="fas fa-star"></i> ${escapeHtml(f.specialty || '')} <i class="fas fa-rupee-sign"></i> ${escapeHtml(f.price || '')} <i class="fas fa-walking"></i> ${escapeHtml(f.distance || '')}</div></div>`;
      });
      html += '</div>';
    }

    if (d.stay && d.stay.length) {
      html += '<div class="nearby-card"><h4><i class="fas fa-bed"></i> Where to Stay</h4>';
      d.stay.forEach(s => {
        html += `<div class="nearby-item"><strong>${escapeHtml(s.name)}</strong> <span style="color:var(--accent);font-size:0.78rem">${escapeHtml(s.type || '')}</span>
          <div class="sub"><i class="fas fa-rupee-sign"></i> ${escapeHtml(s.price || '')} <i class="fas fa-walking"></i> ${escapeHtml(s.distance || '')}</div>
          ${s.tip ? `<div class="sub"><i class="fas fa-lightbulb"></i> ${escapeHtml(s.tip)}</div>` : ''}</div>`;
      });
      html += '</div>';
    }

    if (d.transport) {
      html += '<div class="nearby-card"><h4><i class="fas fa-bus"></i> Transport</h4>';
      if (d.transport.howToReach) html += `<div class="nearby-item"><strong>How to Reach</strong><div class="sub">${escapeHtml(d.transport.howToReach)}</div></div>`;
      if (d.transport.localTransport) html += `<div class="nearby-item"><strong>Local Transport</strong><div class="sub">${escapeHtml(d.transport.localTransport)}</div></div>`;
      if (d.transport.parking) html += `<div class="nearby-item"><strong>Parking</strong><div class="sub">${escapeHtml(d.transport.parking)}</div></div>`;
      html += '</div>';
    }

    if (d.shopping && d.shopping.length) {
      html += '<div class="nearby-card"><h4><i class="fas fa-shopping-bag"></i> Shopping</h4>';
      d.shopping.forEach(s => {
        html += `<div class="nearby-item"><strong>${escapeHtml(s.item)}</strong><div class="sub"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(s.where || '')}</div></div>`;
      });
      html += '</div>';
    }

    html += '</div>';
    el.innerHTML = html;
  } catch {
    el.innerHTML = '<p>Error loading nearby info. Try again.</p>';
  }
}

// ─── Pilgrimage Planner ─────────────────────────────────────────────────────

document.getElementById('planner-btn')?.addEventListener('click', async function () {
  const city = document.getElementById('planner-city')?.value?.trim();
  const days = document.getElementById('planner-days')?.value;
  const region = document.getElementById('planner-region')?.value;
  const deity = document.getElementById('planner-deity')?.value;
  const style = document.getElementById('planner-style')?.value;
  const resultEl = document.getElementById('planner-result');

  resultEl.innerHTML = '<div class="loading"><i class="fas fa-route fa-spin"></i> AI is planning your pilgrimage itinerary...</div>';

  try {
    const res = await fetch(API + '/ai/planner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startCity: city, days, region, deity: deity || (getGlobalReligion() ? getReligionMeta().placeWord : ''), travelStyle: style, religion: getGlobalReligion() })
    });
    const plan = await res.json();

    if (!plan.days || !plan.days.length) {
      resultEl.innerHTML = '<p>Could not generate itinerary. Try different options.</p>';
      return;
    }

    let html = `<h3 style="color:var(--accent);margin-bottom:1rem"><i class="fas fa-route"></i> ${escapeHtml(plan.title || 'Your Pilgrimage Itinerary')}</h3>`;

    for (const day of plan.days) {
      html += `<div class="itinerary-day">
        <span class="day-number">Day ${day.day}</span>
        <div class="day-city"><i class="fas fa-map-marker-alt" style="color:var(--accent)"></i> ${escapeHtml(day.city || '')}
          ${day.theme ? ` &bull; <em>${escapeHtml(day.theme)}</em>` : ''}
          ${day.weather ? ` &bull; <i class="fas fa-cloud-sun"></i> ${escapeHtml(day.weather)}` : ''}
        </div>`;
      if (day.travel) html += `<div class="day-travel"><i class="fas fa-bus"></i> ${escapeHtml(day.travel)}</div>`;
      if (Array.isArray(day.temples)) {
        for (const temple of day.temples) {
          html += `<div class="day-temple">
            <i class="fas fa-place-of-worship"></i>
            <div>
              <div class="day-temple-name">${escapeHtml(temple.name || '')}</div>
              ${temple.deity ? `<div class="day-temple-time"><i class="fas fa-om"></i> ${escapeHtml(temple.deity)}</div>` : ''}
              ${temple.time ? `<div class="day-temple-time"><i class="fas fa-clock"></i> ${escapeHtml(temple.time)}</div>` : ''}
              ${temple.specialDarshan ? `<div class="day-temple-time" style="color:#58a6ff"><i class="fas fa-star"></i> ${escapeHtml(temple.specialDarshan)}</div>` : ''}
              ${temple.mustDo ? `<div class="day-temple-time"><i class="fas fa-fire" style="color:var(--accent)"></i> ${escapeHtml(temple.mustDo)}</div>` : ''}
              ${temple.dressCode ? `<div class="day-temple-tip"><i class="fas fa-tshirt"></i> ${escapeHtml(temple.dressCode)}</div>` : ''}
              ${temple.dosDonts ? `<div class="day-temple-tip" style="color:var(--warning)"><i class="fas fa-exclamation-triangle"></i> ${escapeHtml(temple.dosDonts)}</div>` : ''}
              ${temple.tip ? `<div class="day-temple-tip"><i class="fas fa-lightbulb"></i> ${escapeHtml(temple.tip)}</div>` : ''}
            </div>
          </div>`;
        }
      }
      if (day.meals) {
        html += '<div class="day-stay" style="font-size:0.82rem">';
        if (day.meals.breakfast) html += `<i class="fas fa-coffee"></i> ${escapeHtml(day.meals.breakfast)} &nbsp;`;
        if (day.meals.lunch) html += `<i class="fas fa-utensils"></i> ${escapeHtml(day.meals.lunch)} &nbsp;`;
        if (day.meals.dinner) html += `<i class="fas fa-moon"></i> ${escapeHtml(day.meals.dinner)}`;
        html += '</div>';
      }
      if (day.nearbyAttractions && day.nearbyAttractions.length) {
        html += `<div class="day-stay" style="color:#58a6ff;font-size:0.82rem"><i class="fas fa-camera"></i> <strong>Nearby:</strong> ${day.nearbyAttractions.map(escapeHtml).join(', ')}</div>`;
      }
      if (day.localPhrases && day.localPhrases.length) {
        html += '<div class="day-stay" style="color:#b392f0;font-size:0.82rem"><i class="fas fa-language"></i> ';
        day.localPhrases.forEach(p => {
          html += `<em>"${escapeHtml(p.phrase)}"</em> = ${escapeHtml(p.meaning)} &nbsp;`;
        });
        html += '</div>';
      }
      if (day.accommodation) html += `<div class="day-stay"><i class="fas fa-bed"></i> Stay: ${escapeHtml(day.accommodation)}</div>`;
      if (day.estimatedCost) html += `<div class="day-stay"><i class="fas fa-rupee-sign"></i> ${escapeHtml(day.estimatedCost)}</div>`;
      html += '</div>';
    }

    html += '<div class="itinerary-summary">';
    if (plan.totalBudget) {
      const b = typeof plan.totalBudget === 'object' ? plan.totalBudget : { total: plan.totalBudget };
      if (b.min) html += `<div class="itinerary-summary-item"><div class="summary-label">Total Budget</div><div class="summary-value">${escapeHtml(b.min)}${b.max ? ' - ' + escapeHtml(b.max) : ''}</div></div>`;
      else html += `<div class="itinerary-summary-item"><div class="summary-label">Budget</div><div class="summary-value">${escapeHtml(typeof plan.totalBudget === 'string' ? plan.totalBudget : JSON.stringify(plan.totalBudget))}</div></div>`;
    }
    if (plan.bestSeason) html += `<div class="itinerary-summary-item"><div class="summary-label">Best Season</div><div class="summary-value">${escapeHtml(plan.bestSeason)}</div></div>`;
    if (plan.packingList && plan.packingList.length) html += `<div class="itinerary-summary-item"><div class="summary-label">Packing List</div><div class="summary-value">${plan.packingList.map(escapeHtml).join(', ')}</div></div>`;
    if (plan.packingTips && plan.packingTips.length) html += `<div class="itinerary-summary-item"><div class="summary-label">Packing Tips</div><div class="summary-value">${plan.packingTips.map(escapeHtml).join(', ')}</div></div>`;
    html += '</div>';

    if (plan.dosAndDonts) {
      html += '<div class="itinerary-summary" style="margin-top:0.75rem">';
      if (plan.dosAndDonts.dos) html += `<div class="itinerary-summary-item"><div class="summary-label" style="color:var(--success)">Do's</div><div class="summary-value">${plan.dosAndDonts.dos.map(escapeHtml).join(' &bull; ')}</div></div>`;
      if (plan.dosAndDonts.donts) html += `<div class="itinerary-summary-item"><div class="summary-label" style="color:var(--danger)">Don'ts</div><div class="summary-value">${plan.dosAndDonts.donts.map(escapeHtml).join(' &bull; ')}</div></div>`;
      html += '</div>';
    }

    if (plan.routeMapQuery) {
      html += `<div style="margin-top:1rem;text-align:center"><a href="https://www.google.com/maps/search/${encodeURIComponent(plan.routeMapQuery)}" target="_blank" class="btn btn-outline"><i class="fas fa-map-marked-alt"></i> Open Route in Google Maps</a></div>`;
    }

    resultEl.innerHTML = html;
  } catch {
    resultEl.innerHTML = '<p>Error generating itinerary. Please try again.</p>';
  }
});

// ─── Temple Comparison ──────────────────────────────────────────────────────

document.getElementById('compare-btn')?.addEventListener('click', async function () {
  const t1 = document.getElementById('compare-temple1')?.value?.trim();
  const t2 = document.getElementById('compare-temple2')?.value?.trim();
  if (!t1 || !t2) return;
  const resultEl = document.getElementById('compare-result');

  resultEl.innerHTML = '<div class="loading"><i class="fas fa-balance-scale fa-spin"></i> AI is comparing both temples...</div>';

  try {
    const res = await fetch(API + '/ai/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ temple1: t1, temple2: t2 })
    });
    const data = await res.json();

    if (!data.temple1 || !data.temple2) {
      resultEl.innerHTML = '<p>Could not compare. Try different temple names.</p>';
      return;
    }

    const stars = n => '<i class="fas fa-star"></i>'.repeat(Math.min(n || 0, 5));

    let html = '<div class="compare-header">';
    for (const key of ['temple1', 'temple2']) {
      const t = data[key];
      html += `<div class="compare-temple-card">
        <div class="compare-temple-img" ${t.thumbnail ? `style="background-image:url('${escapeHtml(t.thumbnail)}')"` : ''}>
          ${!t.thumbnail ? '<i class="fas fa-place-of-worship"></i>' : ''}
        </div>
        <div class="compare-temple-info">
          <h3>${escapeHtml(t.name)}</h3>
          <div class="meta"><i class="fas fa-om"></i> ${escapeHtml(t.deity || '')} &bull; <i class="fas fa-map-marker-alt"></i> ${escapeHtml(t.location || '')}</div>
          <div class="stars">${stars(t.rating)}</div>
          <p style="font-size:0.85rem;margin-top:0.5rem;color:var(--text-muted)">${escapeHtml(t.significance || '')}</p>
        </div>
      </div>`;
    }
    html += '</div>';

    if (data.comparison && data.comparison.length) {
      html += '<table class="compare-table"><thead><tr><th>Aspect</th><th>' + escapeHtml(data.temple1.name) + '</th><th>' + escapeHtml(data.temple2.name) + '</th></tr></thead><tbody>';
      for (const row of data.comparison) {
        html += `<tr><td>${escapeHtml(row.aspect)}</td><td>${escapeHtml(row.temple1)}</td><td>${escapeHtml(row.temple2)}</td></tr>`;
      }
      html += '</tbody></table>';
    }

    if (data.verdict) {
      html += `<div class="compare-verdict"><i class="fas fa-gavel"></i> ${escapeHtml(data.verdict)}</div>`;
    }

    resultEl.innerHTML = html;
  } catch {
    resultEl.innerHTML = '<p>Error comparing temples. Please try again.</p>';
  }
});

// ─── Festivals ──────────────────────────────────────────────────────────────

async function loadFestivals() {
  const listEl = document.getElementById('festival-list');
  if (!listEl) return;
  const rel = getGlobalReligion();
  try {
    const res = await fetch(API + '/festivals' + (rel ? '?religion=' + encodeURIComponent(rel) : ''));
    let list = await res.json();

    const meta = getReligionMeta();
    if (!list.length || list.length < 3) {
      listEl.innerHTML = '<div class="loading"><i class="fas fa-robot fa-spin"></i> Loading ' + escapeHtml(rel || 'religious') + ' festivals from AI...</div>';
      try {
        const aiRes = await fetch(API + '/ai/festivals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: rel ? 'major ' + rel + ' festivals in India' : 'major religious festivals of all religions in India', religion: rel })
        });
        const aiFestivals = await aiRes.json();
        if (Array.isArray(aiFestivals) && aiFestivals.length) {
          const existingNames = new Set(list.map(f => f.name.toLowerCase()));
          const newOnes = aiFestivals.filter(f => !existingNames.has((f.name || '').toLowerCase()));
          list = [...list, ...newOnes];
        }
      } catch {}
    }

    listEl.innerHTML = list.map(f => `
      <div class="festival-card">
        <h3><i class="fas fa-fire"></i> ${escapeHtml(f.name)}${f.source === 'ai' ? ' <span class="ai-search-badge" style="display:inline;padding:0.15rem 0.4rem;font-size:0.7rem"><i class="fas fa-robot"></i> AI</span>' : ''}</h3>
        <div class="month"><i class="fas fa-calendar"></i> ${escapeHtml(f.month)}</div>
        <p>${escapeHtml(f.description)}</p>
        <div class="rituals"><strong>Rituals:</strong> ${(f.rituals || []).map(escapeHtml).join(', ')}</div>
        ${(f.temples && f.temples.length) ? '<div class="rituals"><strong>Famous Temples:</strong> ' + f.temples.map(escapeHtml).join(', ') + '</div>' : ''}
      </div>
    `).join('');
  } catch {
    listEl.innerHTML = '<p>Could not load festivals.</p>';
  }
}

// ─── Wish / Prayer Guide ────────────────────────────────────────────────────

document.getElementById('wish-btn')?.addEventListener('click', doWishSearch);
document.getElementById('wish-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') doWishSearch(); });
document.querySelectorAll('.wish-quick').forEach(btn => {
  btn.addEventListener('click', function () {
    document.getElementById('wish-input').value = this.dataset.wish;
    doWishSearch();
  });
});

async function doWishSearch() {
  const wish = document.getElementById('wish-input')?.value?.trim();
  if (!wish) return;
  const resultEl = document.getElementById('wish-result');
  resultEl.innerHTML = '<div class="loading"><i class="fas fa-pray fa-spin"></i> Finding the best temples and rituals for your prayer...</div>';

  try {
    const res = await fetch(API + '/ai/wish-guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wish, religion: getGlobalReligion() })
    });
    const d = await res.json();

    let html = `<h3 style="color:var(--accent);margin:1rem 0"><i class="fas fa-pray"></i> Recommended for: "${escapeHtml(d.wish || wish)}"</h3>`;

    if (d.temples && d.temples.length) {
      for (const t of d.temples) {
        html += `<div class="wish-temple-card">
          <div class="wish-temple-img" ${t.thumbnail ? `style="background-image:url('${escapeHtml(t.thumbnail)}')"` : ''}>
            ${!t.thumbnail ? '<i class="fas fa-place-of-worship"></i>' : ''}
          </div>
          <div class="wish-temple-info">
            <h4>${escapeHtml(t.name)}</h4>
            <div class="meta"><i class="fas fa-om"></i> ${escapeHtml(t.deity || '')} &bull; <i class="fas fa-map-marker-alt"></i> ${escapeHtml(t.location || '')}</div>
            <div class="wish-detail-item"><i class="fas fa-star"></i> ${escapeHtml(t.whyThisTemple || '')}</div>
            <div class="wish-detail-item"><i class="fas fa-pray"></i> <strong>Ritual:</strong> ${escapeHtml(t.ritual || '')}</div>
            <div class="wish-detail-item"><i class="fas fa-calendar-check"></i> <strong>Best day:</strong> ${escapeHtml(t.bestDay || '')}</div>
            <div class="wish-detail-item"><i class="fas fa-gift"></i> <strong>Offering:</strong> ${escapeHtml(t.offering || '')}</div>
          </div>
        </div>`;
      }
    }

    if (d.mantra) {
      html += `<div class="wish-mantra-box">
        <div class="sanskrit">${escapeHtml(d.mantra.sanskrit || '')}</div>
        <div class="meaning">${escapeHtml(d.mantra.meaning || '')}</div>
        ${d.mantra.chantCount ? `<div class="chant-info"><i class="fas fa-om"></i> Chant ${escapeHtml(d.mantra.chantCount)} times daily</div>` : ''}
      </div>`;
    }

    if (d.generalAdvice) {
      html += `<div class="wish-advice-box"><i class="fas fa-lightbulb" style="color:var(--accent);margin-right:0.4rem"></i> ${escapeHtml(d.generalAdvice)}</div>`;
    }

    if (d.vratOrFast) {
      html += `<div class="wish-advice-box" style="border-left-color:var(--info)"><i class="fas fa-calendar" style="color:var(--info);margin-right:0.4rem"></i> <strong>Recommended Vrat/Fast:</strong> ${escapeHtml(d.vratOrFast)}</div>`;
    }

    resultEl.innerHTML = html;
  } catch {
    resultEl.innerHTML = '<p>Error getting wish guidance. Try again.</p>';
  }
}

// ─── Toast Notification System ──────────────────────────────────────────────

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i> ${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// ─── Back to Top ────────────────────────────────────────────────────────────

const backToTopBtn = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
  if (window.scrollY > 400) backToTopBtn?.classList.remove('hidden');
  else backToTopBtn?.classList.add('hidden');
});
backToTopBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ─── Scroll Reveal ──────────────────────────────────────────────────────────

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

function initReveal() {
  document.querySelectorAll('.reveal, .stat-card, .dyk-card, .temple-card, .festival-card').forEach(el => {
    if (!el.classList.contains('visible')) revealObserver.observe(el);
  });
}

// ─── Animated Counter ───────────────────────────────────────────────────────

function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    if (isNaN(target)) return;
    let current = 0;
    const step = Math.max(1, Math.floor(target / 40));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = current + (target >= 100 ? '+' : '');
    }, 30);
  });
}

// ─── Theme Toggle ───────────────────────────────────────────────────────────

const themeToggle = document.getElementById('theme-toggle');
function setTheme(theme) {
  document.body.classList.toggle('light', theme === 'light');
  const icon = themeToggle?.querySelector('i');
  if (icon) icon.className = theme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
  localStorage.setItem('theme', theme);
}

themeToggle?.addEventListener('click', () => {
  const isLight = document.body.classList.contains('light');
  setTheme(isLight ? 'dark' : 'light');
  showToast(`Switched to ${isLight ? 'dark' : 'light'} theme`, 'info');
});

if (localStorage.getItem('theme') === 'light') setTheme('light');

// ─── Voice Search ───────────────────────────────────────────────────────────

const voiceBtn = document.getElementById('voice-search-btn');
if (voiceBtn && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.interimResults = false;

  voiceBtn.addEventListener('click', () => {
    voiceBtn.classList.add('listening');
    showToast('Listening... Speak now!', 'info');
    recognition.start();
  });

  recognition.onresult = (e) => {
    const text = e.results[0][0].transcript;
    document.getElementById('search-input').value = text;
    voiceBtn.classList.remove('listening');
    showToast(`Heard: "${text}"`, 'success');
    doSearch();
  };

  recognition.onerror = () => {
    voiceBtn.classList.remove('listening');
    showToast('Could not understand. Try again.', 'error');
  };

  recognition.onend = () => voiceBtn.classList.remove('listening');
} else if (voiceBtn) {
  voiceBtn.style.display = 'none';
}

// ─── Temple Favorites (localStorage) ────────────────────────────────────────

function getFavorites() {
  try { return JSON.parse(localStorage.getItem('temple_favorites') || '[]'); } catch { return []; }
}

function saveFavorites(favs) {
  localStorage.setItem('temple_favorites', JSON.stringify(favs));
}

function isFavorite(name) {
  return getFavorites().some(f => f.name === name);
}

function toggleFavorite(temple) {
  let favs = getFavorites();
  const idx = favs.findIndex(f => f.name === temple.name);
  if (idx >= 0) {
    favs.splice(idx, 1);
    showToast(`Removed "${temple.name}" from favorites`, 'warning');
  } else {
    favs.push({ name: temple.name, deity: temple.deity || '', location: temple.location || '', thumbnail: temple.thumbnail || '' });
    showToast(`Added "${temple.name}" to favorites!`, 'success');
  }
  saveFavorites(favs);
  updateFavButtons();
}

function updateFavButtons() {
  document.querySelectorAll('.fav-btn').forEach(btn => {
    const name = btn.dataset.name;
    if (isFavorite(name)) {
      btn.classList.add('favorited');
      btn.innerHTML = '<i class="fas fa-heart"></i>';
    } else {
      btn.classList.remove('favorited');
      btn.innerHTML = '<i class="far fa-heart"></i>';
    }
  });
}

function loadFavorites() {
  const grid = document.getElementById('favorites-grid');
  if (!grid) return;
  const favs = getFavorites();
  if (!favs.length) {
    grid.innerHTML = '<p class="text-muted">No favorites yet. Click the <i class="fas fa-heart"></i> button on any temple to bookmark it!</p>';
    return;
  }
  grid.innerHTML = favs.map(t => `
    <div class="temple-card" style="cursor:pointer;position:relative" data-name="${escapeHtml(t.name)}">
      <button class="fav-btn favorited" data-name="${escapeHtml(t.name)}" onclick="event.stopPropagation();toggleFavorite({name:'${escapeHtml(t.name).replace(/'/g, "\\'")}',deity:'${escapeHtml(t.deity || '').replace(/'/g, "\\'")}',location:'${escapeHtml(t.location || '').replace(/'/g, "\\'")}',thumbnail:'${escapeHtml(t.thumbnail || '').replace(/'/g, "\\'")}'});loadFavorites()"><i class="fas fa-heart"></i></button>
      <div class="temple-card-image" ${t.thumbnail ? `style="background-image:url('${escapeHtml(t.thumbnail)}')"` : ''}>
        ${!t.thumbnail ? '<i class="fas fa-place-of-worship"></i>' : ''}
      </div>
      <div class="temple-card-body">
        <h3>${escapeHtml(t.name)}</h3>
        <p class="meta"><i class="fas fa-om"></i> ${escapeHtml(t.deity)} &bull; <i class="fas fa-map-marker-alt"></i> ${escapeHtml(t.location)}</p>
      </div>
    </div>
  `).join('');
  grid.querySelectorAll('.temple-card').forEach(card => {
    card.addEventListener('click', () => showExploreTempleDetail(card.dataset.name));
  });
}

// ─── Interactive Map (Leaflet + OpenStreetMap) ──────────────────────────────

let templeMap = null;
let mapMarkers = [];
let allMapTemples = [];

async function initMap() {
  const mapEl = document.getElementById('temple-map');
  if (!mapEl || templeMap) return;

  templeMap = L.map('temple-map').setView([20.5937, 78.9629], 5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18
  }).addTo(templeMap);

  mapEl.closest('.section')?.querySelector('.loading')?.remove();

  try {
    const rel = getGlobalReligion();
    const res = await fetch(API + '/ai/map-temples' + (rel ? '?religion=' + encodeURIComponent(rel) : ''));
    allMapTemples = await res.json();
    const filtered = rel ? allMapTemples.filter(t => (t.religion || '').includes(rel)) : allMapTemples;
    plotMapTemples(filtered);
    showToast(`Loaded ${filtered.length} ${rel || 'sacred'} places on map`, 'success');
  } catch {
    showToast('Could not load map data', 'error');
  }
}

function plotMapTemples(temples) {
  mapMarkers.forEach(m => templeMap.removeLayer(m));
  mapMarkers = [];

  const goldIcon = L.divIcon({
    html: '<i class="fas fa-place-of-worship" style="color:#d4a853;font-size:1.4rem;text-shadow:0 2px 4px rgba(0,0,0,0.5)"></i>',
    className: 'map-marker-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24]
  });

  temples.forEach(t => {
    if (!t.lat || !t.lng) return;
    const popup = `<div class="map-popup">
      ${t.thumbnail ? `<img src="${t.thumbnail}" alt="${t.name}">` : ''}
      <h4>${t.name}</h4>
      <div class="map-popup-meta">${t.religion || ''} &bull; ${t.deity || ''} &bull; ${t.city || ''}, ${t.state || ''}</div>
      ${t.type ? `<div class="map-popup-meta" style="color:#d4a853">${t.type}</div>` : ''}
      <button class="btn btn-outline" style="font-size:0.75rem;padding:0.2rem 0.5rem;margin-top:0.3rem" onclick="showExploreTempleDetail('${(t.name || '').replace(/'/g, "\\'")}')">View Details</button>
    </div>`;
    const marker = L.marker([t.lat, t.lng], { icon: goldIcon }).addTo(templeMap).bindPopup(popup);
    marker._religion = t.religion || 'Hindu';
    marker._templeType = t.type || 'Famous';
    mapMarkers.push(marker);
  });
}

document.querySelectorAll('.map-filter').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.map-filter').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    const filter = this.dataset.filter;
    const rel = getGlobalReligion();
    let filtered = allMapTemples;
    if (rel) filtered = filtered.filter(t => (t.religion || '').includes(rel));
    if (filter !== 'all' && !rel) filtered = filtered.filter(t => (t.religion || '').includes(filter) || (t.type || '').includes(filter));
    plotMapTemples(filtered);
  });
});

// ─── Map Search / Locate ────────────────────────────────────────────────────

let mapSearchMarker = null;

document.getElementById('map-search-btn')?.addEventListener('click', locateOnMap);
document.getElementById('map-search-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') locateOnMap(); });

async function locateOnMap() {
  const query = document.getElementById('map-search-input')?.value?.trim();
  if (!query || !templeMap) return;

  const infoEl = document.getElementById('map-info');
  infoEl.classList.remove('hidden');
  infoEl.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Searching for "' + escapeHtml(query) + '"...</div>';

  // First check if any loaded marker matches
  const lowerQ = query.toLowerCase();
  const existing = allMapTemples.find(t => (t.name || '').toLowerCase().includes(lowerQ));
  if (existing && existing.lat && existing.lng) {
    flyToPlace(existing.name, existing.lat, existing.lng, existing);
    return;
  }

  // Use Nominatim geocoding to find the place
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ' India')}&format=json&limit=5&addressdetails=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'SacredPlacesHub/1.0' } });
    const results = await res.json();

    if (results.length) {
      const place = results[0];
      const lat = parseFloat(place.lat);
      const lon = parseFloat(place.lon);
      const name = place.display_name ? place.display_name.split(',')[0].trim() : query;

      // Try to get an image from our backend
      let thumbnail = null;
      try {
        const imgRes = await fetch(API + '/wiki/' + encodeURIComponent(name));
        const imgData = await imgRes.json();
        if (imgData.thumbnail) thumbnail = imgData.thumbnail;
      } catch {}

      flyToPlace(name, lat, lon, {
        name,
        deity: '',
        religion: detectReligion(name),
        city: place.address?.city || place.address?.town || place.address?.village || '',
        state: place.address?.state || '',
        thumbnail,
        fullAddress: place.display_name
      });
    } else {
      // LLM fallback — ask AI for coordinates
      try {
        const aiRes = await fetch(API + '/ai/temple-detail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: query })
        });
        const aiData = await aiRes.json();
        if (aiData.name) {
          // Try geocoding the AI-returned name + location
          const retryUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(aiData.name + ' ' + (aiData.location || 'India'))}&format=json&limit=1`;
          const retryRes = await fetch(retryUrl, { headers: { 'User-Agent': 'SacredPlacesHub/1.0' } });
          const retryData = await retryRes.json();
          if (retryData.length) {
            flyToPlace(aiData.name, parseFloat(retryData[0].lat), parseFloat(retryData[0].lon), {
              name: aiData.name,
              deity: aiData.deity || '',
              religion: aiData.religion || detectReligion(aiData.name),
              city: (aiData.location || '').split(',')[0] || '',
              state: (aiData.location || '').split(',')[1]?.trim() || '',
              thumbnail: null,
              timings: aiData.timings,
              history: aiData.history
            });
          } else {
            infoEl.innerHTML = `<h4><i class="fas fa-info-circle"></i> ${escapeHtml(aiData.name)}</h4><p>${escapeHtml(aiData.history || 'Found via AI but could not determine exact coordinates.')}</p><p style="color:var(--text-muted);font-size:0.82rem"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(aiData.location || '')}</p>`;
          }
        } else {
          infoEl.innerHTML = '<p>Could not find "' + escapeHtml(query) + '" on the map. Try a more specific name.</p>';
        }
      } catch {
        infoEl.innerHTML = '<p>Could not find "' + escapeHtml(query) + '". Try a different search.</p>';
      }
    }
  } catch {
    infoEl.innerHTML = '<p>Network error. Please try again.</p>';
  }
}

function detectReligion(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('masjid') || n.includes('mosque') || n.includes('dargah')) return 'Islam';
  if (n.includes('church') || n.includes('cathedral') || n.includes('basilica')) return 'Christian';
  if (n.includes('gurudwara') || n.includes('gurdwara')) return 'Sikh';
  if (n.includes('monastery') || n.includes('vihara') || n.includes('buddha') || n.includes('pagoda')) return 'Buddhist';
  if (n.includes('jain') || n.includes('derasar')) return 'Jain';
  return 'Hindu';
}

function flyToPlace(name, lat, lon, data) {
  if (!templeMap) return;
  const infoEl = document.getElementById('map-info');

  // Remove previous search marker
  if (mapSearchMarker) {
    templeMap.removeLayer(mapSearchMarker);
    mapSearchMarker = null;
  }

  // Create a prominent marker
  const searchIcon = L.divIcon({
    html: `<div style="position:relative"><i class="fas fa-map-marker-alt" style="color:#f85149;font-size:2.2rem;text-shadow:0 3px 8px rgba(0,0,0,0.5);filter:drop-shadow(0 0 6px rgba(248,81,73,0.5))"></i><div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);background:#f85149;color:white;font-size:0.6rem;padding:0.1rem 0.3rem;border-radius:4px;white-space:nowrap;font-weight:700">FOUND</div></div>`,
    className: 'map-search-marker',
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -40]
  });

  const popup = `<div class="map-popup">
    ${data.thumbnail ? `<img src="${data.thumbnail}" alt="${escapeHtml(name)}">` : ''}
    <h4>${escapeHtml(name)}</h4>
    <div class="map-popup-meta">${data.religion ? religionBadge(data.religion) : ''}</div>
    <div class="map-popup-meta">${escapeHtml(data.deity || '')} ${data.city ? '&bull; ' + escapeHtml(data.city) : ''}</div>
    <button class="btn btn-outline" style="font-size:0.75rem;padding:0.2rem 0.5rem;margin-top:0.3rem" onclick="showExploreTempleDetail('${escapeHtml(name).replace(/'/g, "\\'")}')">View Details</button>
  </div>`;

  mapSearchMarker = L.marker([lat, lon], { icon: searchIcon }).addTo(templeMap).bindPopup(popup);

  // Fly to location
  templeMap.flyTo([lat, lon], 15, { duration: 1.5 });

  // Open popup after fly animation
  setTimeout(() => mapSearchMarker.openPopup(), 1600);

  // Show info panel
  infoEl.classList.remove('hidden');
  infoEl.innerHTML = `
    <h4>${religionIcon(data.religion)} ${escapeHtml(name)}</h4>
    ${data.religion ? '<div style="margin-bottom:0.35rem">' + religionBadge(data.religion) + '</div>' : ''}
    ${data.deity ? `<p style="margin-bottom:0.2rem"><i class="fas fa-star" style="color:var(--accent)"></i> ${escapeHtml(data.deity)}</p>` : ''}
    ${data.city || data.state ? `<p style="margin-bottom:0.2rem"><i class="fas fa-map-marker-alt" style="color:var(--accent)"></i> ${escapeHtml([data.city, data.state].filter(Boolean).join(', '))}</p>` : ''}
    ${data.timings ? `<p style="margin-bottom:0.2rem"><i class="fas fa-clock" style="color:var(--accent)"></i> ${escapeHtml(data.timings)}</p>` : ''}
    ${data.fullAddress ? `<p style="font-size:0.78rem;color:var(--text-muted);margin-top:0.3rem">${escapeHtml(data.fullAddress)}</p>` : ''}
    <p style="font-size:0.78rem;color:var(--text-muted);margin-top:0.3rem"><i class="fas fa-crosshairs"></i> ${lat.toFixed(4)}, ${lon.toFixed(4)}</p>
    <div style="margin-top:0.5rem;display:flex;gap:0.4rem">
      <button class="btn btn-outline" style="font-size:0.78rem" onclick="showExploreTempleDetail('${escapeHtml(name).replace(/'/g, "\\'")}')"><i class="fas fa-eye"></i> Full Details</button>
      <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lon}" target="_blank" class="btn btn-outline" style="font-size:0.78rem"><i class="fas fa-directions"></i> Google Maps</a>
    </div>
  `;

  showToast(`Located: ${name}`, 'success');
}

// ─── Horoscope / Rashi Guide ────────────────────────────────────────────────

// Date picker setup
const horoscopeDateInput = document.getElementById('horoscope-date');
const horoscopeDateLabel = document.getElementById('horoscope-date-label');
let horoscopeSelectedDate = new Date();
let lastSelectedRashi = null;
let lastSelectedRashiCard = null;

function formatDateForInput(d) {
  return d.toISOString().split('T')[0];
}
function formatDateLabel(d) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const cmp = new Date(d); cmp.setHours(0,0,0,0);
  const diff = Math.round((cmp - today) / 86400000);
  let tag = '';
  if (diff === 0) tag = '(Today)';
  else if (diff === 1) tag = '(Tomorrow)';
  else if (diff === -1) tag = '(Yesterday)';
  const dayName = d.toLocaleDateString('en-IN', { weekday: 'long' });
  return `${dayName} ${tag}`;
}
function updateHoroscopeDateUI() {
  horoscopeDateInput.value = formatDateForInput(horoscopeSelectedDate);
  horoscopeDateLabel.textContent = formatDateLabel(horoscopeSelectedDate);
}
updateHoroscopeDateUI();

horoscopeDateInput.addEventListener('change', () => {
  horoscopeSelectedDate = new Date(horoscopeDateInput.value + 'T00:00:00');
  updateHoroscopeDateUI();
  if (lastSelectedRashi) loadHoroscope(lastSelectedRashi, lastSelectedRashiCard);
});
document.getElementById('horoscope-prev')?.addEventListener('click', () => {
  horoscopeSelectedDate.setDate(horoscopeSelectedDate.getDate() - 1);
  updateHoroscopeDateUI();
  if (lastSelectedRashi) loadHoroscope(lastSelectedRashi, lastSelectedRashiCard);
});
document.getElementById('horoscope-next')?.addEventListener('click', () => {
  horoscopeSelectedDate.setDate(horoscopeSelectedDate.getDate() + 1);
  updateHoroscopeDateUI();
  if (lastSelectedRashi) loadHoroscope(lastSelectedRashi, lastSelectedRashiCard);
});
document.getElementById('horoscope-today')?.addEventListener('click', () => {
  horoscopeSelectedDate = new Date();
  updateHoroscopeDateUI();
  if (lastSelectedRashi) loadHoroscope(lastSelectedRashi, lastSelectedRashiCard);
});

async function loadHoroscope(rashi, cardEl) {
  const resultEl = document.getElementById('horoscope-result');
  resultEl.className = 'horoscope-result visible';
  resultEl.innerHTML = '<div class="loading"><i class="fas fa-star-of-life fa-spin"></i> Reading your stars...</div>';

  const dateParam = formatDateForInput(horoscopeSelectedDate);
  const symbolEl = cardEl?.querySelector('.rashi-symbol');
  const symbol = symbolEl ? symbolEl.textContent : '⭐';

  try {
    const rel = getGlobalReligion();
    const res = await fetch(API + '/ai/horoscope/' + encodeURIComponent(rashi) + '?date=' + dateParam + (rel ? '&religion=' + encodeURIComponent(rel) : ''));
    const d = await res.json();
    const stars = '<i class="fas fa-star"></i>'.repeat(Math.min(d.overallRating || 3, 5));

    const doItems = Array.isArray(d.doOnThisDay) ? d.doOnThisDay : [];
    const avoidItems = Array.isArray(d.avoidOnThisDay) ? d.avoidOnThisDay : [];

    resultEl.innerHTML = `
      <div class="horoscope-header">
        <div class="rashi-icon">${symbol}</div>
        <div>
          <h3>${escapeHtml(d.rashi || rashi)}</h3>
          <div class="date"><i class="fas fa-calendar-alt"></i> ${escapeHtml(d.date || dateParam)}</div>
          <div class="horoscope-stars">${stars}</div>
        </div>
      </div>
      ${d.daySignificance ? `<div class="day-significance"><i class="fas fa-sun"></i> ${escapeHtml(d.daySignificance)}</div>` : ''}
      <div class="horoscope-prediction">${escapeHtml(d.prediction || '')}</div>
      <div class="horoscope-grid">
        <div class="horoscope-item"><div class="label">Lucky Color</div><div class="value">${escapeHtml(d.luckyColor || '')}</div></div>
        <div class="horoscope-item"><div class="label">Lucky Number</div><div class="value">${escapeHtml(d.luckyNumber || '')}</div></div>
        <div class="horoscope-item"><div class="label">Lucky Deity</div><div class="value">${escapeHtml(d.luckyDeity || '')}</div></div>
        <div class="horoscope-item"><div class="label">Mantra</div><div class="value" style="font-size:0.82rem">${escapeHtml(d.mantra || '')}</div></div>
      </div>
      ${(doItems.length || avoidItems.length) ? `
      <div class="horoscope-do-avoid">
        ${doItems.length ? `<div class="horoscope-do-list"><h5><i class="fas fa-check-circle"></i> Do on this day</h5><ul>${doItems.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul></div>` : ''}
        ${avoidItems.length ? `<div class="horoscope-avoid-list"><h5><i class="fas fa-times-circle"></i> Avoid on this day</h5><ul>${avoidItems.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul></div>` : ''}
      </div>` : ''}
      ${d.luckyTemple ? `<div class="horoscope-temple">
        <h4><i class="fas fa-place-of-worship"></i> Lucky Sacred Place: ${escapeHtml(d.luckyTemple)}</h4>
        <p>${escapeHtml(d.templeRecommendation || '')}</p>
        <button class="btn btn-outline" style="margin-top:0.5rem;font-size:0.82rem" onclick="showExploreTempleDetail('${escapeHtml(d.luckyTemple).replace(/'/g, "\\'")}')"><i class="fas fa-eye"></i> View Place</button>
      </div>` : ''}
      ${d.advice ? `<div style="margin-top:0.75rem;padding:0.75rem;background:rgba(212,168,83,0.06);border-left:3px solid var(--accent);border-radius:0 var(--radius-sm) var(--radius-sm) 0;font-style:italic"><i class="fas fa-lightbulb" style="color:var(--accent);margin-right:0.3rem"></i>${escapeHtml(d.advice)}</div>` : ''}
    `;
  } catch {
    resultEl.innerHTML = '<p>Error loading horoscope. Try again.</p>';
  }
}

document.querySelectorAll('.rashi-card').forEach(card => {
  card.addEventListener('click', function () {
    document.querySelectorAll('.rashi-card').forEach(c => c.classList.remove('active'));
    this.classList.add('active');
    lastSelectedRashi = this.dataset.rashi;
    lastSelectedRashiCard = this;
    loadHoroscope(lastSelectedRashi, this);
  });
});

// ─── Aarti / Bhajan Loader ──────────────────────────────────────────────────

async function loadAarti(templeName) {
  const el = document.getElementById('temple-aarti-section');
  el.classList.remove('hidden');
  el.innerHTML = '<div class="loading"><i class="fas fa-music fa-spin"></i> Loading aarti/bhajan...</div>';
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  try {
    const res = await fetch(API + '/ai/aarti', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ temple: templeName })
    });
    const d = await res.json();
    if (!d.title) { el.innerHTML = '<p>Could not load aarti.</p>'; return; }

    const lyricsLines = (d.lyrics || '').split('|').filter(Boolean);
    const translitLines = (d.lyricsTransliteration || '').split('|').filter(Boolean);

    let lyricsHtml = '<div class="aarti-lyrics">';
    lyricsLines.forEach((line, i) => {
      lyricsHtml += `<div class="line">${escapeHtml(line.trim())}</div>`;
      if (translitLines[i]) lyricsHtml += `<div class="transliteration">${escapeHtml(translitLines[i].trim())}</div>`;
    });
    lyricsHtml += '</div>';

    el.innerHTML = `
      <h3><i class="fas fa-music"></i> ${escapeHtml(d.title)}</h3>
      ${d.deity ? `<p style="color:var(--text-muted);margin-bottom:0.75rem"><i class="fas fa-om"></i> Dedicated to ${escapeHtml(d.deity)}</p>` : ''}
      ${lyricsHtml}
      <div class="aarti-meta">
        ${d.meaning ? `<div class="aarti-meta-item"><div class="label">Meaning</div>${escapeHtml(d.meaning)}</div>` : ''}
        ${d.whenToSing ? `<div class="aarti-meta-item"><div class="label">When to Sing</div>${escapeHtml(d.whenToSing)}</div>` : ''}
        ${d.significance ? `<div class="aarti-meta-item" style="grid-column:1/-1"><div class="label">Spiritual Significance</div>${escapeHtml(d.significance)}</div>` : ''}
      </div>
    `;
  } catch {
    el.innerHTML = '<p>Error loading aarti. Try again.</p>';
  }
}

// ─── Enhanced setDetailActions (add Aarti + Favorite) ───────────────────────

const _origSetDetailActions = setDetailActions;
setDetailActions = function(templeName) {
  _origSetDetailActions(templeName);
  const actionsEl = document.getElementById('detail-actions');
  if (!actionsEl) return;

  const aartiBtn = document.createElement('button');
  aartiBtn.className = 'btn btn-outline';
  aartiBtn.innerHTML = '<i class="fas fa-music"></i> Aarti / Bhajan';
  aartiBtn.addEventListener('click', () => loadAarti(templeName));
  actionsEl.appendChild(aartiBtn);

  const favBtn = document.createElement('button');
  favBtn.className = 'btn btn-outline' + (isFavorite(templeName) ? ' favorited' : '');
  favBtn.innerHTML = `<i class="${isFavorite(templeName) ? 'fas' : 'far'} fa-heart"></i> ${isFavorite(templeName) ? 'Favorited' : 'Favorite'}`;
  favBtn.style.color = isFavorite(templeName) ? 'var(--danger)' : '';
  favBtn.addEventListener('click', () => {
    toggleFavorite({ name: templeName });
    favBtn.innerHTML = `<i class="${isFavorite(templeName) ? 'fas' : 'far'} fa-heart"></i> ${isFavorite(templeName) ? 'Favorited' : 'Favorite'}`;
    favBtn.style.color = isFavorite(templeName) ? 'var(--danger)' : '';
  });
  actionsEl.appendChild(favBtn);

  document.getElementById('temple-aarti-section')?.classList.add('hidden');
};

// ─── Section Navigation Enhancement ─────────────────────────────────────────

const origShowSection = showSection;
showSection = function(name) {
  origShowSection(name);
  if (name === 'map') setTimeout(() => { initMap(); templeMap?.invalidateSize(); }, 200);
  if (name === 'favorites') loadFavorites();
  setTimeout(initReveal, 300);
};

// ─── Init ───────────────────────────────────────────────────────────────────

loadAlerts();
loadTempleOfDay();
loadMantra();
loadDidYouKnow();
loadFeaturedTemples();
animateCounters();
setTimeout(initReveal, 500);
