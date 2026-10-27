import { useEffect, useState } from 'preact/hooks';
import { supabase } from './supabase.js';

// Progression personnelle : enregistrée sur l'appareil, puis synchronisée
// avec le compte connecté (une ligne par compte dans la table user_state).

export const DEFAULT_STATE = {
  v: 1,
  updatedAt: null,
  extensions: { rift: false, vale: false, ranch: false },
  theme: 'nuit',
  tamed: {},
  feedLog: {},
  pantry: {},
  shopping: [],
  plantings: [],
  friendship: {},
  // Métier perso attribué à un habitant (repère, pas une donnée du jeu) : { [villagerId]: jobId }.
  villagerJobs: {},
  favorites: {},
  watched: {},
  // Succès obtenus et quêtes faites : simples cases à cocher, par id.
  achievements: {},
  quests: {},
  reminders: { rare: true, harvest: true, star: true, talk: false, time: '20:00' },
  starPath: { name: '', end: '', duties: [] },
  // Récompenses de Voie des étoiles obtenues (Collection), par clé "idVoie:tier:index".
  starPathRewards: {},
  // Collection (onglets Souvenirs/Meubles) : cases cochées, par id (src/data/memories.js et furniture.js).
  memoriesOwned: {},
  furnitureOwned: {}
};

const listeners = new Set();
let state = load('local');
let userId = null;
let session = null;
let syncStatus = 'local';
let pushTimer = null;

function storageKey(uid) {
  return 'dlc:state:' + (uid || 'local');
}

function load(uid) {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch (e) { /* stockage indisponible : on repart d'un état vide */ }
  return { ...DEFAULT_STATE };
}

function save() {
  try { localStorage.setItem(storageKey(userId), JSON.stringify(state)); } catch (e) { /* ignoré */ }
}

function emit() {
  listeners.forEach((fn) => fn());
}

function setStatus(s) {
  syncStatus = s;
  emit();
}

export function getState() {
  return state;
}

// Met à jour la progression : update reçoit l'état courant et renvoie les champs modifiés.
export function update(fn) {
  const patch = typeof fn === 'function' ? fn(state) : fn;
  state = { ...state, ...patch, updatedAt: new Date().toISOString() };
  save();
  emit();
  schedulePush();
}

function schedulePush() {
  if (!userId) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(push, 1200);
}

async function push() {
  if (!userId) return;
  if (!navigator.onLine) return setStatus('offline');
  setStatus('syncing');
  const { error } = await supabase
    .from('user_state')
    .upsert({ user_id: userId, data: state, updated_at: state.updatedAt || new Date().toISOString() });
  setStatus(error ? 'error' : 'synced');
}

// Récupère la version en ligne et garde la plus récente.
export async function pull() {
  if (!userId) return;
  if (!navigator.onLine) return setStatus('offline');
  setStatus('syncing');
  const { data, error } = await supabase
    .from('user_state')
    .select('data, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return setStatus('error');
  const remoteTime = data ? Date.parse(data.updated_at) : 0;
  const localTime = state.updatedAt ? Date.parse(state.updatedAt) : 0;
  if (data && remoteTime > localTime) {
    state = { ...DEFAULT_STATE, ...data.data, updatedAt: data.updated_at };
    save();
    setStatus('synced');
  } else if (!data || localTime > remoteTime) {
    await push();
  } else {
    setStatus('synced');
  }
}

async function onSession(newSession) {
  session = newSession;
  const uid = newSession?.user?.id || null;
  if (uid === userId) return emit();
  userId = uid;
  if (uid) {
    const own = localStorage.getItem(storageKey(uid));
    if (own) {
      state = load(uid);
    } else {
      // Première connexion sur cet appareil : on reprend ce qui a été saisi sans compte.
      state = load('local');
      save();
    }
    emit();
    await pull();
  } else {
    state = load('local');
    setStatus('local');
  }
}

export async function initStore() {
  const { data } = await supabase.auth.getSession();
  await onSession(data.session);
  supabase.auth.onAuthStateChange((_event, s) => { onSession(s); });
  window.addEventListener('online', () => pull());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') pull();
  });
}

export async function signOut() {
  await supabase.auth.signOut();
}

export function exportState() {
  return JSON.stringify(state, null, 2);
}

export function importState(json) {
  const parsed = JSON.parse(json);
  update({ ...DEFAULT_STATE, ...parsed });
}

// Hook : relit l'état à chaque modification.
export function useStore() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  return { state, update, session, syncStatus };
}
