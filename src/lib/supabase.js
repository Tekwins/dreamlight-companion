import { createClient } from '@supabase/supabase-js';

// Clé « anon » : publique par conception. La sécurité des données repose sur
// les règles RLS définies dans supabase/schema.sql (chaque compte ne voit que ses lignes).
const SUPABASE_URL = 'https://idmeekuelqbomisvnosn.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkbWVla3VlbHFib21pc3Zub3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5NTU5MTUsImV4cCI6MjEwODUzMTkxNX0.rKKfoRdEADqci1A3i_BZkO-PtsVjgh_rhvrdgmB1u3U';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // PKCE : le retour du lien magique arrive en ?code=..., compatible avec
    // la navigation par # utilisée par l'appli.
    flowType: 'pkce',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true
  }
});

export async function sendMagicLink(email) {
  const redirect = window.location.origin + window.location.pathname;
  return supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } });
}
