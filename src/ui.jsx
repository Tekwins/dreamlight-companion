import { useState } from 'preact/hooks';
import { BIOME } from './data/biomes.js';

// ---------- Icônes (traits, aucune police d'icônes) ----------
const PATHS = {
  home: <><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></>,
  book: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 21V5" /></>,
  pot: <><path d="M4 11h16v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z" /><path d="M2 11h20" /><path d="M9 7c0-1 1-1.5 1-3M14 7c0-1 1-1.5 1-3" /></>,
  leaf: <><path d="M12 21v-9" /><path d="M12 12C8 12 5 9 5 5c4 0 7 3 7 7z" /><path d="M12 14c4 0 7-3 7-7-4 0-7 3-7 7z" /></>,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  paw: <><circle cx="6" cy="10" r="2" /><circle cx="10" cy="5.5" r="2" /><circle cx="14" cy="5.5" r="2" /><circle cx="18" cy="10" r="2" /><path d="M8 17c0-3 2-5 4-5s4 2 4 5a2.5 2.5 0 0 1-4 2 2.5 2.5 0 0 1-4-2z" /></>,
  sprout: <><path d="M12 21v-8" /><path d="M12 13c-3 0-6-2-6-6 3 0 6 2 6 6z" /><path d="M12 11c0-3 2-6 6-6 0 3-2 6-6 6z" /><path d="M7 21h10" /></>,
  fish: <><path d="M3 12c3-5 9-6 14-3l4-3v12l-4-3c-5 3-11 2-14-3z" /><circle cx="15" cy="11" r="0.8" /></>,
  basket: <><path d="M4 10h16l-2 10H6z" /><path d="M8 10l4-6 4 6" /></>,
  gem: <><path d="M6 3h12l4 6-10 12L2 9z" /><path d="M2 9h20M12 21L8 9l4-6 4 6z" /></>,
  list: <><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>,
  fridge: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M5 10h14M9 6v1M9 13v3" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
  back: <path d="M15 5l-7 7 7 7" />,
  chevron: <path d="M9 5l7 7-7 7" />,
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
  bell: <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M5 12l5 5L20 7" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  sync: <><path d="M20 11a8 8 0 0 0-14.9-3M4 13a8 8 0 0 0 14.9 3" /><path d="M4 4v4h4M20 20v-4h-4" /></>
};

export function Icon({ name, size = 22, fill = 'none', ...rest }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" {...rest}>
      {PATHS[name]}
    </svg>
  );
}

// ---------- Image du wiki, avec repli sur l'initiale ----------
// Le wiki Fandom FR (images.wikia.nocookie.net) bloque l'intégration cross-origin (anti-hotlink) :
// seul le wiki EN (indépendant) peut servir de repli en ligne pour une <img> embarquée.
export function wikiImage(file) {
  return 'https://dreamlightvalleywiki.com/Special:FilePath/' + encodeURIComponent(file.replace(/ /g, '_'));
}

// Ordre d'essai : copie locale (public/img, remplie par le script), puis wiki, puis initiale.
export function Thumb({ file, name, round, lg, ring }) {
  const [stage, setStage] = useState(0);
  const cls = 'thumb' + (round ? ' round' : '') + (lg ? ' lg' : '');
  const src = file && stage === 0 ? 'img/' + file.replace(/ /g, '_') : file && stage === 1 ? wikiImage(file) : null;
  return (
    <div class={cls} style={ring ? { boxShadow: `inset 0 0 0 3px ${ring}` } : null}>
      {src ? (
        <img key={src} src={src} alt="" loading="lazy" onError={() => setStage(stage + 1)} />
      ) : (
        <span aria-hidden="true">{(name || '?').charAt(0)}</span>
      )}
    </div>
  );
}

// ---------- Petits éléments ----------
export function BiomePill({ id, selected }) {
  if (id === '*') return <span class="pill"><span class="dot" style={{ background: 'var(--muted)' }} />Partout (rare)</span>;
  const b = BIOME[id];
  if (!b) return null;
  return (
    <span class={'pill' + (selected ? ' sel' : '')}>
      <span class="dot" style={{ background: b.color }} />
      {b.name}
    </span>
  );
}

export function BiomePills({ ids, selected }) {
  return (
    <div class="row wrap" style={{ gap: '4px' }}>
      {ids.map((id) => <BiomePill key={id} id={id} selected={id === selected} />)}
    </div>
  );
}

export function Stars({ n }) {
  return <span class="stars" aria-label={`${n} étoile${n > 1 ? 's' : ''}`}>{'★'.repeat(n)}</span>;
}

export function Seg({ options, value, onChange, small, label }) {
  return (
    <div class={'seg' + (small ? ' small' : '')} role="group" aria-label={label}>
      {options.map(([id, text, dot]) => (
        <button key={id} class={value === id ? 'on' : ''} aria-pressed={value === id} onClick={() => onChange(id)}>
          {dot && <span class="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: dot }} />}
          {text}
        </button>
      ))}
    </div>
  );
}

export function Switch({ on, onChange, label }) {
  return (
    <button class={'switch' + (on ? ' on' : '')} aria-pressed={on} aria-label={label} onClick={() => onChange(!on)}>
      <span />
    </button>
  );
}

export function Back({ href, label }) {
  return (
    <a class="back" href={href}>
      <Icon name="back" size={20} />
      {label}
    </a>
  );
}

export function Search({ value, onInput, placeholder }) {
  return (
    <label class="search">
      <Icon name="search" size={20} class="muted" />
      <span class="sr">{placeholder}</span>
      <input type="search" value={value} placeholder={placeholder} onInput={(e) => onInput(e.currentTarget.value)} />
    </label>
  );
}

export function GroupTitle({ color, title, count }) {
  return (
    <h2 class="group-title">
      {color && <span class="dot" style={{ background: color }} />}
      {title}
      {count != null && <small>{count}</small>}
    </h2>
  );
}

export function ExtTag({ ext }) {
  if (!ext) return null;
  // Ajout de "honeyglow" : nouvelle extension (Winnie l'ourson et ses amis).
  const label = { rift: 'Rift', vale: 'Vale', ranch: 'Ranch', honeyglow: 'Honeyglow' }[ext] || ext;
  return <span class="tag">{label}</span>;
}

// Normalise une chaîne pour la recherche (sans accents ni majuscules).
export function norm(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
