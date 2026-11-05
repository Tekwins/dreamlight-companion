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

// Code à usage unique reçu dans le même e-mail que le lien ({{ .Token }} dans le modèle
// « Magic Link » de Supabase, voir supabase/email-magic-link.html). Indispensable sur iOS :
// l'appli installée sur l'écran d'accueil a son propre stockage, séparé de Safari, donc un lien
// ouvert depuis Mail connecte Safari et pas l'appli. Le code, lui, se tape directement dans l'appli.
export async function verifyEmailCode(email, code) {
  return supabase.auth.verifyOtp({ email, token: code, type: 'email' });
}

// Supabase renvoie ses erreurs en anglais telles quelles (error.message) : on traduit les cas
// courants plutôt que d'afficher "email rate limit exceeded" tel quel dans une appli en français.
export function authErrorMessage(error) {
  const msg = (error?.message || '').toLowerCase();
  if (msg.includes('rate limit')) return "Trop de liens demandés pour cette adresse en peu de temps. Réessaie dans quelques minutes.";
  if (msg.includes('expired') || (msg.includes('invalid') && (msg.includes('token') || msg.includes('otp'))))
    return 'Code incorrect ou expiré. Vérifie le dernier e-mail reçu, ou demande un nouveau code.';
  if (msg.includes('invalid') && msg.includes('email')) return 'Adresse e-mail invalide.';
  return error?.message || 'Une erreur est survenue, réessaie.';
}
