let datosCache = {};

// ─── Sesión ────────────────────────────────

async function comprobarSesion() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'flex';
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
  else if (seccion === 'sacramentos') renderItems('sac', data.items || [], CAMPOS_ITEMS.sac, data.intro);
  else if (seccion === 'grupos') renderItems('gru', data.items || [], CAMPOS_ITEMS.gru);
  else if (seccion === 'avisos') renderItems('avi', data.items || [], CAMPOS_ITEMS.avi);
  else if (seccion === 'galeria') renderItems('gal', data.items || [], CAMPOS_ITEMS.gal);
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
    container.innerHTML = '';
    arr.forEach((item, i) => {
      const card = crearFilaHorarioDOM(sub, i, item);
      container.appendChild(card);
    });
  }
  const notaEl = document.getElementById('hor-nota');
  if (notaEl) notaEl.value = data.nota || '';
}

function crearFilaHorarioDOM(sub, i, item) {
  const horas = (item.horas || []).join(', ');
  const card = document.createElement('div');
  card.className = 'item-card';
  card.dataset.index = i;
  card.dataset.sub = sub;

  const h4 = document.createElement('h4');
  h4.textContent = 'Horario #' + (i + 1);
  card.appendChild(h4);

  const removeBtn = document.createElement('button');
  removeBtn.className = 'admin-btn admin-btn-sm admin-btn-danger item-remove';
  removeBtn.title = 'Eliminar horario';
  removeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
  removeBtn.addEventListener('click', () => eliminarHorario(sub, i));
  card.appendChild(removeBtn);

  const formRow = document.createElement('div');
  formRow.className = 'form-row';

  const diaDiv = document.createElement('div');
  diaDiv.className = 'fg';
  const diaLabel = document.createElement('label');
  diaLabel.textContent = 'Día';
  const diaInput = document.createElement('input');
  diaInput.className = 'hor-dia';
  diaInput.value = item.dia || '';
  diaInput.addEventListener('input', () => actualizarHorario(sub, i));
  diaDiv.appendChild(diaLabel);
  diaDiv.appendChild(diaInput);
  formRow.appendChild(diaDiv);

  const horasDiv = document.createElement('div');
  horasDiv.className = 'fg';
  const horasLabel = document.createElement('label');
  horasLabel.textContent = 'Horas (separadas por coma)';
  const horasInput = document.createElement('input');
  horasInput.className = 'hor-horas';
  horasInput.value = horas;
  horasInput.addEventListener('input', () => actualizarHorario(sub, i));
  horasDiv.appendChild(horasLabel);
  horasDiv.appendChild(horasInput);
  formRow.appendChild(horasDiv);

  card.appendChild(formRow);
  return card;
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
  const notaEl = document.getElementById('hor-nota');
  data.nota = notaEl?.value || '';
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
  container.innerHTML = '';
  items.forEach((item, i) => {
    const card = crearItemCardDOM(pref, campos, i, item);
    container.appendChild(card);
  });
}

function crearItemCardDOM(pref, campos, i, item) {
  const card = document.createElement('div');
  card.className = 'item-card';
  card.dataset.index = i;
  card.dataset.pref = pref;

  const h4 = document.createElement('h4');
  h4.textContent = 'Elemento #' + (i + 1);
  card.appendChild(h4);

  const removeBtn = document.createElement('button');
  removeBtn.className = 'admin-btn admin-btn-sm admin-btn-danger item-remove';
  removeBtn.title = 'Eliminar elemento';
  removeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
  removeBtn.addEventListener('click', () => eliminarItem(pref, i));
  card.appendChild(removeBtn);

  const formRow = document.createElement('div');
  formRow.className = 'form-row';

  campos.forEach(c => {
    const val = item[c.key] || '';
    const fg = document.createElement('div');
    fg.className = 'fg';
    if (c.tipo === 'textarea') fg.classList.add('full');

    const label = document.createElement('label');
    label.textContent = c.label;
    fg.appendChild(label);

    let input;
    if (c.tipo === 'textarea') {
      input = document.createElement('textarea');
      input.textContent = val;
      input.addEventListener('input', () => actualizarItem(pref, i, c.key, input.value));
    } else if (c.tipo === 'date') {
      input = document.createElement('input');
      input.type = 'date';
      input.value = val;
      input.addEventListener('input', () => actualizarItem(pref, i, c.key, input.value));
    } else {
      input = document.createElement('input');
      input.value = val;
      input.addEventListener('input', () => actualizarItem(pref, i, c.key, input.value));
    }
    fg.appendChild(input);
    formRow.appendChild(fg);
  });

  let previewHtml = null;
  if (pref === 'gal') {
    const imgUrl = getPreviewUrl(item.imagen);
    const fallbackSvg = "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2250%22 viewBox=%220 0 80 50%22%3E%3Crect width=%2280%22 height=%2250%22 fill=%22%23e2e8f0%22/%3E%3Ctext x=%2250%25%22 y=%2255%25%22 font-size=%2216%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3E📷%3C/text%3E%3C/svg%3E";
    const displaySrc = imgUrl || fallbackSvg;

    const previewContainer = document.createElement('div');
    previewContainer.className = 'image-preview-container';
    previewContainer.style.gridColumn = '1 / -1';

    const img = document.createElement('img');
    img.src = displaySrc;
    img.className = 'image-preview-thumbnail';
    img.alt = '';
    img.onerror = function() { this.src = fallbackSvg; this.onerror = null; };

    const info = document.createElement('div');
    info.className = 'image-preview-info';
    info.textContent = imgUrl ? 'Vista previa de la imagen' : 'Introduce la ruta de la imagen para ver la miniatura';

    previewContainer.appendChild(img);
    previewContainer.appendChild(info);
    previewHtml = { img, info, imgUrl, fallbackSvg };
  }

  card.appendChild(formRow);
  if (previewHtml) card.appendChild(previewHtml.img.parentElement);

  return card;
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

function getPreviewUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
    return path;
  }
  return '../' + path;
}

