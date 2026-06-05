# Web de la Parroquia

Sitio web **estático** (HTML + CSS + JavaScript, sin framework ni compilación) pensado para publicarse gratis en **GitHub Pages**. El contenido que cambia (horarios, avisos, grupos, galería y datos de contacto) vive en archivos dentro de la carpeta `content/`, y la web los carga y muestra automáticamente.

## Estructura del proyecto

```
.
├── index.html              # Inicio
├── horarios.html           # Horarios de misas, confesiones y adoración
├── sacramentos.html        # Sacramentos
├── avisos.html             # Avisos y noticias
├── grupos.html             # Grupos y actividades
├── galeria.html            # Galería de fotos
├── contacto.html           # Contacto y mapa
├── content/                # CONTENIDO EDITABLE
│   ├── config.json         #   datos generales (nombre, dirección, mapa, redes…)
│   ├── horarios.json       #   horarios de misas y confesiones
│   ├── sacramentos.json    #   textos de cada sacramento
│   ├── grupos.json         #   grupos y actividades
│   ├── avisos.json         #   avisos / noticias
│   └── galeria.json        #   fotos de la galería
├── assets/
│   ├── css/styles.css      # estilos
│   ├── js/partials.js      # carga cabecera/pie y datos generales
│   ├── js/render.js        # pinta el contenido de cada página
│   ├── partials/           # cabecera y pie comunes
│   └── img/                # imágenes (logo, hero y galería)
├── admin/                  # panel de edición (Decap CMS) — login pendiente
│   ├── index.html
│   └── config.yml
└── .nojekyll               # evita el procesado Jekyll de GitHub Pages
```

## Cómo editar el contenido

Tienes dos formas:

### A) Editando los archivos de `content/` (sin panel)

Abre el archivo que quieras dentro de `content/` y cambia los textos. Son archivos de texto sencillos (formato JSON). Reglas básicas:

- Respeta las comillas `"` y las comas `,`.
- Las horas y los días son simples textos: `"19:30"`, `"Domingo"`.
- Las fechas de los avisos van en formato `AAAA-MM-DD`, por ejemplo `"2026-09-15"`.

Por ejemplo, para añadir un aviso edita `content/avisos.json` y añade un bloque dentro de `items`:

```json
{
  "titulo": "Título del aviso",
  "fecha": "2026-10-01",
  "resumen": "Texto corto que aparece en la portada.",
  "cuerpo": "Texto completo que se muestra en la página de avisos."
}
```

Para añadir fotos a la galería, copia la imagen en `assets/img/galeria/` y añade una entrada en `content/galeria.json`.

### B) Con el panel de edición (Decap CMS)

El panel está preparado en la carpeta `admin/` pero **el login todavía no está activado** (ver la siguiente sección).

## Ver la web en tu ordenador

Como el sitio carga archivos con `fetch`, **no basta con abrir el HTML con doble clic**: hay que servirlo con un pequeño servidor local. Con Python (ya instalado en macOS):

```bash
cd WebParroquia
python3 -m http.server 8000
```

Y abre `http://localhost:8000` en el navegador.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub (por ejemplo `web-parroquia`).
2. Sube todos los archivos de este proyecto a la rama `main`.
3. En GitHub ve a **Settings → Pages**.
4. En **Source** elige **Deploy from a branch**, rama `main` y carpeta `/ (root)`. Guarda.
5. A los pocos minutos tu web estará en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

> El archivo `.nojekyll` ya está incluido para que GitHub Pages sirva las carpetas tal cual.

## Activar el panel de edición (login del CMS)

El panel (`/admin`) usa **Decap CMS** con el backend de GitHub. Para que el login funcione en GitHub Pages necesitas:

1. **Indicar tu repositorio** en `admin/config.yml`:
   ```yaml
   backend:
     name: github
     repo: TU-USUARIO/NOMBRE-DEL-REPO
     branch: main
     base_url: https://TU-PROXY-OAUTH   # del paso 3
   ```
2. **Crear una OAuth App en GitHub**: *Settings → Developer settings → OAuth Apps → New OAuth App*. Anota el *Client ID* y el *Client Secret*.
3. **Desplegar un proxy OAuth** (GitHub no permite el login directo desde un sitio estático). La opción gratuita más habitual es un *Cloudflare Worker*; busca **"decap-cms github oauth cloudflare worker"** y sigue la guía: desplegarás un pequeño servicio con tu *Client ID/Secret* y obtendrás una URL que pondrás en `base_url`.
4. Una vez hecho, entra en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/admin/` y pulsa **Login with GitHub**.

### Probar el panel en local (sin proxy)

Para editar en tu ordenador sin configurar nada de lo anterior, `local_backend: true` ya está activado en `admin/config.yml`. En dos terminales:

```bash
# terminal 1: proxy local de Decap
npx decap-server

# terminal 2: servidor del sitio
python3 -m http.server 8000
```

Abre `http://localhost:8000/admin/`. Los cambios se guardarán directamente en los archivos de `content/`.

## Personalizar el diseño

- Colores y tipografías: variables al inicio de `assets/css/styles.css` (sección `:root`).
- Logo e imagen de portada: `assets/img/logo.svg` y `assets/img/hero.svg`.
- Menú de navegación: `assets/partials/header.html`.

## Secciones incluidas

Inicio, Horarios, Sacramentos, Avisos, Grupos, Galería y Contacto. Pendientes para el futuro (no incluidas): donativos, historia del templo, buscador y varios idiomas.
