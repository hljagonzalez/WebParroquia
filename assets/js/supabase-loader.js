const SUPABASE_URL = 'https://imrdjotdicpzkptosxrl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcmRqb3RkaWNwemtwdG9zeHJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzMwMTUsImV4cCI6MjA5NjI0OTAxNX0.iYd0n_q-Wxk4ZkPzAlk5grpAJ59hIzOrYn81gAf5q1A';

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
  const { error } = await sb
    .from('contenido')
    .update({ datos, updated_at: new Date().toISOString() })
    .eq('seccion', seccion);
  if (error) throw new Error('Error al guardar ' + seccion + ': ' + error.message);
}

async function iniciarSesion() {
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: window.location.origin + window.location.pathname },
  });
  if (error) throw error;
}

function cerrarSesion() {
  sb.auth.signOut();
  window.location.reload();
}
