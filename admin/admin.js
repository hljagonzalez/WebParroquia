let datosCache = {};

// ─── Sesión ────────────────────────────────

async function comprobarSesion() {
  const { data: { session } } = await sb.auth.getSession();
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

document.addEventListener('DOMContentLoaded', () => {
  comprobarSesion();
  sb.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') comprobarSesion();
  });
  document.getElementById('tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.admin-tab');
    if (!tab) return;
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('section-' + tab.dataset.tab).classList.add('active');
  });
});

// ─── Carga inicial ─────────────────────────

async function cargarTodo() {
  for (const seccion of ['config', 'horarios', 'sacramentos', 'grupos', 'avisos', 'galeria']) {
    try {
      datosCache[seccion] = await obtenerSeccion(seccion) || {};
      renderizar(seccion);
    } catch (e) {
      console.error('Error cargando', seccion, e);
    }
  }
  document.getElementById('loading').style.display = 'none';
}

// ─── Renderizado ───────────────────────────

function renderizar(seccion) {
  const data = datosCache[seccion] || {};
  if (seccion === 'config') renderConfig(data);
  else if (seccion === 'horarios') renderHorarios(data);
  else if (seccion === 'sacramentos') renderItems('sac', data.items || [], ['nombre', 'icono', 'descripcion', 'requisitos'], data.intro);
  else if (seccion === 'grupos') renderItems('gru', data.items || [], ['nombre', 'horario', 'descripcion', 'contacto']);
  else if (seccion === 'avisos') renderItems('avi', data.items || [], ['titulo', 'fecha', 'resumen', 'cuerpo']);
  else if (seccion === 'galeria') renderItems('gal', data.items || [], ['imagen', 'titulo', 'descripcion']);
}

// ─── Config ────────────────────────────────

function renderConfig(data) {
  for (const key of ['nombre', 'lema', 'descripcion', 'direccion', 'telefono', 'email', 'parroco']) {
    const el = document.getElementById('cfg-' + key);
    if (el) el.value = data[key] || '';
  }
  if (data.mapa) {
    setVal('cfg-mapa-lat', data.mapa.lat);
    setVal('cfg-mapa-lng', data.mapa.lng);
    setVal('cfg-mapa-zoom', data.mapa.zoom);
  }
  if (data.redes) {
    setVal('cfg-redes-facebook', data.redes.facebook);
    setVal('cfg-redes-instagram', data.redes.instagram);
    setVal('cfg-redes-youtube', data.redes.youtube);
  }
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val != null ? val : '';
}

function recogerConfig() {
  const data = {};
  for (const key of ['nombre', 'lema', 'descripcion', 'direccion', 'telefono', 'email', 'parroco']) {
    data[key] = document.getElementById('cfg-' + key)?.value || '';
  }
  data.mapa = {
    lat: parseFloat(document.getElementById('cfg-mapa-lat')?.value) || 0,
    lng: parseFloat(document.getElementById('cfg-mapa-lng')?.value) || 0,
    zoom: parseInt(document.getElementById('cfg-mapa-zoom')?.value) || 16,
  };
  data.redes = {
    facebook: document.getElementById('cfg-redes-facebook')?.value || '',
    instagram: document.getElementById('cfg-redes-instagram')?.value || '',
    youtube: document.getElementById('cfg-redes-youtube')?.value || '',
  };
  return data;
}

// ─── Horarios (tablas dinámicas) ───────────

function renderHorarios(data) {
  for (const sub of ['misas', 'confesiones', 'adoracion']) {
    const arr = data[sub] || [];
    const container = document.getElementById('hor-' + sub + '-container');
    if (!container) continue;
    container.innerHTML = arr.map((item, i) => htmlFilaHorario(sub, i, item)).join('');
  }
  document.getElementById('hor-nota').value = data.nota || '';
}

function htmlFilaHorario(sub, i, item) {
  const horas = (item.horas || []).join(', ');
  return `<div class="item-card" data-index="${i}">
    <button class="admin-btn admin-btn-sm admin-btn-danger item-remove" onclick="eliminarHorario('${sub}',${i})">×</button>
    <div class="form-row">
      <div class="fg"><label>Día</label><input class="hor-dia" value="${esc(item.dia)}" onchange="actualizarHorario('${sub}',${i})" /></div>
      <div class="fg"><label>Horas (separadas por coma)</label><input class="hor-horas" value="${esc(horas)}" onchange="actualizarHorario('${sub}',${i})" /></div>
    </div>
  </div>`;
}

function agregarHorario(sub) {
  const arr = datosCache.horarios[sub] = datosCache.horarios[sub] || [];
  arr.push({ dia: '', horas: [] });
  renderHorarios(datosCache.horarios);
}

function eliminarHorario(sub, i) {
  datosCache.horarios[sub].splice(i, 1);
  renderHorarios(datosCache.horarios);
}

function actualizarHorario(sub, i) {
  const container = document.getElementById('hor-' + sub + '-container');
  const card = container?.children[i];
  if (!card) return;
  const dia = card.querySelector('.hor-dia')?.value || '';
  const horasStr = card.querySelector('.hor-horas')?.value || '';
  datosCache.horarios[sub][i] = { dia, horas: horasStr.split(',').map(s => s.trim()).filter(Boolean) };
}

