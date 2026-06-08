# Web de la Parroquia

Sitio web **estático** (HTML + CSS + JavaScript, sin framework ni compilación) pensado para publicarse gratis en **GitHub Pages**. El contenido se gestiona a través de **Supabase** (base de datos en la nube) con un panel de administración propio, y se carga dinámicamente en cada página.

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
├── content/                # CONTENIDO EDITABLE (fallback local)
│   ├── config.json         #   datos generales (copia local)
│   ├── horarios.json       #   horarios (copia local)
│   ├── sacramentos.json    #   textos (copia local)
│   ├── grupos.json         #   grupos (copia local)
│   ├── avisos.json         #   avisos (copia local)
│   └── galeria.json        #   fotos (copia local)
├── assets/
│   ├── css/styles.css      # estilos
│   ├── js/supabase-loader.js  # cliente Supabase (obtener/guardar secciones)
│   ├── js/partials.js      # carga cabecera/pie y datos generales
│   ├── js/render.js        # pinta el contenido de cada página
│   ├── partials/           # cabecera y pie comunes
│   └── img/                # imágenes (logo, hero y galería)
├── admin/                  # panel de edición propio (con Supabase)
│   ├── index.html
│   └── admin.js
└── .nojekyll               # evita el procesado Jekyll de GitHub Pages
```

## Cómo se gestiona el contenido

El contenido ya **no se edita directamente en los archivos JSON** de `content/`. La fuente principal de datos es **Supabase**. Los archivos `content/*.json` se mantienen como respaldo local por si la conexión falla.

### Con el panel de administración (recomendado)

Entra en `/admin/` desde la web publicada o desde `http://localhost:8000/admin/` en local e inicia sesión con tu cuenta de GitHub. El panel permite editar:

- **General**: nombre, lema, descripción, dirección, teléfono, email, párroco, mapa y redes sociales.
- **Horarios**: misas, confesiones y adoración.
- **Sacramentos**: descripción y requisitos de cada sacramento.
- **Grupos**: nombre, horario, descripción y email de contacto.
- **Avisos**: noticias ordenadas por fecha.
- **Galería**: imágenes con título y descripción.

Los cambios se guardan directamente en Supabase y la web los refleja al recargar.

### Editando los JSON locales (sin panel)

Si prefieres editar localmente, los archivos `content/*.json` siguen funcionando como fallback. El proyecto primero intenta cargar desde Supabase y, si no puede, usa el JSON local.

## Ver la web en tu ordenador

El sitio carga archivos con `fetch`, así que **no basta con abrir el HTML con doble clic**. Necesitas un servidor local:

```bash
cd WebParroquia
python3 -m http.server 8000
```

Abre `http://localhost:8000` en el navegador.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub (por ejemplo `web-parroquia`).
2. Sube todos los archivos de este proyecto a la rama `main`.
3. En GitHub ve a **Settings → Pages**.
4. En **Source** elige **Deploy from a branch**, rama `main` y carpeta `/ (root)`. Guarda.
5. A los pocos minutos tu web estará en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

> El archivo `.nojekyll` ya está incluido para que GitHub Pages sirva las carpetas tal cual.

## Requisitos de Supabase

El proyecto necesita una base de datos Supabase con una tabla `contenido` que tenga las columnas `seccion` (text, primary key) y `datos` (jsonb). Las secciones son: `config`, `horarios`, `sacramentos`, `grupos`, `avisos` y `galeria`.

El login del panel usa el proveedor **GitHub** configurado en Authentication de Supabase.

Las credenciales (URL y anon key) están en `assets/js/supabase-loader.js`. Si cambias de proyecto Supabase, actualiza las constantes `SUPABASE_URL` y `SUPABASE_ANON_KEY`.

## Personalizar el diseño

- Colores y tipografías: variables al inicio de `assets/css/styles.css` (sección `:root`).
- Logo e imagen de portada: `assets/img/logo.svg` y `assets/img/hero.svg`.
- Menú de navegación: `assets/partials/header.html`.

## Secciones incluidas

Inicio, Horarios, Sacramentos, Avisos, Grupos, Galería y Contacto.
