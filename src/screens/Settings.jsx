import { useState } from 'preact/hooks';
import { useStore, signOut, exportState, importState, pull } from '../lib/store.js';
import { sendMagicLink } from '../lib/supabase.js';
import { EXTENSIONS } from '../data/biomes.js';
import { VARIANT } from '../data/critters.js';
import { Icon, Switch, Back, Thumb } from '../ui.jsx';

const STATUS = {
  local: 'Enregistré sur cet appareil uniquement',
  syncing: 'Synchronisation…',
  synced: 'Synchronisé',
  offline: 'Hors ligne : synchronisation au retour du réseau',
  error: 'Erreur de synchronisation'
};

export function Settings() {
  const { state, update, session, syncStatus } = useStore();
  const exts = state.extensions;
  const [showBackup, setShowBackup] = useState(false);
  const [backup, setBackup] = useState('');
  const [msg, setMsg] = useState('');

  return (
    <div class="page">
      <Back href="#/" label="Aujourd'hui" />
      <h1>Réglages</h1>

      <section class="stack">
        <h2>Mon compte</h2>
        {session ? (
          <div class="card stack" style={{ gap: '10px' }}>
            <div class="between">
              <div class="stack" style={{ gap: '2px' }}>
                <strong>{session.user.email}</strong>
                <span class="small" style={{ color: syncStatus === 'error' ? 'var(--warn)' : 'var(--teal)', fontWeight: 800 }}>{STATUS[syncStatus]}</span>
              </div>
              <button class="icon-btn" aria-label="Synchroniser maintenant" onClick={() => pull()}><Icon name="sync" /></button>
            </div>
            <button class="btn ghost" onClick={() => signOut()}>Se déconnecter</button>
          </div>
        ) : <Login />}
      </section>

      <section class="stack">
        <div class="between">
          <h2>Mes extensions</h2>
          <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{(() => { const n = 1 + Object.values(exts).filter(Boolean).length; return `${n} active${n > 1 ? 's' : ''}`; })()}</span>
        </div>
        <div class="card list-rows" style={{ padding: '2px 16px' }}>
          <div class="list-row">
            <div class="stack" style={{ gap: '2px', flex: 1 }}><strong>Jeu de base</strong><span class="small muted">La Vallée, ses 8 biomes et ses habitants</span></div>
            <span class="small muted" style={{ fontWeight: 800 }}>Toujours actif</span>
          </div>
          {EXTENSIONS.map((e) => (
            <div key={e.id} class="list-row">
              <div class="stack" style={{ gap: '2px', flex: 1 }}><strong>{e.name}</strong><span class="small muted">{e.areas}</span></div>
              <Switch on={!!exts[e.id]} label={`Activer ${e.name}`} onChange={(on) => update((s) => ({ extensions: { ...s.extensions, [e.id]: on } }))} />
            </div>
          ))}
        </div>
        <div class="small muted">Ce qui vient d'une extension désactivée est masqué partout.</div>
      </section>

      <section class="stack">
        <h2>Apparence</h2>
        <div class="grid-3" role="radiogroup" aria-label="Thème">
          {[
            ['nuit', 'Nuit étoilée', 'Sombre, doré', ['#14123A', '#F5C95C', '#6FD6C2']],
            ['minuit', 'Minuit', 'Sombre, classique', ['#19191D', '#F5C95C', '#6FD6C2']],
            ['chateau', 'Château', 'Clair, touche royale', ['#F6F4FB', '#2F4BB8', '#F2C14E']]
          ].map(([id, name, desc, colors]) => (
            <button key={id} role="radio" aria-checked={state.theme === id} class="card stack"
              style={{ alignItems: 'flex-start', textAlign: 'left', border: `2px solid ${state.theme === id ? 'var(--accent)' : 'var(--line)'}` }}
              onClick={() => update({ theme: id })}>
              <span class="row" style={{ gap: '4px' }}>{colors.map((c) => <span key={c} style={{ width: '22px', height: '22px', borderRadius: '6px', background: c, border: '1px solid var(--line)' }} />)}</span>
              <strong>{name}</strong>
              <span class="small muted">{desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section class="stack">
        <h2>Rappels</h2>
        <div class="card list-rows" style={{ padding: '2px 16px' }}>
          {[
            ['rare', 'Couleurs rares du jour', 'Affichées en tête de l’accueil'],
            ['harvest', 'Récoltes prêtes', 'Signalées sur l’accueil et dans le Potager'],
            ['star', 'Fin de la Voie des étoiles', 'Quand il ne reste que quelques jours'],
            ['talk', 'Parler aux habitants', 'Pour ne pas manquer la discussion du jour']
          ].map(([id, name, desc]) => (
            <div key={id} class="list-row">
              <div class="stack" style={{ gap: '2px', flex: 1 }}><strong>{name}</strong><span class="small muted">{desc}</span></div>
              <Switch on={!!state.reminders[id]} label={name} onChange={(on) => update((s) => ({ reminders: { ...s.reminders, [id]: on } }))} />
            </div>
          ))}
          <label class="list-row">
            <span class="stack" style={{ gap: '2px', flex: 1 }}><strong>Heure du rappel quotidien</strong><span class="small muted">Pour les rappels ci-dessus</span></span>
            <input type="time" value={state.reminders.time} style={{ width: '110px' }}
              onInput={(e) => update((s) => ({ reminders: { ...s.reminders, time: e.currentTarget.value } }))} />
          </label>
        </div>
        <div class="small muted">Les notifications quand l'appli est fermée viendront dans une prochaine version.</div>
      </section>

      <WatchedAnimals />

      <section class="stack">
        <h2>Sauvegarde</h2>
        <div class="grid-2">
          <button class="btn ghost" onClick={() => { setBackup(exportState()); setShowBackup(true); setMsg(''); }}>Exporter</button>
          <button class="btn ghost" onClick={() => { setBackup(''); setShowBackup(true); setMsg(''); }}>Importer</button>
        </div>
        {showBackup && (
          <div class="stack">
            <label class="sr" for="backup">Données de sauvegarde</label>
            <textarea id="backup" value={backup} onInput={(e) => setBackup(e.currentTarget.value)} placeholder="Colle ici une sauvegarde pour l'importer" />
            <div class="grid-2">
              <button class="btn ghost" onClick={() => { navigator.clipboard?.writeText(backup); setMsg('Copié.'); }}>Copier</button>
              <button class="btn" onClick={() => {
                try { importState(backup); setMsg('Progression importée.'); } catch (e) { setMsg('Ce texte n’est pas une sauvegarde valide.'); }
              }}>Importer ce texte</button>
            </div>
            {msg && <span class="small" style={{ fontWeight: 800 }}>{msg}</span>}
          </div>
        )}
      </section>

      <div class="small muted" style={{ textAlign: 'center' }}>Données : Dreamlight Valley Wiki et wiki Fandom. Appli non officielle, usage personnel.</div>
    </div>
  );
}

// Animaux marqués « Me prévenir » (cloche sur leur fiche) : tous regroupés ici pour les retirer facilement.
function WatchedAnimals() {
  const { state, update } = useStore();
  const ids = Object.keys(state.watched).filter((id) => state.watched[id]);
  const list = ids.map((id) => VARIANT[id]).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  const unwatch = (id) => update((s) => ({ watched: { ...s.watched, [id]: false } }));

  if (!list.length) return null;
  return (
    <section class="stack">
      <h2>Animaux suivis</h2>
      <div class="card list-rows" style={{ padding: '2px 16px' }}>
        {list.map((v) => (
          <div key={v.id} class="list-row">
            <Thumb file={v.file + '.png'} name={v.name} round />
            <span style={{ flex: 1, fontWeight: 800 }}>{v.name}</span>
            <button class="icon-btn" style={{ width: '36px', height: '36px' }} aria-label={`Ne plus suivre ${v.name}`} onClick={() => unwatch(v.id)}>
              <Icon name="x" size={18} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function Login() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setState('sending');
    const { error } = await sendMagicLink(email.trim());
    if (error) { setErr(error.message); setState('idle'); } else setState('sent');
  };
  if (state === 'sent') {
    return (
      <div class="card stack">
        <strong>Lien envoyé à {email}</strong>
        <span class="muted" style={{ lineHeight: 1.45 }}>Ouvre l'e-mail sur cet appareil et touche le lien : tu seras connecté ici. Pense à regarder les indésirables.</span>
        <button class="btn ghost" onClick={() => setState('idle')}>Utiliser une autre adresse</button>
      </div>
    );
  }
  return (
    <form class="card stack" onSubmit={submit}>
      <span class="muted" style={{ lineHeight: 1.45 }}>Connecte-toi pour retrouver ta progression sur ton téléphone et ton ordinateur. Pas de mot de passe : tu reçois un lien par e-mail.</span>
      <label class="field">Adresse e-mail
        <input type="email" required autocomplete="email" value={email} onInput={(e) => setEmail(e.currentTarget.value)} />
      </label>
      {err && <span class="small" style={{ color: 'var(--warn)', fontWeight: 800 }}>{err}</span>}
      <button class="btn" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Envoi…' : 'Recevoir le lien de connexion'}</button>
    </form>
  );
}
