// ===== SUPABASE POVPRAŠEVANJE (deljeno: index.html + povprasevanje.html) =====
const SUPABASE_URL = 'https://ysdrqmsfpqyygeuhcwck.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TzwsthPoJXd8LzR1AB5vlA_bKsBT23E';

async function submitForm() {
  const root = document.getElementById('formFields');
  const btn = root.querySelector('button');

  // poberi vrednosti
  const selects = root.querySelectorAll('select');
  const email = root.querySelector('input[type="email"]').value.trim();

  // preprosta validacija emaila
  if (!email || !email.includes('@')) {
    alert('Prosim vpiši veljaven email naslov.');
    return;
  }

  const payload = {
    location: selects[0]?.value || '',
    event_type: selects[1]?.value || '',
    genre: selects[2]?.value || '',
    dj_name: document.getElementById('djNameField')?.value.trim() || '',
    event_date: root.querySelector('input[type="date"]').value || null,
    email: email,
    message: root.querySelector('textarea')?.value.trim() || ''
  };

  btn.disabled = true;
  btn.textContent = 'Pošiljam ...';

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Napaka pri pošiljanju');

    document.getElementById('formFields').style.display = 'none';
    document.getElementById('formSuccess').style.display = 'block';
    document.getElementById('formSuccess').scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Pošlji povpraševanje →';
    alert('Prišlo je do napake. Prosim poskusi znova ali nas kontaktiraj na info@tvoj-dj.si.');
  }
}