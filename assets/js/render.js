// Carga el contenido desde content/*.json y lo pinta en cada página.
// Cada función comprueba si existe su contenedor antes de actuar,
// de modo que un mismo archivo sirve para todas las páginas.

function esc(texto) {
  return String(texto == null ? "" : texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/`/g, "&#96;");
}

async function obtenerJSON(url) {
  const resp = await fetch(url, { cache: "no-cache" });
  if (!resp.ok) throw new Error("Error al cargar " + url + ": " + resp.status);
  return resp.json();
}

function mostrarError(contenedorId, mensaje) {
  const el = document.getElementById(contenedorId);
  if (el) el.innerHTML = '<p class="error-msg" role="alert">' + esc(mensaje) + "</p>";
}

function formatearFecha(iso) {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

function parrafos(texto) {
  return String(texto || "")
    .split(/\n{1,}/)
    .filter((p) => p.trim())
    .map((p) => "<p>" + esc(p.trim()) + "</p>")
    .join("");
}

function tablaHorario(filas, titulo) {
  return (
    '<table class="horario-tabla"><caption class="visually-hidden">' +
    esc(titulo || "Horario") +
    '</caption><thead><tr><th scope="col">Día</th><th scope="col">Horas</th></tr></thead><tbody>' +
    filas
      .map(
        (f) =>
          "<tr><td>" +
          esc(f.dia) +
          "</td><td>" +
          f.horas.map((h) => '<span class="chip">' + esc(h) + "</span>").join("") +
          "</td></tr>"
      )
      .join("") +
    "</tbody></table>"
  );
}

async function renderHorarios() {
  const necesita =
    document.getElementById("horarios-misas") || document.getElementById("proximas-misas");
  if (!necesita) return;
  try {
    const data = await obtenerJSON("content/horarios.json");

    const misas = document.getElementById("horarios-misas");
    if (misas) misas.innerHTML = tablaHorario(data.misas, "Horario de misas");

    const conf = document.getElementById("horarios-confesiones");
    if (conf) conf.innerHTML = tablaHorario(data.confesiones, "Horario de confesiones");

    const ador = document.getElementById("horarios-adoracion");
    if (ador && data.adoracion) ador.innerHTML = tablaHorario(data.adoracion, "Horario de adoraci&oacute;n");

    const nota = document.getElementById("horarios-nota");
    if (nota && data.nota) nota.textContent = data.nota;

    const proximas = document.getElementById("proximas-misas");
    if (proximas) {
      proximas.innerHTML = data.misas
        .map(
          (m) =>
            '<div class="card"><h3>' +
            esc(m.dia) +
            "</h3><div>" +
            m.horas.map((h) => '<span class="chip">' + esc(h) + "</span>").join("") +
            "</div></div>"
        )
        .join("");
    }
  } catch (e) {
    console.error(e);
    mostrarError("horarios-misas", "No se pudieron cargar los horarios.");
  }
}

async function renderSacramentos() {
  const cont = document.getElementById("sacramentos-lista");
  if (!cont) return;
  try {
    const data = await obtenerJSON("content/sacramentos.json");
    const intro = document.getElementById("sacramentos-intro");
    if (intro && data.intro) intro.textContent = data.intro;
    cont.innerHTML = data.items
      .map(
        (s) =>
          '<div class="card"><div class="sacramento-icon" aria-hidden="true">' +
          esc((s.nombre || "?").charAt(0)) +
          "</div><h3>" +
          esc(s.nombre) +
          "</h3><p>" +
          esc(s.descripcion) +
          '</p><p class="requisitos"><strong>Cómo prepararlo:</strong> ' +
          esc(s.requisitos) +
          "</p></div>"
      )
      .join("");
  } catch (e) {
    console.error(e);
    mostrarError("sacramentos-lista", "No se pudieron cargar los sacramentos.");
  }
}

async function renderAvisos() {
  const lista = document.getElementById("avisos-lista");
  const ultimos = document.getElementById("ultimos-avisos");
  if (!lista && !ultimos) return;
  try {
    const data = await obtenerJSON("content/avisos.json");
    const items = (data.items || []).slice().sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

    if (lista) {
      lista.innerHTML = items
        .map(
          (a) =>
            '<article class="card"><p class="meta">' +
            esc(formatearFecha(a.fecha)) +
            "</p><h3>" +
            esc(a.titulo) +
            "</h3>" +
            parrafos(a.cuerpo || a.resumen) +
            "</article>"
        )
        .join("");
    }

    if (ultimos) {
      ultimos.innerHTML = items
        .slice(0, 3)
        .map(
          (a) =>
            '<article class="card"><p class="meta">' +
            esc(formatearFecha(a.fecha)) +
            "</p><h3>" +
            esc(a.titulo) +
            "</h3><p>" +
            esc(a.resumen) +
            '</p><a href="avisos.html">Leer más avisos →</a></article>'
        )
        .join("");
    }
  } catch (e) {
    console.error(e);
    if (lista) mostrarError("avisos-lista", "No se pudieron cargar los avisos.");
    if (ultimos) mostrarError("ultimos-avisos", "No se pudieron cargar los avisos.");
  }
}

async function renderGrupos() {
  const cont = document.getElementById("grupos-lista");
  if (!cont) return;
  try {
    const data = await obtenerJSON("content/grupos.json");
    cont.innerHTML = data.items
      .map(
        (g) =>
          '<div class="card"><h3>' +
          esc(g.nombre) +
          '</h3><p class="meta">' +
          esc(g.horario) +
          "</p><p>" +
          esc(g.descripcion) +
          "</p>" +
          (g.contacto
            ? '<p><a href="mailto:' + esc(g.contacto) + '">' + esc(g.contacto) + "</a></p>"
            : "") +
          "</div>"
      )
      .join("");
  } catch (e) {
    console.error(e);
    mostrarError("grupos-lista", "No se pudieron cargar los grupos.");
  }
}

function abrirLightbox(src, titulo, desc) {
  let lb = document.getElementById("lightbox");
  if (!lb) {
    lb = document.createElement("div");
    lb.id = "lightbox";
    lb.className = "lightbox";
    lb.innerHTML =
      '<button class="lightbox-cerrar" aria-label="Cerrar">&times;</button>' +
      '<figure style="margin:0"><img alt=""><figcaption></figcaption></figure>';
    document.body.appendChild(lb);
    const cerrar = () => lb.classList.remove("is-open");
    lb.addEventListener("click", (e) => {
      if (e.target === lb || e.target.classList.contains("lightbox-cerrar")) cerrar();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") cerrar();
    });
  }
  lb.querySelector("img").src = src;
  lb.querySelector("img").alt = titulo || "";
  lb.querySelector("figcaption").textContent = [titulo, desc].filter(Boolean).join(" — ");
  lb.classList.add("is-open");
}

async function renderGaleria() {
  const cont = document.getElementById("galeria-lista");
  if (!cont) return;
  try {
    const data = await obtenerJSON("content/galeria.json");
    cont.innerHTML = data.items
      .map(
        (f, i) =>
          '<button class="galeria-item" data-i="' +
          i +
          '"><img src="' +
          esc(f.imagen) +
          '" alt="' +
          esc(f.titulo || "Foto de la parroquia") +
          '" loading="lazy"></button>'
      )
      .join("");
    cont.querySelectorAll(".galeria-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const f = data.items[Number(btn.dataset.i)];
        abrirLightbox(f.imagen, f.titulo, f.descripcion);
      });
    });
  } catch (e) {
    console.error(e);
    mostrarError("galeria-lista", "No se pudieron cargar las fotos.");
  }
}

function renderContacto() {
  const mapa = document.getElementById("mapa");
  if (!mapa) return;
  const config = window.PARROQUIA_CONFIG;
  if (!config || !config.mapa) return;
  const { lat, lng, zoom } = config.mapa;
  const delta = 0.01;
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join("%2C");
  const src =
    "https://www.openstreetmap.org/export/embed.html?bbox=" +
    bbox +
    "&layer=mapnik&marker=" +
    lat +
    "%2C" +
    lng;
  mapa.innerHTML =
    '<iframe title="Mapa de ubicación" loading="lazy" src="' +
    src +
    '"></iframe>';
  const enlace = document.getElementById("mapa-enlace");
  if (enlace) {
    enlace.href =
      "https://www.openstreetmap.org/?mlat=" + lat + "&mlon=" + lng + "#map=" + (zoom || 16) + "/" + lat + "/" + lng;
  }
}

// Se ejecuta cuando partials.js ya ha cargado config y los parciales.
document.addEventListener("parroquia:listo", () => {
  renderHorarios();
  renderSacramentos();
  renderAvisos();
  renderGrupos();
  renderGaleria();
  renderContacto();
});
