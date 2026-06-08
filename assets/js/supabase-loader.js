// Supabase configuration — set SUPABASE_URL and SUPABASE_ANON_KEY via environment
// or browser storage. For GitHub Pages, use a build step or manual configuration.
const SUPABASE_URL = (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.url)
  ? SUPABASE_CONFIG.url
  : 'https://imrdjotdicpzkptosxrl.supabase.co';

const SUPABASE_ANON_KEY = (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.key)
  ? SUPABASE_CONFIG.key
  : '';

// Validate that credentials are configured before initializing
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.');
  throw new Error('Supabase credentials are required. Configure SUPABASE_CONFIG before loading this script.');
}

var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

async function obtenerSeccion(seccion) {
  const { data, error } = await sb
    .from('contenido')
    .select('datos')
    .eq('seccion', seccion)
    .single();
  if (error) throw new Error('Error al cargar ' + seccion + ': ' + error.message);
  return data.datos;
}

async function guardarSeccion(seccion, datos) {
  // Verify authentication before allowing writes
  const { data: { session }, error: sessionError } = await sb.auth.getSession();
  if (sessionError || !session) {
    throw new Error('No autorizado. Debes iniciar sesión para guardar cambios.');
  }

  const { error } = await sb
    .from('contenido')
    .update({ datos, updated_at: new Date().toISOString() })
    .eq('seccion', seccion);
  if (error) throw new Error('Error al guardar ' + seccion + ': ' + error.message);
}

async function iniciarSesion() {
  const redirectUri = window.location.origin + window.location.pathname;
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: redirectUri },
  });
  if (error) throw error;
}

function cerrarSesion() {
  sb.auth.signOut();
  window.location.reload();
}
