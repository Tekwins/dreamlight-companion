import { supabase } from './supabase.js';

// Clé publique VAPID : publique par conception, comme la clé anon Supabase ci-dessus.
// Sa moitié privée est un secret côté serveur (fonction Supabase), jamais ici.
const VAPID_PUBLIC_KEY = 'BC9kUZb0O-tHUVOlST9_CLAD_D5Rp9PPpi1bsxKUv_9Pi7-b_Rw84RQfaJ-FJg37dIlWfSgF3Fx22MPppMTie74';

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// Abonne cet appareil et enregistre l'abonnement côté serveur (nécessite un compte connecté :
// la fonction qui envoie les rappels doit pouvoir lire la progression de l'utilisateur).
export async function enablePush(userId) {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notifications refusées.');
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
  }
  const json = sub.toJSON();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const { error } = await supabase.from('push_subscriptions').upsert(
    { user_id: userId, endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth, tz },
    { onConflict: 'endpoint' }
  );
  if (error) throw error;
}

// Désabonne cet appareil (navigateur + ligne côté serveur).
export async function disablePush() {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
  await sub.unsubscribe();
}

// État actuel de CET appareil (pas du compte : chaque appareil s'abonne séparément).
export async function pushDeviceStatus() {
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return sub ? 'enabled' : 'disabled';
}
