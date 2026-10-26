// Rappel quotidien groupé (notification push), un envoi par compte connecté, à l'heure locale
// choisie dans Réglages. À planifier pour tourner toutes les 15 minutes (voir README du dossier
// supabase/functions) : cette fonction ne fait rien pour un appareil si ce n'est pas encore
// "son" heure (± 15 min) ou si le rappel du jour est déjà parti (colonne last_sent).
//
// Réutilise les données et la logique du jeu depuis src/ (pas de copie à resynchroniser à la main).
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';
import { CROPS } from '../../../src/data/resources.js';
import { STAR_PATHS } from '../../../src/data/starpath.js';
import { VILLAGERS } from '../../../src/data/villagers.js';
import { VARIANTS } from '../../../src/data/critters.js';
import { biomeEnabled } from '../../../src/data/biomes.js';
import { rareToday } from '../../../src/lib/time.js';
import { starPathEndDate } from '../../../src/lib/game.js';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const APP_URL = Deno.env.get('APP_URL') || 'https://tekwins.github.io/dreamlight-companion/';

webpush.setVapidDetails(APP_URL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const CROP_BY_ID = Object.fromEntries(CROPS.map((c) => [c.id, c]));

// Composants de date/heure "maintenant" dans le fuseau donné, pour comparer à l'heure choisie par
// l'utilisateur sans dépendre du fuseau du serveur (Supabase Edge Functions tourne en UTC).
function nowInTz(tz: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value;
  // Certaines versions d'ICU rendent minuit "24" plutôt que "00" avec hour12:false.
  const hour = Number(get('hour')) % 24;
  return { dateKey: `${get('year')}-${get('month')}-${get('day')}`, hour, minute: Number(get('minute')) };
}

// Une Date dont .getDay()/.getHours() reflètent l'heure locale de l'utilisateur, en supposant que
// ce service tourne en UTC (vrai pour les fonctions Supabase) : on construit l'horodatage UTC avec
// les composants locaux voulus, pour que les accesseurs non-UTC de time.js/game.js donnent le bon jour.
function fakeLocalDate(tz: string) {
  const { dateKey, hour, minute } = nowInTz(tz);
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hour, minute));
}

function buildDigest(reminders: any, state: any, tz: string) {
  const now = fakeLocalDate(tz);
  const exts = state.extensions || {};
  const lines: string[] = [];

  if (reminders.rare) {
    const rare = VARIANTS.filter((v: any) => biomeEnabled(v.species.biome, exts) && !state.tamed?.[v.id] && rareToday(v.schedule, now));
    if (rare.length) lines.push(`${rare.length} couleur${rare.length > 1 ? 's' : ''} rare${rare.length > 1 ? 's' : ''} aujourd'hui : ${rare.slice(0, 3).map((v: any) => v.name).join(', ')}${rare.length > 3 ? '…' : ''}`);
  }
  if (reminders.harvest) {
    const nowMs = now.getTime();
    const ready = (state.plantings || []).filter((p: any) => {
      const crop = CROP_BY_ID[p.cropId];
      return crop && p.plantedAt + crop.min * 60000 <= nowMs;
    });
    if (ready.length) lines.push(`${ready.length} plantation${ready.length > 1 ? 's' : ''} prête${ready.length > 1 ? 's' : ''} à récolter.`);
  }
  if (reminders.star) {
    for (const sp of STAR_PATHS) {
      const end = starPathEndDate(sp);
      if (!end) continue;
      const days = Math.ceil((end.getTime() - now.getTime()) / 86400000);
      if (days > 0 && days <= 3) lines.push(`${sp.name} se termine dans ${days} jour${days > 1 ? 's' : ''}.`);
    }
  }
  if (reminders.talk) {
    const today = nowInTz(tz).dateKey;
    const villagers = VILLAGERS.filter((v: any) => !v.ext || exts[v.ext]);
    const talked = villagers.filter((v: any) => state.friendship?.[v.id]?.talked === today).length;
    const left = villagers.length - talked;
    if (left > 0) lines.push(`Encore ${left} habitant${left > 1 ? 's' : ''} à qui parler aujourd'hui.`);
  }
  return lines;
}

Deno.serve(async () => {
  const { data: subs, error: subsErr } = await admin.from('push_subscriptions').select('*');
  if (subsErr) return new Response(subsErr.message, { status: 500 });
  if (!subs?.length) return new Response('Aucun abonnement.', { status: 200 });

  const userIds = [...new Set(subs.map((s) => s.user_id))];
  const { data: states, error: stateErr } = await admin.from('user_state').select('user_id, data').in('user_id', userIds);
  if (stateErr) return new Response(stateErr.message, { status: 500 });
  const stateByUser = Object.fromEntries((states || []).map((s) => [s.user_id, s.data]));

  let sent = 0, removed = 0;
  for (const sub of subs) {
    const state = stateByUser[sub.user_id];
    const reminders = state?.reminders;
    if (!state || !reminders) continue;

    const { dateKey, hour, minute } = nowInTz(sub.tz || 'UTC');
    if (sub.last_sent === dateKey) continue; // déjà envoyé aujourd'hui (heure locale de l'appareil)
    const [targetH, targetM] = (reminders.time || '20:00').split(':').map(Number);
    const diff = (hour * 60 + minute) - (targetH * 60 + targetM);
    if (diff < 0 || diff >= 15) continue; // pas encore "son" créneau de 15 min

    const lines = buildDigest(reminders, state, sub.tz || 'UTC');
    if (!lines.length) { await admin.from('push_subscriptions').update({ last_sent: dateKey }).eq('id', sub.id); continue; }

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title: 'Dreamlight Compagnon', body: lines.join(' '), url: APP_URL })
      );
      await admin.from('push_subscriptions').update({ last_sent: dateKey }).eq('id', sub.id);
      sent++;
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await admin.from('push_subscriptions').delete().eq('id', sub.id);
        removed++;
      } else {
        console.error('Échec envoi', sub.id, e?.message || e);
      }
    }
  }

  return new Response(`Envoyés : ${sent}. Abonnements expirés retirés : ${removed}.`, { status: 200 });
});
