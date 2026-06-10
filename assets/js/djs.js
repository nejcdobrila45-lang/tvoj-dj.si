// ===== DJ PODATKI IZ SUPABASE + LOGIKA =====
const SB_URL = 'https://ysdrqmsfpqyygeuhcwck.supabase.co';
const SB_KEY = 'sb_publishable_TzwsthPoJXd8LzR1AB5vlA_bKsBT23E';
const sbClient = supabase.createClient(SB_URL, SB_KEY);

let djs = [];

async function fetchDJs() {
  const { data, error } = await sbClient
    .from('djs')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });
  if (error || !data) { console.error('Napaka pri nalaganju DJ-jev:', error); return []; }
  // map snake_case (baza) → camelCase (obstoječa koda)
  return data.map(d => ({
    id: d.id,
    name: d.name,
    initials: d.initials || (d.name ? d.name.replace(/^DJ\s+/i, '').trim().charAt(0).toUpperCase() : '?'),
    gradient: d.gradient || 'g1',
    photos: (d.photos && d.photos.length) ? d.photos : null,
    genres: d.genres || [],
    eventTypes: d.event_types || [],
    locations: d.locations || [],
    cats: d.cats || [],
    bio: d.bio || ''
  }));
}

// ===== RENDER KARTIC =====
async function renderDJs(gridId, limit = null) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = `<p style="color:var(--muted);grid-column:1/-1;text-align:center;padding:30px">Nalagam DJ-je ...</p>`;
  if (!djs.length) djs = await fetchDJs();
  const list = limit ? djs.slice(0, limit) : djs;
  if (!list.length) {
    grid.innerHTML = `<p style="color:var(--muted);grid-column:1/-1;text-align:center;padding:40px">Trenutno ni DJ-jev za prikaz.</p>`;
    return;
  }
  grid.innerHTML = list.map(dj => `
    <div class="dj-card" data-cat="${dj.cats.join(' ')}" data-id="${dj.id}">
      <div class="dj-photo ${dj.gradient}">
      ${dj.photos ? `<img src="${dj.photos[0]}" alt="${dj.name}" loading="lazy" decoding="async">` : `<span class="dj-initials">${dj.initials}</span>`}
      </div>
      <div class="dj-info">
        <h3>${dj.name}</h3>
        <div class="genre">${dj.genres.join(' · ')}</div>
        <div class="dj-tags">${dj.eventTypes.slice(0, 2).map(t => `<span class="tag">${t}</span>`).join('')}</div>
      </div>
    </div>
  `).join('');
  grid.querySelectorAll('.dj-card').forEach(card => {
    card.addEventListener('click', () => openModal(card.dataset.id));
  });
}

// ===== FILTER =====
function initFilters(gridId) {
  document.querySelectorAll('.chip').forEach(c => {
    c.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      const f = c.dataset.f;
      document.getElementById(gridId).querySelectorAll('.dj-card').forEach(card => {
        const show = f === 'all' || card.dataset.cat.includes(f);
        card.style.display = show ? '' : 'none';
      });
    });
  });
}

// ===== MODAL =====
const modal = document.getElementById('djModal');
const modalBody = document.getElementById('djModalBody');
let currentDJName = '';

function openModal(id) {
  const dj = djs.find(d => d.id === id);
  if (!dj) return;
  currentDJName = dj.name;
  modalBody.innerHTML = `
    <button class="modal-close" aria-label="Zapri" onclick="closeModal()">✕</button>
    <div class="modal-photo ${dj.gradient}">
    ${dj.photos ? `<img src="${dj.photos[0]}" alt="${dj.name}" id="modalMainImg" decoding="async">` : `<span class="dj-initials">${dj.initials}</span>`}
    </div>
    ${dj.photos && dj.photos.length > 1 ? `
      <div class="modal-gallery">
        ${dj.photos.map((p, i) => `<button class="modal-thumb ${i === 0 ? 'active' : ''}" onclick="swapPhoto('${p}', this)"><img src="${p}" alt="" loading="lazy" decoding="async"></button>`).join('')}
      </div>` : ''}
    <div class="modal-content">
      <h3>${dj.name}</h3>
      <div class="modal-genre">${dj.genres.join(' · ')}</div>
      <p class="modal-bio">${dj.bio}</p>
      <div class="modal-section">
        <h4>Tipi dogodkov</h4>
        <div class="dj-tags">${dj.eventTypes.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      </div>
      <div class="modal-section">
        <h4>Lokacije</h4>
        <div class="dj-tags">${dj.locations.map(l => `<span class="tag">${l}</span>`).join('')}</div>
      </div>
      <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:8px" onclick="djInquiry()">Povprašaj za ${dj.name} →</button>
    </div>
  `;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function swapPhoto(src, btn) {
  document.getElementById('modalMainImg').src = src;
  document.querySelectorAll('.modal-thumb').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
}

function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

function djInquiry() {
  window.location.href = 'povprasevanje.html?dj=' + encodeURIComponent(currentDJName);
}

if (modal) {
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}