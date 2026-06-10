// ===== ADMIN =====
const SUPABASE_URL = 'https://ysdrqmsfpqyygeuhcwck.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TzwsthPoJXd8LzR1AB5vlA_bKsBT23E';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const FILTER_CATS = [
  { v: 'balkan', label: 'Balkan' },
  { v: 'slovenska', label: 'Slovenska' },
  { v: 'pop', label: 'Pop / Komercialno' },
  { v: 'house', label: 'House' },
  { v: 'hiphop', label: 'Hip-hop / R&B' },
  { v: 'latino', label: 'Latino' },
  { v: 'techno', label: 'Techno' },
  { v: 'evergreen', label: 'Evergreen' }
];
const GRADIENTS = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'];
const MAX_PHOTOS = 5;
function compressImage(file, maxW = 1200, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('compress failed')), 'image/jpeg', quality);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load failed')); };
      img.src = url;
    });
  }

// ---------- session ----------
(async function init() {
  const { data } = await sb.auth.getSession();
  if (data.session) showDashboard();
})();

async function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPass').value;
  const err = document.getElementById('loginError');
  err.style.display = 'none';
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) { err.textContent = 'Napačen email ali geslo.'; err.style.display = 'block'; return; }
  showDashboard();
}

async function logout() {
  await sb.auth.signOut();
  location.reload();
}

function showDashboard() {
  document.getElementById('loginView').style.display = 'none';
  document.getElementById('dashView').style.display = 'block';
  loadInquiries();
}

function switchTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('tab-inquiries').style.display = tab === 'inquiries' ? 'block' : 'none';
  document.getElementById('tab-djs').style.display = tab === 'djs' ? 'block' : 'none';
  if (tab === 'djs') loadDJs();
}