function actualizarItem(pref, i, key, val) {
  const seccion = mapearSeccion(pref);
  if (datosCache[seccion]?.items?.[i]) {
    datosCache[seccion].items[i][key] = val;

    // Live update image preview if image field changes in gallery
    if (pref === 'gal' && key === 'imagen') {
      const container = document.querySelector(`#section-galeria #gal-items-container`);
      const card = container?.children[i];
      if (card) {
        const img = card.querySelector('.image-preview-thumbnail');
        const info = card.querySelector('.image-preview-info');
        const url = getPreviewUrl(val);
        const fallbackSvg = "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2250%22 viewBox=%220 0 80 50%22%3E%3Crect width=%2280%22 height=%2250%22 fill=%22%23e2e8f0%22/%3E%3Ctext x=%2250%25%22 y=%2255%25%22 font-size=%2216%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3E📷%3C/text%3E%3C/svg%3E";
        if (img) {
          img.src = url || fallbackSvg;
          img.onerror = function() {
            this.src = fallbackSvg;
            this.onerror = null;
          };
          if (info) {
            info.textContent = url ? 'Vista previa de la imagen' : 'Introduce la ruta de la imagen para ver la miniatura';
          }
        }
      }
    }
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

let guardando = false;

async function guardar(seccion) {
  if (guardando) return;
  guardando = true;
  // Double-check authentication before any write operation
  const { data: { session }, error: sessionError } = await sb.auth.getSession();
  if (sessionError || !session) {
    mostrarNotificacion('Sesión expirada. Por favor, inicia sesión de nuevo.', 'error');
    sb.auth.signOut();
    window.location.reload();
    return;
  }

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
    mostrarNotificacion('Error: ' + e.message, 'error');
    if (btn) { btn.textContent = 'Guardar cambios'; btn.disabled = false; }
  } finally {
    guardando = false;
  }
}

function mostrarNotificacion(mensaje, tipo) {
  let notif = document.getElementById('admin-notification');
  if (!notif) {
    notif = document.createElement('div');
    notif.id = 'admin-notification';
    notif.style.cssText = 'position:fixed;top:1rem;right:1rem;padding:1rem 1.5rem;border-radius:10px;font-family:var(--fuente);font-size:0.875rem;font-weight:500;z-index:9999;max-width:400px;box-shadow:0 10px 25px rgba(0,0,0,0.15);transition:all 0.3s;transform:translateX(120%);';
    document.body.appendChild(notif);
  }

  if (tipo === 'error') {
    notif.style.backgroundColor = '#ef4444';
    notif.style.color = '#ffffff';
  } else {
    notif.style.backgroundColor = '#10b981';
    notif.style.color = '#ffffff';
  }

  notif.textContent = mensaje;
  notif.style.transform = 'translateX(0)';

  setTimeout(() => {
    notif.style.transform = 'translateX(120%)';
    setTimeout(() => { notif.remove(); }, 300);
  }, 4000);
}

// ─── Util ──────────────────────────────────

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;');
}
