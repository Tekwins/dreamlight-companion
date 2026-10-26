import { useState } from 'preact/hooks';
import { useStore } from '../lib/store.js';
import { STAR_PATHS } from '../data/starpath.js';
import { starPathProgress } from '../lib/game.js';
import { Icon, Thumb, Back } from '../ui.jsx';

// Collection (version allégée) : récompenses de Voie des étoiles obtenues, cochées à la main.
// Seules les voies suivies dans l'appli (src/data/starpath.js) apparaissent ; l'historique se
// construit tout seul au fil des prochaines voies, sans dépendre d'un scraping des 27 voies passées.
export function Collection() {
  const { state, update } = useStore();
  const [open, setOpen] = useState(STAR_PATHS[0]?.id || null);
  const done = state.starPathRewards;
  const toggle = (key) => update((s) => ({ starPathRewards: { ...s.starPathRewards, [key]: !s.starPathRewards[key] } }));

  const paths = STAR_PATHS.map((sp) => ({ sp, ...starPathProgress(sp, done) }));

  return (
    <div class="page">
      <Back href="#/guide" label="Guide" />
      <h1>Collection</h1>
      <div class="small muted" style={{ lineHeight: 1.45 }}>
        Récompenses obtenues par Voie des étoiles. Seules les voies suivies dans l'appli apparaissent ici ; les prochaines s'ajouteront d'elles-mêmes.
      </div>

      <div class="stack" style={{ gap: '10px' }}>
        {paths.map(({ sp, entries, got, pct }) => {
          const isOpen = open === sp.id;
          const color = pct === 100 ? 'var(--accent)' : 'var(--teal)';
          return (
            <div key={sp.id} class="card stack" style={{ gap: '10px' }}>
              <button type="button" onClick={() => setOpen(isOpen ? null : sp.id)}
                style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'transparent', border: 0, padding: 0, textAlign: 'left', font: 'inherit', color: 'inherit', cursor: 'pointer' }}>
                <div class="between">
                  <strong style={{ fontSize: '16px' }}>{sp.name}</strong>
                  <span style={{ fontWeight: 800, color }}>{pct === 100 ? 'Complet' : `${pct} %`}</span>
                </div>
                <div class="bar"><div style={{ width: `${pct}%`, background: color }} /></div>
                <span class="small muted">{got} / {entries.length} récompenses · {sp.dates}</span>
              </button>

              {isOpen && (
                <div class="row wrap" style={{ gap: '8px' }}>
                  {entries.map((e) => {
                    const checked = !!done[e.key];
                    return (
                      <button key={e.key} type="button" onClick={() => toggle(e.key)} aria-pressed={checked} aria-label={e.caption}
                        style={{ width: '74px', background: 'transparent', border: 0, padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', opacity: checked ? 1 : 0.5 }}>
                        <div style={{ position: 'relative' }}>
                          <Thumb file={e.file} name={e.caption} />
                          {checked && (
                            <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent)', color: '#14123A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon name="check" size={13} />
                            </span>
                          )}
                        </div>
                        <span class="small muted" style={{ textAlign: 'center', fontSize: '10px', lineHeight: 1.2 }}>{e.caption}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {!paths.length && <div class="empty">Aucune Voie des étoiles suivie pour l'instant.</div>}
      </div>
    </div>
  );
}