// ---------- POVPRAŠEVANJA ----------
async function loadInquiries() {
    const list = document.getElementById('inquiriesList');
    const { data, error } = await sb.from('inquiries').select('*').order('created_at', { ascending: false });
    if (error) { list.innerHTML = `<p class="inq-empty">Napaka pri nalaganju.</p>`; return; }
    if (!data.length) { list.innerHTML = `<p class="inq-empty">Še ni povpraševanj.</p>`; return; }
  
    list.innerHTML = data.map(i => {
      const d = new Date(i.created_at).toLocaleString('sl-SI', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
      const row = (label, val) => `<div class="inq-field"><div class="k">${label}</div><div class="v">${val || '—'}</div></div>`;
      const isNew = (i.status || 'novo') === 'novo';
      return `
        <div class="inq-card">
          <div class="inq-head">
            <div class="inq-head-left">
              <div class="inq-title">${i.event_type || 'Dogodek'}</div>
              <div class="inq-sub">${i.location || ''}</div>
            </div>
            <div class="inq-head-right">
              ${isNew ? '<span class="inq-status new">NOVO</span>' : '<span class="inq-status seen">Videno</span>'}
              <div class="inq-date">${d}</div>
            </div>
          </div>
          <div class="inq-grid">
            ${row('Tip dogodka', i.event_type)}
            ${row('Lokacija', i.location)}
            ${row('Zvrst glasbe', i.genre)}
            ${row('Datum dogodka', i.event_date)}
            ${row('Želen DJ', i.dj_name)}
          </div>
          <div class="inq-email-row">
            <div class="k">Email</div>
            <a class="inq-email-link" href="mailto:${i.email}">${i.email}</a>
          </div>
          ${i.message ? `<div class="inq-msg-wrap"><div class="k">Sporočilo</div><div class="inq-msg">${i.message}</div></div>` : ''}
          <div class="inq-actions">
            <a class="btn-mini" href="mailto:${i.email}">Odgovori po emailu</a>
            ${isNew ? `<button class="btn-mini" onclick="markSeen('${i.id}', this)">Označi kot videno</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
  
  async function markSeen(id, btn) {
    if (btn) { btn.disabled = true; btn.textContent = 'Shranjujem ...'; }
    const { error } = await sb.from('inquiries').update({ status: 'videno' }).eq('id', id);
    if (error) {
      if (btn) { btn.disabled = false; btn.textContent = 'Označi kot videno'; }
      alert('Napaka pri shranjevanju: ' + error.message);
      return;
    }
    loadInquiries();
  }

// ---------- DJ-ji: pomožne ----------
function splitCommas(s) { return s.split(',').map(x => x.trim()).filter(Boolean); }
function slugify(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/^dj\s+/, '').trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function deriveInitials(name) {
  const clean = name.replace(/^DJ\s+/i, '').trim();
  return (clean[0] || '?').toUpperCase();
}
function esc(s) { return (s || '').replace(/"/g, '&quot;'); }

// ---------- DJ-ji: seznam ----------
async function loadDJs() {
  const area = document.getElementById('djAdminArea');
  area.innerHTML = `<p style="color:var(--muted)">Nalagam ...</p>`;
  const { data, error } = await sb.from('djs').select('*').order('sort_order', { ascending: true });
  if (error) { area.innerHTML = `<p class="inq-empty">Napaka pri nalaganju DJ-jev.</p>`; return; }

  area.innerHTML = `
    <div class="dj-admin-head">
      <button class="btn btn-primary" onclick="showDJForm()">+ Dodaj DJ-ja</button>
    </div>
    <div class="dj-admin-list">
      ${(!data.length) ? `<p class="inq-empty">Še ni DJ-jev. Dodaj prvega.</p>` :
        data.map(dj => `
          <div class="dj-admin-row">
            <div class="dj-admin-thumb ${dj.gradient || 'g1'}">
              ${dj.photos && dj.photos.length ? `<img src="${dj.photos[0]}" alt="">` : `<span>${dj.initials || '?'}</span>`}
            </div>
            <div class="dj-admin-info">
              <div class="dj-admin-name">${dj.name}${dj.active ? '' : ' <span class="dj-inactive">skrit</span>'}</div>
              <div class="dj-admin-genre">${(dj.genres || []).join(' · ')}</div>
            </div>
            <div class="dj-admin-actions">
              <button class="btn-mini" onclick="showDJForm('${dj.id}')">Uredi</button>
              <button class="btn-mini danger" onclick="deleteDJ('${dj.id}', '${(dj.name||'').replace(/'/g,'')}')">Izbriši</button>
            </div>
          </div>
        `).join('')}
    </div>
  `;
}

// ---------- DJ-ji: forma ----------
let formPhotos = [];
let editingId = null;

async function showDJForm(id) {
  const area = document.getElementById('djAdminArea');
  editingId = id || null;
  let dj = { name:'', gradient:'g1', bio:'', genres:[], event_types:[], locations:[], cats:[], photos:[], sort_order:0, active:true };
  if (id) {
    const { data } = await sb.from('djs').select('*').eq('id', id).single();
    if (data) dj = data;
  }
  formPhotos = (dj.photos || []).slice();

  area.innerHTML = `
    <div class="dj-form">
      <div class="dj-form-head">
        <h3>${id ? 'Uredi DJ-ja' : 'Nov DJ'}</h3>
        <button class="btn-mini" onclick="loadDJs()">← Nazaj</button>
      </div>

      <div class="fg"><label>Ime</label>
        <input id="djName" type="text" value="${esc(dj.name)}" placeholder="npr. DJ Aron"></div>

      <div class="fg"><label>Opis (bio)</label>
        <textarea id="djBio" rows="4" placeholder="Kratek opis DJ-ja ...">${dj.bio || ''}</textarea></div>

      <div class="fg"><label>Zvrsti glasbe <span class="hint">ločeno z vejico — prikaže se na kartici</span></label>
        <input id="djGenres" type="text" value="${esc((dj.genres||[]).join(', '))}" placeholder="Balkan, Open format, Party hits"></div>

      <div class="fg"><label>Tipi dogodkov <span class="hint">ločeno z vejico</span></label>
        <input id="djEvents" type="text" value="${esc((dj.event_types||[]).join(', '))}" placeholder="Poroke, Rojstni dnevi, Klub"></div>

      <div class="fg"><label>Lokacije <span class="hint">ločeno z vejico</span></label>
        <input id="djLocations" type="text" value="${esc((dj.locations||[]).join(', '))}" placeholder="Obala, Ljubljana, Cela Slovenija"></div>

      <div class="fg"><label>Filtri <span class="hint">v katerih filtrih na strani se DJ prikaže</span></label>
        <div class="cats-grid">
          ${FILTER_CATS.map(c => `
            <label class="cat-check">
              <input type="checkbox" value="${c.v}" ${(dj.cats||[]).includes(c.v) ? 'checked' : ''}> ${c.label}
            </label>`).join('')}
        </div>
      </div>

      <div class="fg"><label>Barva kartice <span class="hint">vidna samo če DJ nima fotografije</span></label>
        <div class="grad-grid">
          ${GRADIENTS.map(g => `
            <label class="grad-swatch ${g} ${dj.gradient === g ? 'sel' : ''}">
              <input type="radio" name="djGrad" value="${g}" ${dj.gradient === g ? 'checked' : ''} onchange="document.querySelectorAll('.grad-swatch').forEach(s=>s.classList.remove('sel'));this.parentNode.classList.add('sel')">
            </label>`).join('')}
        </div>
      </div>

      <div class="fg"><label>Fotografije <span class="hint">prva je glavna · največ 5</span> <span id="photoCount" class="photo-count">0 / 5</span></label>
        <div class="photo-grid" id="photoGrid"></div>
        <label class="upload-btn" id="uploadBtn">
          <span class="upload-label">+ Naloži fotografijo</span>
          <input type="file" accept="image/*" multiple style="display:none" onchange="handlePhotoUpload(this)">
        </label>
        <p id="photoError" style="color:#EF4444;font-size:13px;margin-top:10px;display:none"></p>
      </div>

      <div class="fg-row">
        <div class="fg" style="flex:0 0 120px"><label>Vrstni red</label>
          <input id="djSort" type="number" value="${dj.sort_order || 0}"></div>
        <label class="cat-check" style="align-self:flex-end;padding-bottom:13px">
          <input type="checkbox" id="djActive" ${dj.active ? 'checked' : ''}> Viden na strani</label>
      </div>

      <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:8px" id="saveDJBtn" onclick="saveDJ()">${id ? 'Shrani spremembe' : 'Dodaj DJ-ja'}</button>
      <p id="djFormError" style="color:#EF4444;font-size:13px;margin-top:12px;display:none"></p>
    </div>
  `;
  renderPhotoGrid();
}

function renderPhotoGrid() {
  const grid = document.getElementById('photoGrid');
  if (!grid) return;
  grid.innerHTML = formPhotos.map((url, i) => `
    <div class="photo-item">
      <img src="${url}" alt="" onerror="this.parentNode.classList.add('broken')">
      ${i === 0 ? '<span class="photo-main">Glavna</span>' : ''}
      <button type="button" class="photo-remove" onclick="removePhoto(${i})">✕</button>
    </div>
  `).join('');

  const count = document.getElementById('photoCount');
  if (count) count.textContent = `${formPhotos.length} / ${MAX_PHOTOS}`;
  const btn = document.getElementById('uploadBtn');
  if (btn) btn.style.display = formPhotos.length >= MAX_PHOTOS ? 'none' : 'inline-flex';
}

function removePhoto(i) {
  formPhotos.splice(i, 1);
  renderPhotoGrid();
}

async function handlePhotoUpload(input) {
  let files = Array.from(input.files);
  input.value = '';
  if (!files.length) return;

  const errBox = document.getElementById('photoError');
  errBox.style.display = 'none';
  errBox.textContent = '';
  const showErr = (msg) => { errBox.textContent = msg; errBox.style.display = 'block'; };

  const slotsLeft = MAX_PHOTOS - formPhotos.length;
  if (slotsLeft <= 0) { showErr(`Največ ${MAX_PHOTOS} fotografij — najprej odstrani katero.`); return; }
  if (files.length > slotsLeft) { files = files.slice(0, slotsLeft); showErr(`Dodal sem le ${slotsLeft} (skupaj največ ${MAX_PHOTOS}).`); }

  const label = document.querySelector('#uploadBtn .upload-label');
  const btn = document.getElementById('uploadBtn');
  if (btn) btn.classList.add('loading');
  if (label) label.textContent = 'Nalagam ...';

  for (const file of files) {
    if (!file.type || !file.type.startsWith('image/')) { showErr('Izberi samo slikovne datoteke.'); continue; }
    if (file.size > 5 * 1024 * 1024) { showErr(`"${file.name}" presega 5 MB.`); continue; }
    try {
        let uploadData = file;
        let uploadType = file.type || 'image/jpeg';
        let ext = ((file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')) || 'jpg';
        try {
          uploadData = await compressImage(file);  // stisni
          uploadType = 'image/jpeg';
          ext = 'jpg';
        } catch (e) {
          // če stiskanje spodleti (npr. HEIC), naloži original — slika se vseeno shrani
          console.warn('Stiskanje ni uspelo, nalagam original:', e);
        }
        const path = `dj/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await sb.storage.from('dj-photos').upload(path, uploadData, { cacheControl: '31536000', upsert: false, contentType: uploadType });
      if (error) throw error;
      const { data } = sb.storage.from('dj-photos').getPublicUrl(path);
      formPhotos.push(data.publicUrl);
      renderPhotoGrid();
    } catch (e) {
      showErr('Napaka pri nalaganju: ' + (e.message || e));
    }
  }

  if (btn) btn.classList.remove('loading');
  if (label) label.textContent = '+ Naloži fotografijo';
  renderPhotoGrid();
}

async function saveDJ() {
  const err = document.getElementById('djFormError');
  err.style.display = 'none';
  const btn = document.getElementById('saveDJBtn');

  const name = document.getElementById('djName').value.trim();
  if (!name) { err.textContent = 'Vpiši ime DJ-ja.'; err.style.display = 'block'; return; }

  const cats = Array.from(document.querySelectorAll('.cats-grid input:checked')).map(c => c.value);
  const gradEl = document.querySelector('input[name="djGrad"]:checked');
  const payload = {
    name,
    initials: deriveInitials(name),
    gradient: gradEl ? gradEl.value : 'g1',
    bio: document.getElementById('djBio').value.trim(),
    genres: splitCommas(document.getElementById('djGenres').value),
    event_types: splitCommas(document.getElementById('djEvents').value),
    locations: splitCommas(document.getElementById('djLocations').value),
    cats,
    photos: formPhotos,
    sort_order: parseInt(document.getElementById('djSort').value, 10) || 0,
    active: document.getElementById('djActive').checked
  };

  btn.disabled = true;
  btn.textContent = 'Shranjujem ...';

  let res;
  if (editingId) {
    res = await sb.from('djs').update(payload).eq('id', editingId);
  } else {
    payload.id = slugify(name) || ('dj-' + Date.now().toString(36));
    res = await sb.from('djs').insert(payload);
  }

  btn.disabled = false;
  if (res.error) {
    err.textContent = res.error.message.includes('duplicate')
      ? 'DJ s tem imenom že obstaja — spremeni ime.'
      : 'Napaka pri shranjevanju: ' + res.error.message;
    err.style.display = 'block';
    btn.textContent = editingId ? 'Shrani spremembe' : 'Dodaj DJ-ja';
    return;
  }
  loadDJs();
}

async function deleteDJ(id, name) {
  if (!confirm(`Izbrišem "${name}"? Tega ni mogoče razveljaviti.`)) return;
  const { error } = await sb.from('djs').delete().eq('id', id);
  if (error) { alert('Napaka pri brisanju: ' + error.message); return; }
  loadDJs();
}