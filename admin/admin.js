let datosCache = {};

async function comprobarSesion() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    document.getElementById('user-email').textContent = session.user.email || session.user.user_metadata?.user_name || '';
    await cargarTodo();
  } else {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-dashboard').style.display = 'none';
  }
}

async function cargarTodo() {
  for (const seccion of ['config', 'horarios', 'sacramentos', 'grupos', 'avisos', 'galeria']) {
    try {
      datosCache[seccion] = await obtenerSeccion(seccion);
      rellenarFormulario(seccion);
    } catch (e) {
      console.error('Error cargando', seccion, e);
    }
  }
  document.getElementById('loading').style.display = 'none';
}

function rellenarFormulario(seccion) {
  const data = datosCache[seccion];
  if (!data) return;

  if (seccion === 'config') {
    for (const [key, val] of Object.entries(data)) {
      const el = document.getElementById('cfg-' + key);
      if (el) el.value = val != null ? String(val) : '';
    }
    const mapa = document.getElementById('cfg-mapa');
    if (mapa) mapa.value = JSON.stringify(data.mapa || {}, null, 2);
    const redes = document.getElementById('cfg-redes');
    if (redes) redes.value = JSON.stringify(data.redes || {}, null, 2);
    return;
  }

  if (seccion === 'horarios') {
    for (const sub of ['misas', 'confesiones', 'adoracion']) {
      document.getElementById('hor-' + sub).value = JSON.stringify(data[sub] || [], null, 2);
    }
    document.getElementById('hor-nota').value = data.nota || '';
    return;
  }

  if (seccion === 'sacramentos') {
    document.getElementById('sac-intro').value = data.intro || '';
    document.getElementById('sac-items').value = JSON.stringify(data.items || [], null, 2);
    return;
  }

  if (seccion === 'grupos') {
    document.getElementById('gru-items').value = JSON.stringify(data.items || [], null, 2);
    return;
  }

  if (seccion === 'avisos') {
    document.getElementById('avi-items').value = JSON.stringify(data.items || [], null, 2);
    return;
  }

  if (seccion === 'galeria') {
    document.getElementById('gal-items').value = JSON.stringify(data.items || [], null, 2);
    return;
  }
}

function recogerFormulario(seccion) {
  const data = {};

  if (seccion === 'config') {
    for (const key of ['nombre', 'lema', 'descripcion', 'direccion', 'telefono', 'email', 'parroco']) {
      const el = document.getElementById('cfg-' + key);
      if (el) data[key] = el.value;
    }
    try { data.mapa = JSON.parse(document.getElementById('cfg-mapa').value); } catch {}
    try { data.redes = JSON.parse(document.getElementById('cfg-redes').value); } catch {}
    return data;
  }

  if (seccion === 'horarios') {
    for (const sub of ['misas', 'confesiones', 'adoracion']) {
      try { data[sub] = JSON.parse(document.getElementById('hor-' + sub).value); } catch { data[sub] = []; }
    }
    data.nota = document.getElementById('hor-nota').value;
    return data;
  }

  if (seccion === 'sacramentos') {
    data.intro = document.getElementById('sac-intro').value;
    try { data.items = JSON.parse(document.getElementById('sac-items').value); } catch { data.items = []; }
    return data;
  }

  if (seccion === 'grupos') {
    try { data.items = JSON.parse(document.getElementById('gru-items').value); } catch { data.items = []; }
    return data;
  }

  if (seccion === 'avisos') {
    try { data.items = JSON.parse(document.getElementById('avi-items').value); } catch { data.items = []; }
    return data;
  }

  if (seccion === 'galeria') {
    try { data.items = JSON.parse(document.getElementById('gal-items').value); } catch { data.items = []; }
    return data;
  }
}

async function guardar(seccion) {
  const data = recogerFormulario(seccion);
  const btn = document.querySelector(`[data-guardar="${seccion}"]`);
  if (btn) { btn.disabled = true; btn.textContent = 'Guardando…'; }
  try {
    await guardarSeccion(seccion, data);
    datosCache[seccion] = data;
    if (btn) { btn.textContent = '✓ Guardado'; setTimeout(() => { btn.textContent = 'Guardar'; btn.disabled = false; }, 2000); }
  } catch (e) {
    alert('Error: ' + e.message);
    if (btn) { btn.textContent = 'Guardar'; btn.disabled = false; }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  comprobarSesion();
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') comprobarSesion();
  });
});
