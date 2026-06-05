// Carga cabecera y pie compartidos, configura el menú responsive
// y rellena los datos generales de la parroquia desde content/config.json.

async function cargarParcial(url, selector) {
  const destino = document.querySelector(selector);
  if (!destino) return;
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(resp.status);
    destino.innerHTML = await resp.text();
  } catch (e) {
    console.error("No se pudo cargar el parcial", url, e);
    destino.innerHTML = '<p class="error-msg" role="alert">Error al cargar el contenido.</p>';
  }
}

function activarMenu() {
  const toggle = document.querySelector(".nav-toggle");
  const lista = document.getElementById("menu-principal");
  if (!toggle || !lista) return;
  toggle.addEventListener("click", () => {
    const abierto = lista.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(abierto));
    toggle.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
  });
  lista.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      lista.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    })
  );
}

function marcarActivo() {
  const actual = document.body.getAttribute("data-page");
  if (!actual) return;
  const enlace = document.querySelector('[data-nav="' + actual + '"]');
  if (enlace) enlace.setAttribute("aria-current", "page");
}

function rellenarConfig(config) {
  document.querySelectorAll("[data-config]").forEach((el) => {
    const clave = el.getAttribute("data-config");
    if (config[clave] != null) el.textContent = config[clave];
  });
  document.querySelectorAll("[data-config-href]").forEach((el) => {
    const tipo = el.getAttribute("data-config-href");
    if (tipo === "tel" && config.telefono) {
      el.href = "tel:" + config.telefono.replace(/\s+/g, "");
    } else if (tipo === "mailto" && config.email) {
      el.href = "mailto:" + config.email;
    }
  });

  const social = document.querySelector("[data-social]");
  if (social && config.redes) {
    const nombres = { facebook: "Facebook", instagram: "Instagram", youtube: "YouTube" };
    social.innerHTML = Object.entries(config.redes)
      .filter(([, url]) => url)
      .map(
        ([red, url]) =>
          '<li><a href="' + url + '" target="_blank" rel="noopener">' +
          (nombres[red] || red) +
          "</a></li>"
      )
      .join("");
  }

  const anio = document.querySelector("[data-year]");
  if (anio) anio.textContent = new Date().getFullYear();

  if (config.nombre) {
    if (!document.title.includes(" | " + config.nombre)) {
      document.title = document.title + " | " + config.nombre;
    }
  }
}

async function init() {
  await Promise.all([
    cargarParcial("assets/partials/header.html", "#site-header"),
    cargarParcial("assets/partials/footer.html", "#site-footer"),
  ]);
  activarMenu();
  marcarActivo();

  try {
    const config = await obtenerSeccion("config");
    window.PARROQUIA_CONFIG = config;
    rellenarConfig(config);
  } catch (e) {
    console.error("No se pudo cargar config desde Supabase", e);
    try {
      const resp = await fetch("content/config.json", { cache: "no-cache" });
      if (!resp.ok) throw new Error(resp.status);
      const config = await resp.json();
      window.PARROQUIA_CONFIG = config;
      rellenarConfig(config);
    } catch (e2) {
      console.error("No se pudo cargar config.json", e2);
    }
  }

  document.dispatchEvent(new CustomEvent("parroquia:listo"));
}

document.addEventListener("DOMContentLoaded", init);
