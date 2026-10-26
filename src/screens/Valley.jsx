import { useStore } from '../lib/store.js';
import { useNow } from '../lib/router.js';
import { BIOMES, biomeEnabled } from '../data/biomes.js';
import { CROPS, FISH, GEMS, FORAGE } from '../data/resources.js';
import { VARIANTS } from '../data/critters.js';
import { crittersNow } from '../lib/game.js';
import { Icon, ExtTag } from '../ui.jsx';

export function Valley() {
  const { state } = useStore();
  const now = useNow();
  const exts = state.extensions;
  const nowCount = crittersNow(exts, now).filter((c) => c.now).length;
  const shopping = state.shopping.filter((s) => !s.done).length;

  const tiles = [
    ['#/animaux', 'Animaux', `${nowCount} présents maintenant`, 'paw', '#6FD6C2'],
    ['#/potager', 'Potager', `${state.plantings.length} plantation(s) en cours`, 'sprout', '#9BD77A'],
    ['#/peche', 'Pêche', 'Par biome et remous', 'fish', '#7DB4F5'],
    ['#/cueillette', 'Cueillette', 'Fruits, épices, champignons', 'basket', '#F49AC1'],
    ['#/mines', 'Mines', 'Gemmes par biome', 'gem', '#C3B6F7'],
    ['#/collection', 'Collection', 'Récompenses de Voie des étoiles', 'star', '#F5C95C'],
    ['#/courses', 'Liste de courses', `${shopping} objet(s) à trouver`, 'list', '#B8E07A']
  ];

  const count = (items, id) => items.filter((it) => it.biomes.includes(id)).length;
  const biomes = BIOMES.filter((b) => biomeEnabled(b.id, exts)).map((b) => ({
    ...b,
    critters: VARIANTS.filter((v) => v.species.biome === b.id).length,
    fish: count(FISH, b.id), gems: count(GEMS, b.id), forage: count(FORAGE, b.id), crops: count(CROPS, b.id)
  }));

  return (
    <div class="page wide">
      <h1>Vallée</h1>
      <a href="#/recherche" class="search">
        <Icon name="search" size={20} class="muted" />
        Chercher un objet, une recette, un animal…
      </a>
      <div class="tiles">
        {tiles.map(([href, name, sub, icon, color]) => (
          <a key={href} class="tile" href={href}>
            <span class="ico" style={{ background: color }}><Icon name={icon} /></span>
            <span class="stack" style={{ gap: '2px' }}>
              <strong>{name}</strong>
              <span class="small muted">{sub}</span>
            </span>
          </a>
        ))}
      </div>

      <section class="stack">
        <div class="between">
          <h2>Par biome</h2>
          <span class="small muted">selon tes extensions</span>
        </div>
        <div class="card list-rows" style={{ padding: '2px 16px' }}>
          {biomes.map((b) => (
            <div key={b.id} class="list-row">
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: b.color, flex: 'none' }} />
              <div class="stack" style={{ gap: '2px', flex: 1 }}>
                <span class="row" style={{ gap: '6px', fontWeight: 800 }}>{b.name}<ExtTag ext={b.ext} /></span>
                <span class="small muted">
                  {[b.critters && `${b.critters} animaux`, b.crops && `${b.crops} graines`, b.fish && `${b.fish} poissons`, b.forage && `${b.forage} cueillettes`, b.gems && `${b.gems} gemmes`].filter(Boolean).join(' · ') || 'Données à venir'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
