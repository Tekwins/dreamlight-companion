import { useState } from 'preact/hooks';
import { useStore } from '../lib/store.js';
import { useNow, useDesktop } from '../lib/router.js';
import { crittersNow, sortCritters, feedInfo } from '../lib/game.js';
import { VARIANT, VARIANTS, METHODS, rangesOf } from '../data/critters.js';
import { BIOME, EXTENSIONS } from '../data/biomes.js';
import { CROPS, FISH, FORAGE } from '../data/resources.js';
import { DAYS_SHORT, availabilityLabel, todayKey } from '../lib/time.js';
import { Icon, Thumb, Seg, Search, Back, BiomePill, ExtTag, GroupTitle, norm } from '../ui.jsx';

const byName = (a, b) => a.v.name.localeCompare(b.v.name, 'fr');

// Vignette pour un nom de nourriture, quand il correspond à une ressource connue.
const FOOD_FILE = {};
for (const it of [...CROPS, ...FISH, ...FORAGE]) FOOD_FILE[it.name] = it.file;

export function Animals({ selectedId }) {
  const { state } = useStore();
  const desktop = useDesktop();
  const now = useNow();
  const [filter, setFilter] = useState('now');
  const [q, setQ] = useState('');
  const [hideTamed, setHideTamed] = useState(false);
  const [group, setGroup] = useState('rare');
  const [subBiome, setSubBiome] = useState(false);

  const selected = selectedId ? VARIANT[selectedId] : null;
  if (selected && !desktop) return <div class="page"><AnimalDetail v={selected} /></div>;

  const day = now.getDay();
  let list = crittersNow(state.extensions, now);
  if (filter === 'now') list = list.filter((c) => c.now);
  if (filter === 'today') list = list.filter((c) => rangesOf(c.v.schedule[day]).length);
  if (hideTamed) list = list.filter((c) => !state.tamed[c.v.id]);
  if (q) {
    const n = norm(q);
    list = list.filter((c) => norm(`${c.v.name} ${c.v.species.fav} ${BIOME[c.v.species.biome]?.name}`).includes(n));
  }
  // Par défaut : rares et urgents en premier (inchangé). Sinon : par extension ou alphabétique,
  // avec un sous-groupe par biome en option — pour ne jamais perdre les rares de vue par défaut.
  let sections;
  if (group === 'rare') {
    sections = [{ key: 'all', title: null, items: sortCritters(list) }];
  } else {
    const extTitle = (id) => (id ? EXTENSIONS.find((e) => e.id === id)?.name || id : 'Jeu de base');
    const primaryKey = (c) => (group === 'ext' ? BIOME[c.v.species.biome]?.ext || '' : 'all');
    const primaryKeys = group === 'ext'
      ? [...new Set(list.map(primaryKey))].sort((a, b) => (a === '' ? -1 : b === '' ? 1 : extTitle(a).localeCompare(extTitle(b), 'fr')))
      : ['all'];
    sections = primaryKeys.map((pk) => {
      const bucket = list.filter((c) => primaryKey(c) === pk);
      let sub;
      if (subBiome) {
        const biomeIds = [...new Set(bucket.map((c) => c.v.species.biome))]
          .sort((a, b) => (BIOME[a]?.name || '').localeCompare(BIOME[b]?.name || '', 'fr'));
        sub = biomeIds.map((bid) => ({
          key: bid, title: BIOME[bid]?.name, color: BIOME[bid]?.color,
          items: bucket.filter((c) => c.v.species.biome === bid).sort(byName)
        }));
      } else {
        sub = [{ key: 'x', title: null, items: bucket.slice().sort(byName) }];
      }
      return { key: pk || 'base', title: group === 'ext' ? extTitle(pk) : null, sub };
    });
  }
  if (!('sub' in sections[0])) sections = sections.map((s) => ({ ...s, sub: [{ key: 'x', title: null, items: s.items }] }));

  const CritterRow = ({ c }) => {
    const { v, av, rare } = c;
    const tamed = !!state.tamed[v.id];
    return (
      <a key={v.id} href={`#/animaux/${v.id}`} class={'item' + (selected?.id === v.id ? ' selected' : '')} style={{ alignItems: 'center', opacity: av.now ? 1 : 0.7 }}>
        <Thumb file={v.file + '.png'} name={v.name} />
        <div class="body">
          <div class="row wrap" style={{ gap: '6px' }}>
            <span class="name">{v.name}</span>
            {rare && <span class="tag rare">RARE</span>}
            {tamed && <span class="tag outline">Apprivoisé</span>}
            <ExtTag ext={BIOME[v.species.biome]?.ext} />
          </div>
          <div class="row wrap" style={{ gap: '4px' }}>
            <BiomePill id={v.species.biome} />
            <span class="pill">♥ {v.favOverride || v.species.fav}</span>
            <span class="pill">{METHODS[v.species.method].label}</span>
          </div>
        </div>
        <div class="side small" style={{ fontWeight: 900, maxWidth: '76px', color: av.urgent ? 'var(--warn)' : av.now ? 'var(--teal)' : 'var(--muted)' }}>
          {av.text}
        </div>
      </a>
    );
  };

  const listView = (
    <div class="stack" style={{ gap: '16px' }}>
      {sections.map((s) => (
        <div key={s.key} class="stack">
          {s.title && <GroupTitle title={s.title} />}
          {s.sub.map((sb) => (
            <div key={sb.key} class="list">
              {sb.title && <div class="small muted" style={{ fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 0' }}>
                <span class="dot" style={{ background: sb.color, display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', marginRight: '6px' }} />{sb.title}
              </div>}
              {sb.items.map((c) => <CritterRow key={c.v.id} c={c} />)}
            </div>
          ))}
        </div>
      ))}
      {!list.length && <div class="empty">Aucun animal ne correspond.</div>}
    </div>
  );

  return (
    <div class="page wide">
      <div class="between">
        <h1>Animaux</h1>
        <label class="row small muted" style={{ gap: '8px', fontWeight: 800 }}>
          <input type="checkbox" checked={hideTamed} onChange={(e) => setHideTamed(e.currentTarget.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }} />
          Masquer les apprivoisés
        </label>
      </div>
      <Search value={q} onInput={setQ} placeholder="Animal, aliment, biome…" />
      <Seg label="Filtrer" value={filter} onChange={setFilter} options={[['now', 'Maintenant'], ['today', 'Aujourd’hui'], ['all', 'Tous']]} />
      <div class="between wrap">
        <Seg small label="Classer" value={group} onChange={setGroup} options={[['rare', 'Rares d’abord'], ['ext', 'Extension'], ['alpha', 'Alphabétique']]} />
        {group !== 'rare' && (
          <label class="row small muted" style={{ gap: '8px', fontWeight: 800 }}>
            <input type="checkbox" checked={subBiome} onChange={(e) => setSubBiome(e.currentTarget.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }} />
            Puis par biome
          </label>
        )}
      </div>
      <div class="small muted" style={{ fontWeight: 700 }}>{list.length} animal{list.length > 1 ? 'aux' : ''}</div>
      {desktop ? (
        <div class="split">
          {listView}
          <div class="detail">
            {selected ? <AnimalDetail v={selected} embedded /> : <div class="empty">Choisis un animal pour voir sa fiche.</div>}
          </div>
        </div>
      ) : listView}
    </div>
  );
}

export function AnimalDetail({ v, embedded }) {
  const { state, update } = useStore();
  const now = useNow();
  const sp = v.species;
  const b = BIOME[sp.biome];
  const av = availabilityLabel(v.schedule, now);
  const feed = feedInfo(state, v.id);
  const tamed = !!state.tamed[v.id];
  const watched = !!state.watched[v.id];
  const today = now.getDay();

  const feedToday = () => {
    const t = todayKey();
    update((s) => {
      const log = s.feedLog[v.id] || { count: 0, last: null };
      const next = log.last === t ? { count: Math.max(0, log.count - 1), last: null } : { count: log.count + 1, last: t };
      return { feedLog: { ...s.feedLog, [v.id]: next } };
    });
  };

  return (
    <div class="stack" style={{ gap: '18px' }}>
      {!embedded && <Back href="#/animaux" label="Animaux" />}
      <div class="row" style={{ gap: '16px' }}>
        <Thumb file={v.file + '.png'} name={v.name} lg />
        <div class="stack" style={{ gap: '6px', flex: 1 }}>
          <h1 style={{ fontSize: '26px' }}>{v.name}</h1>
          <div class="row wrap" style={{ gap: '4px' }}><BiomePill id={sp.biome} /><ExtTag ext={b?.ext} /></div>
          {v.area && <div class="small muted">{v.area}</div>}
          <span class={'tag' + (av.now ? '' : ' outline')} style={{ alignSelf: 'flex-start', fontSize: '12px', padding: '3px 10px' }}>{av.text}</span>
        </div>
        <button class={'icon-btn' + (watched ? ' on' : '')} aria-pressed={watched} aria-label={watched ? 'Ne plus suivre' : 'Me prévenir'}
          onClick={() => update((s) => ({ watched: { ...s.watched, [v.id]: !watched } }))}>
          <Icon name="bell" fill={watched ? 'currentColor' : 'none'} />
        </button>
      </div>

      <section class="card stack" style={{ gap: '12px' }}>
        <div class="between">
          <h2>Apprivoisement</h2>
          <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{feed.count} repas</span>
        </div>
        <div class="grid-2">
          <button class={'btn' + (feed.fedToday ? ' ok' : '')} onClick={feedToday}>
            {feed.fedToday ? <><Icon name="check" size={18} />Nourri aujourd'hui</> : 'Je l’ai nourri'}
          </button>
          <button class={'btn' + (tamed ? ' ok' : ' ghost')} onClick={() => update((s) => ({ tamed: { ...s.tamed, [v.id]: !tamed } }))}>
            {tamed ? <><Icon name="check" size={18} />Apprivoisé</> : 'Apprivoisé ?'}
          </button>
        </div>
        <div class="small muted">Seul le premier repas de la journée compte. Il en faut au moins deux, souvent plus.</div>
      </section>

      <section class="stack">
        <h2>Comment l'approcher</h2>
        <div class="card stack">
          <strong style={{ color: 'var(--warn)' }}>{METHODS[sp.method].label}</strong>
          <span style={{ lineHeight: 1.45 }}>{METHODS[sp.method].text}</span>
          {sp.tip && <span class="small muted">{sp.tip}</span>}
        </div>
      </section>

      <section class="stack">
        <h2>Nourriture</h2>
        <div class="grid-2">
          <div class="card stack">
            <span class="small" style={{ fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)' }}>Préférée</span>
            <div class="row" style={{ gap: '8px', alignItems: 'center' }}>
              {FOOD_FILE[v.favOverride || sp.fav] && <Thumb file={FOOD_FILE[v.favOverride || sp.fav]} name={v.favOverride || sp.fav} />}
              <strong>{v.favOverride || sp.fav}</strong>
            </div>
            <span class="small muted">{sp.rewards.fav}</span>
          </div>
          <div class="card stack">
            <span class="small muted" style={{ fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Aimée</span>
            <div class="stack" style={{ gap: '2px' }}>
              {sp.liked.split(/,\s*/).map((item) => <strong key={item} style={{ fontSize: '14px' }}>{item}</strong>)}
            </div>
            <span class="small muted">{sp.rewards.liked}</span>
          </div>
        </div>
      </section>

      <section class="stack">
        <h2>Présence dans la semaine</h2>
        <div class="card stack">
          <div class="week">
            {v.schedule.map((d, i) => (
              <div key={i} class={'d' + (i === today ? ' today' : '')}>
                {DAYS_SHORT[i]}
                <div class="slot" style={{ height: '48px' }}>
                  {rangesOf(d).map(([a, e], k) => (
                    <i key={k} style={{ left: 0, right: 0, top: `${(a / 24) * 100}%`, bottom: `${100 - (e / 24) * 100}%` }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div class="small muted">De haut en bas : de 0 h à 24 h.</div>
        </div>
      </section>

      <section class="stack">
        <h2>Autres couleurs</h2>
        <div class="grid-3">
          {VARIANTS.filter((o) => o.species.id === sp.id && o.id !== v.id).map((o) => {
            const oav = availabilityLabel(o.schedule, now);
            return (
              <a key={o.id} href={`#/animaux/${o.id}`} class="stack" style={{ alignItems: 'center', gap: '4px', color: 'var(--text)', textAlign: 'center' }}>
                <Thumb file={o.file + '.png'} name={o.name} />
                <span class="small" style={{ fontWeight: 800 }}>{o.name}</span>
                <span class="small" style={{ fontWeight: 700, color: oav.now ? 'var(--teal)' : 'var(--muted)' }}>{oav.text}</span>
                {state.tamed[o.id] && <span class="tag outline">Apprivoisé</span>}
              </a>
            );
          })}
        </div>
      </section>
      <div class="small muted">Source : Dreamlight Valley Wiki</div>
    </div>
  );
}