function recogerHorarios() {
  const data = {};
  for (const sub of ['misas', 'confesiones', 'adoracion']) {
    data[sub] = datosCache.horarios[sub] || [];
  }
  data.nota = document.getElementById('hor-nota')?.value || '';
  return data;
}

// ─── Items genéricos (sacramentos, grupos, avisos, galeria) ──

const CAMPOS_ITEMS = {
  sac: [
    { key: 'nombre', label: 'Nombre', tipo: 'text' },
    { key: 'icono', label: 'Icono', tipo: 'text' },
    { key: 'descripcion', label: 'Descripción', tipo: 'textarea' },
    { key: 'requisitos', label: 'Requisitos', tipo: 'textarea' },
  ],
  gru: [
    { key: 'nombre', label: 'Nombre', tipo: 'text' },
    { key: 'horario', label: 'Horario', tipo: 'text' },
    { key: 'descripcion', label: 'Descripción', tipo: 'textarea' },
    { key: 'contacto', label: 'Email de contacto', tipo: 'text' },
  ],
  avi: [
    { key: 'titulo', label: 'Título', tipo: 'text' },
    { key: 'fecha', label: 'Fecha', tipo: 'date' },
    { key: 'resumen', label: 'Resumen', tipo: 'textarea' },
    { key: 'cuerpo', label: 'Texto completo', tipo: 'textarea' },
  ],
  gal: [
    { key: 'imagen', label: 'Ruta de la imagen', tipo: 'text' },
    { key: 'titulo', label: 'Título', tipo: 'text' },
    { key: 'descripcion', label: 'Descripción', tipo: 'text' },
  ],
};

function renderItems(pref, items, campos, intro) {
  if (intro !== undefined) {
    const el = document.getElementById(pref + '-intro');
    if (el) el.value = intro || '';
  }
  const container = document.getElementById(pref + '-items-container');
  if (!container) return;
  container.innerHTML = items.map((item, i) => htmlItemCard(pref, campos, i, item)).join('');
}

function htmlItemCard(pref, campos, i, item) {
  const fields = campos.map(c => {
    const val = item[c.key] || '';
    if (c.tipo === 'textarea') {
      return `<div class="fg full"><label>${esc(c.label)}</label><textarea onchange="actualizarItem('${pref}',${i},'${esc(c.key)}',this.value)">${esc(val)}</textarea></div>`;
    }
    if (c.tipo === 'date') {
      return `<div class="fg"><label>${esc(c.label)}</label><input type="date" value="${esc(val)}" onchange="actualizarItem('${pref}',${i},'${esc(c.key)}',this.value)" /></div>`;
    }
    return `<div class="fg"><label>${esc(c.label)}</label><input value="${esc(val)}" onchange="actualizarItem('${pref}',${i},'${esc(c.key)}',this.value)" /></div>`;
  }).join('');

  return `<div class="item-card" data-index="${i}">
    <button class="admin-btn admin-btn-sm admin-btn-danger item-remove" onclick="eliminarItem('${pref}',${i})">×</button>
    <div class="form-row">${fields}</div>
  </div>`;
}

function agregarItem(pref) {
  const seccion = mapearSeccion(pref);
  const item = {};
  for (const c of CAMPOS_ITEMS[pref]) item[c.key] = '';
  datosCache[seccion].items = datosCache[seccion].items || [];
  datosCache[seccion].items.push(item);
  renderizar(seccion);
}

function eliminarItem(pref, i) {
  const seccion = mapearSeccion(pref);
  datosCache[seccion].items.splice(i, 1);
  renderizar(seccion);
}

function actualizarItem(pref, i, key, val) {
  const seccion = mapearSeccion(pref);
  if (datosCache[seccion]?.items?.[i]) {
    datosCache[seccion].items[i][key] = val;
  }
}

function mapearSeccion(pref) {
  const map = { sac: 'sacramentos', gru: 'grupos', avi: 'avisos', gal: 'galeria' };
  return map[pref] || pref;
}

// ─── Recoger formularios ───────────────────

function recogerFormulario(seccion) {
  if (seccion === 'config') return recogerConfig();
  if (seccion === 'horarios') return recogerHorarios();
  if (seccion === 'sacramentos') return { intro: document.getElementById('sac-intro')?.value || '', items: datosCache.sacramentos.items || [] };
  if (seccion === 'grupos') return { items: datosCache.grupos.items || [] };
  if (seccion === 'avisos') return { items: datosCache.avisos.items || [] };
  if (seccion === 'galeria') return { items: datosCache.galeria.items || [] };
  return {};
}

// ─── Guardar ───────────────────────────────

async function guardar(seccion) {
  const data = recogerFormulario(seccion);
  const btn = document.querySelector(`[data-guardar="${seccion}"]`);
  if (btn) { btn.disabled = true; btn.textContent = 'Guardando…'; }
  try {
    await guardarSeccion(seccion, data);
    datosCache[seccion] = data;
    if (btn) {
      btn.textContent = '✓ Guardado';
      btn.classList.add('admin-btn-success');
      setTimeout(() => { btn.textContent = 'Guardar cambios'; btn.classList.remove('admin-btn-success'); btn.disabled = false; }, 2000);
    }
  } catch (e) {
    alert('Error: ' + e.message);
    if (btn) { btn.textContent = 'Guardar cambios'; btn.disabled = false; }
  }
}

// ─── Util ──────────────────────────────────

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
