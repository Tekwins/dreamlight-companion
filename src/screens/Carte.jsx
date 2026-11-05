import { useState } from 'preact/hooks';
import { useStore } from '../lib/store.js';
import { BIOME } from '../data/biomes.js';
import { CROPS, FISH, GEMS, FORAGE } from '../data/resources.js';
import { SPECIES } from '../data/critters.js';
import { Icon, Seg, ExtTag } from '../ui.jsx';

// Décor des zones (formes "dessinées à la main") : purement visuel, aucune donnée de jeu.
const BLOBS = [
  'M -95,-8 C -100,-55 -60,-92 -5,-90 C 50,-93 98,-55 95,-2 C 100,48 60,90 5,92 C -50,95 -92,42 -95,-8 Z',
  'M -125,-10 C -130,-48 -85,-68 -30,-62 C 25,-70 110,-58 120,-8 C 128,38 75,68 15,64 C -55,72 -120,32 -125,-10 Z',
  'M -70,-115 C -90,-70 -82,-20 -78,25 C -85,75 -40,115 8,112 C 55,118 92,78 85,28 C 95,-22 78,-78 35,-108 C 2,-128 -42,-130 -70,-115 Z',
  'M -65,-20 C -72,-55 -35,-72 8,-65 C 48,-72 78,-42 72,-2 C 80,32 48,62 8,58 C -32,66 -62,35 -65,-20 Z',
  'M -80,20 C -95,-20 -70,-70 -20,-85 C 25,-98 75,-80 90,-35 C 100,5 85,50 45,70 C 5,90 -45,80 -80,20 Z'
];
// Texture de chaque zone : vraie tuile de carte extraite des fichiers du jeu (bundle
// ui-images-menu-map-hires), recadrée/compressée dans public/img/map/. Association zone ↔
// tuile faite à l'œil (aucune carte officielle assemblée pour les extensions, voir CLAUDE.md) —
// fiable pour le jeu de base (noms de tuiles explicites), au mieux pour les extensions quand
// plusieurs tuiles partagent le même biome (ex. les 4 tuiles "desert" pour les 4 zones de Dunes).
const TILE = {
  esplanade: 'esplanade.webp', prairie: 'prairie.webp', plage: 'plage.webp', foret: 'foret.webp',
  bayou: 'bayou.webp', plateau: 'plateau.webp', hauteurs: 'hauteurs.webp', terres: 'terres.webp',
  'la-cour': 'la-cour.webp', 'les-quais': 'les-quais.webp', 'la-promenade': 'la-promenade.webp', 'le-belvedere': 'le-belvedere.webp',
  loasis: 'loasis.webp', 'le-desert': 'le-desert.webp', 'les-plaines': 'les-plaines.webp', 'les-ruines': 'les-ruines.webp',
  'la-lisiere': 'la-lisiere.webp', 'le-bosquet': 'le-bosquet.webp', 'les-pres': 'les-pres.webp', 'le-lagon': 'le-lagon.webp',
  bibliotheque: 'bibliotheque.webp', 'chutes-theiere': 'chutes-theiere.webp', 'champs-elysees': 'champs-elysees.webp', 'mont-olympe': 'mont-olympe.webp',
  'bois-sauvages': 'bois-sauvages.webp', 'ranch-florespérance': 'ranch.webp', 'voie-souhaits': 'voie-souhaits.webp',
  'alpes-enchantees': 'alpes-enchantees.webp', 'highlands-ranch': 'highlands-ranch.webp', 'ravin-ravissant': 'ravin-ravissant.webp', 'clairiere-feerique': 'clairiere-feerique.webp'
};

// Zones affichées sur la carte. Le jeu de base reprend tel quel les 8 biomes réels
// (biomes.js). Les extensions ont des lieux bien plus précis que nos biomes actuels
// (ex. « L'Oasis » dans Dunes scintillantes) : pas encore une donnée de jeu confirmée dans
// src/data, donc gardées ici — chaque zone est juste rattachée au biome réel le plus proche
// pour aller chercher ses ressources/pêche/animaux (la position/forme est une composition
// plausible, pas un relevé exact : aucune carte officielle assemblée n'existe pour les
// extensions, voir la mémoire du projet).
const BASE_ZONES = [
  { id: 'esplanade', name: 'Esplanade', l1: 'ESPLANADE', l2: '', biome: 'esplanade', cx: 485, cy: 390, blob: 3, scale: 1.4, rot: 0, icon: 'castle', caption: 'Le cœur de la vallée, là où bat la vie du village.' },
  { id: 'prairie', name: 'Prairie tranquille', l1: 'PRAIRIE', l2: 'TRANQUILLE', biome: 'prairie', cx: 480, cy: 615, blob: 1, scale: 1.7, rot: -4, icon: 'sun', caption: 'De vastes champs à perte de vue, parfaits pour les récoltes.' },
  { id: 'plage', name: 'Plage enchantée', l1: 'PLAGE', l2: 'ENCHANTÉE', biome: 'plage', cx: 730, cy: 635, blob: 0, scale: 1.55, rot: 6, icon: 'wave', caption: 'Sable doré et vagues douces, avec quelques îlots au large.' },
  { id: 'foret', name: 'Forêt du courage', l1: 'FORÊT DU', l2: 'COURAGE', biome: 'foret', cx: 700, cy: 400, blob: 2, scale: 1.5, rot: 10, icon: 'leaf', caption: 'Une canopée dense où rôdent ratons laveurs et brochets.' },
  { id: 'bayou', name: 'Bayou de la confiance', l1: 'BAYOU DE LA', l2: 'CONFIANCE', biome: 'bayou', cx: 255, cy: 650, blob: 2, scale: 1.55, rot: -6, icon: 'leaf', caption: 'Eaux calmes et reflets verts, royaume des crocodiles.' },
  { id: 'plateau', name: 'Plateau ensoleillé', l1: 'PLATEAU', l2: 'ENSOLEILLÉ', biome: 'plateau', cx: 290, cy: 410, blob: 0, scale: 1.45, rot: 0, icon: 'sun', caption: "Un plateau baigné de soleil, idéal pour les cultures d'été." },
  { id: 'hauteurs', name: 'Hauteurs glacées', l1: 'HAUTEURS', l2: 'GLACÉES', biome: 'hauteurs', cx: 740, cy: 180, blob: 1, scale: 1.6, rot: 5, icon: 'snow', caption: 'Neiges éternelles et vents glacés sur les hauteurs.' },
  { id: 'terres', name: 'Terres oubliées', l1: 'TERRES', l2: 'OUBLIÉES', biome: 'terres', cx: 250, cy: 200, blob: 2, scale: 1.55, rot: -8, icon: 'peak', caption: 'Un territoire oublié, à la lisière du mystère.' }
];
const RIFT_ZONES = [
  { id: 'la-cour', name: 'La Cour', l1: 'LA COUR', l2: '', biome: 'port', cx: 660, cy: 165, blob: 3, scale: 1.3, rot: 0, icon: 'castle', caption: "Une cour de pierre ancienne, porte d'entrée du port." },
  { id: 'les-quais', name: 'Les Quais', l1: 'LES QUAIS', l2: '', biome: 'port', cx: 800, cy: 250, blob: 0, scale: 1.45, rot: 8, icon: 'wave', caption: "Pontons de bois où accostent les navires d'autrefois." },
  { id: 'la-promenade', name: 'La Promenade', l1: 'LA', l2: 'PROMENADE', biome: 'port', cx: 810, cy: 390, blob: 1, scale: 1.45, rot: -5, icon: 'wave', caption: 'Une allée dallée longeant la mer scintillante.' },
  { id: 'le-belvedere', name: 'Le Belvédère', l1: 'LE', l2: 'BELVÉDÈRE', biome: 'port', cx: 670, cy: 470, blob: 3, scale: 1.3, rot: 0, icon: 'wave', caption: 'Un promontoire offrant une vue sur tout le rivage.' },
  { id: 'loasis', name: "L'Oasis", l1: "L'OASIS", l2: '', biome: 'dunes', cx: 400, cy: 350, blob: 0, scale: 1.25, rot: 0, icon: 'wave', caption: "Une étendue d'eau fraîche au cœur des dunes." },
  { id: 'le-desert', name: 'Le Désert', l1: 'LE DÉSERT', l2: '', biome: 'dunes', cx: 260, cy: 210, blob: 1, scale: 1.7, rot: 0, icon: 'sun', caption: 'Des dunes dorées à perte de vue.' },
  { id: 'les-plaines', name: 'Les Plaines', l1: 'LES PLAINES', l2: '', biome: 'dunes', cx: 260, cy: 90, blob: 0, scale: 1.4, rot: -6, icon: 'sun', caption: 'Un désert de sable fin balayé par le vent.' },
  { id: 'les-ruines', name: 'Les Ruines', l1: 'LES RUINES', l2: '', biome: 'dunes', cx: 150, cy: 330, blob: 4, scale: 1.3, rot: 5, icon: 'peak', caption: "Vestiges d'une civilisation disparue, à moitié ensevelis." },
  { id: 'la-lisiere', name: 'La Lisière', l1: 'LA LISIÈRE', l2: '', biome: 'meandres', cx: 380, cy: 430, blob: 2, scale: 1.4, rot: 0, icon: 'leaf', caption: 'La frontière entre sable et végétation sauvage.' },
  { id: 'le-bosquet', name: 'Le Bosquet', l1: 'LE BOSQUET', l2: '', biome: 'meandres', cx: 300, cy: 640, blob: 0, scale: 1.3, rot: 0, icon: 'leaf', caption: 'Un bosquet touffu au cœur des méandres.' },
  { id: 'les-pres', name: 'Les Prés', l1: 'LES PRÉS', l2: '', biome: 'meandres', cx: 510, cy: 660, blob: 1, scale: 1.35, rot: 0, icon: 'leaf', caption: 'Des prairies sauvages nichées entre les méandres.' },
  { id: 'le-lagon', name: 'Le Lagon', l1: 'LE LAGON', l2: '', biome: 'meandres', cx: 640, cy: 610, blob: 3, scale: 1.25, rot: 0, icon: 'wave', caption: 'Une eau calme et turquoise, blottie dans la jungle.' }
];
const VALE_ZONES = [
  { id: 'bibliotheque', name: 'Bibliothèque du savoir', l1: 'BIBLIOTHÈQUE', l2: 'DU SAVOIR', biome: 'reliure', cx: 480, cy: 230, blob: 2, scale: 1.4, rot: 0, icon: 'book', caption: 'Un sanctuaire de récits et de pages anciennes.' },
  { id: 'chutes-theiere', name: 'Chutes de la Théière', l1: 'CHUTES DE LA', l2: 'THÉIÈRE', biome: 'reliure', cx: 340, cy: 410, blob: 0, scale: 1.3, rot: 0, icon: 'wave', caption: "Une cascade fantaisiste tout droit sortie d'un conte." },
  { id: 'champs-elysees', name: 'Champs Élysées', l1: 'CHAMPS', l2: 'ÉLYSÉES', biome: 'mythopie', cx: 660, cy: 440, blob: 1, scale: 1.5, rot: 0, icon: 'sun', caption: 'Des champs dorés inspirés des mythes grecs.' },
  { id: 'mont-olympe', name: 'Mont Olympe', l1: 'MONT', l2: 'OLYMPE', biome: 'mythopie', cx: 740, cy: 240, blob: 2, scale: 1.55, rot: -4, icon: 'peak', caption: 'Le sommet légendaire où résident les dieux.' },
  { id: 'bois-sauvages', name: 'Bois sauvages', l1: 'BOIS', l2: 'SAUVAGES', biome: 'comte', cx: 290, cy: 590, blob: 4, scale: 1.45, rot: 0, icon: 'leaf', caption: "Une forêt touffue à l'orée du comté des contes." }
];
const RANCH_ZONES = [
  { id: 'ranch-florespérance', name: 'Ranch de Florespérance', l1: 'RANCH DE', l2: 'FLORESPÉRANCE', biome: 'ranch', cx: 460, cy: 480, blob: 1, scale: 1.55, rot: 0, icon: 'castle', caption: 'Le cœur fleuri du ranch, entre granges et vergers.' },
  { id: 'voie-souhaits', name: 'Voie des souhaits', l1: 'VOIE DES', l2: 'SOUHAITS', biome: 'ranch', cx: 480, cy: 310, blob: 3, scale: 1.3, rot: 0, icon: 'sun', caption: 'Un chemin serpentant vers les hauteurs du ranch.' },
  { id: 'alpes-enchantees', name: 'Alpes enchantées', l1: 'ALPES', l2: 'ENCHANTÉES', biome: 'alpes', cx: 690, cy: 180, blob: 2, scale: 1.55, rot: 0, icon: 'snow', caption: 'Des sommets enneigés et enchantés qui dominent le ranch.' },
  { id: 'highlands-ranch', name: 'Highlands du Ranch', l1: 'HIGHLANDS', l2: 'DU RANCH', biome: 'alpes', cx: 760, cy: 350, blob: 0, scale: 1.35, rot: 6, icon: 'snow', caption: 'De hauts plateaux balayés par le vent, au-dessus du ranch.' },
  { id: 'ravin-ravissant', name: 'Ravin ravissant', l1: 'RAVIN', l2: 'RAVISSANT', biome: 'gulch', cx: 260, cy: 560, blob: 4, scale: 1.4, rot: 0, icon: 'peak', caption: 'Un canyon escarpé aux couleurs flamboyantes.' },
  { id: 'clairiere-feerique', name: 'Clairière féerique', l1: 'CLAIRIÈRE', l2: 'FÉERIQUE', biome: 'pixie', cx: 320, cy: 270, blob: 0, scale: 1.3, rot: -5, icon: 'flower', caption: 'Une clairière secrète où volent les lucioles et les fées.' }
];

const MAPS = [
  { id: 'base', label: 'Jeu de base', ext: null, zones: BASE_ZONES, river: 'M 480,60 C 460,160 500,220 460,300 C 420,380 320,380 300,460 C 280,540 320,560 300,640 C 285,700 260,740 240,780' },
  { id: 'rift', label: 'A Rift in Time', ext: 'rift', zones: RIFT_ZONES, river: 'M 380,250 C 420,320 380,380 420,450 C 460,520 520,560 560,600 C 600,650 630,660 650,700' },
  { id: 'vale', label: 'The Storybook Vale', ext: 'vale', zones: VALE_ZONES, river: 'M 330,350 C 300,420 260,480 270,560 C 275,620 300,660 320,700' },
  { id: 'ranch', label: 'Wishblossom Ranch', ext: 'ranch', zones: RANCH_ZONES, river: 'M 680,220 C 600,280 520,340 470,420 C 420,480 340,500 280,540' }
];

const TYPE_LABEL = { culture: 'Culture', cueillette: 'Cueillette', gemme: 'Gemme' };

// Ressources/pêche/animaux réels du biome associé à une zone — jamais dupliqués, juste
// filtrés depuis resources.js/critters.js (même source que Resources.jsx/Animals.jsx).
// Chaque lien pré-remplit la recherche de l'écran visé (ResourceScreen lit déjà ?q=).
function zoneResources(biomeId) {
  const out = [];
  for (const c of CROPS) if (c.biomes.includes(biomeId)) out.push({ name: c.name, type: 'culture', href: '#/potager?q=' + encodeURIComponent(c.name) });
  for (const f of FORAGE) if (f.biomes.includes(biomeId)) out.push({ name: f.name, type: 'cueillette', href: '#/cueillette?q=' + encodeURIComponent(f.name) });
  for (const g of GEMS) if (g.biomes.includes(biomeId)) out.push({ name: g.name, type: 'gemme', href: '#/mines?q=' + encodeURIComponent(g.name) });
  return out;
}
function zoneFish(biomeId) {
  return FISH.filter((f) => f.biomes.includes(biomeId)).map((f) => ({ name: f.name, href: '#/peche?q=' + encodeURIComponent(f.name) }));
}
// Animals.jsx recherche sur le nom de la VARIANTE (ex. "Singe doré"), pas sur le nom de
// l'espèce au pluriel ("Singes") : ça ne matcherait aucune ligne. Le nom du biome, lui, est
// inclus dans la recherche de chaque variante (BIOME[...].name) et désigne sans ambiguïté
// tous les animaux de cette zone.
function zoneCritters(biomeId) {
  const bio = BIOME[biomeId];
  return SPECIES.filter((s) => s.biome === biomeId).map((s) => ({ name: s.name, href: '#/animaux?q=' + encodeURIComponent(bio?.name || s.name) }));
}

function ZoneIcon({ name, x, y }) {
  const size = 24;
  const props = { x: x - 12, y: y - 12, width: size, height: size };
  if (name === 'castle') return <g {...props} viewBox="-14 -14 28 28"><rect x="2" y="12" width="20" height="12" rx="1.5" fill="#F8F4FF" /><path d="M2,12 L12,2 L22,12 Z" fill="#F8F4FF" /><rect x="10" y="16" width="4" height="8" fill="#6B5DA8" /><line x1="12" y1="2" x2="12" y2="-2" stroke="#F8F4FF" stroke-width="1.6" /><path d="M12,-2 L17,0 L12,2 Z" fill="#E8604C" /></g>;
  if (name === 'snow') return <g {...props} viewBox="-14 -14 28 28" stroke="#F8F4FF" stroke-width="2.2" stroke-linecap="round"><line x1="2" y1="12" x2="22" y2="12" /><line x1="12" y1="2" x2="12" y2="22" /><line x1="5" y1="5" x2="19" y2="19" /><line x1="5" y1="19" x2="19" y2="5" /></g>;
  if (name === 'wave') return <g {...props} viewBox="-14 -14 28 28" fill="none" stroke="#F8F4FF" stroke-width="2.4" stroke-linecap="round"><path d="M1,10 Q6,3 12,10 Q18,17 23,10" /><path d="M1,18 Q6,11 12,18 Q18,25 23,18" opacity="0.7" /></g>;
  if (name === 'leaf') return <g {...props} viewBox="-14 -14 28 28"><path d="M12,1 C21,4 23,14 12,24 C1,14 3,4 12,1 Z" fill="#F8F4FF" /><line x1="12" y1="3" x2="12" y2="22" stroke="#5FBF7F" stroke-width="1.4" /></g>;
  if (name === 'peak') return <g {...props} viewBox="-14 -14 28 28"><path d="M0,20 L9,3 L15,10 L19,4 L24,20 Z" fill="#F8F4FF" /><path d="M9,3 L12,9 L7,11 Z" fill="#BFE3FF" /></g>;
  if (name === 'flower') return <g {...props} viewBox="-14 -14 28 28"><g fill="#F8F4FF"><circle cx="12" cy="5" r="3.4" /><circle cx="18" cy="10" r="3.4" /><circle cx="16" cy="18" r="3.4" /><circle cx="8" cy="18" r="3.4" /><circle cx="6" cy="10" r="3.4" /></g><circle cx="12" cy="12" r="2.6" fill="#F5C95C" /></g>;
  if (name === 'book') return <g {...props} viewBox="-14 -14 28 28"><path d="M2,4 C6,2 10,2 12,4 C14,2 18,2 22,4 L22,20 C18,18 14,18 12,20 C10,18 6,18 2,20 Z" fill="#F8F4FF" /><line x1="12" y1="4" x2="12" y2="20" stroke="#D9A6E8" stroke-width="1.4" /></g>;
  return null;
}

export function Carte() {
  const { state } = useStore();
  const availableMaps = MAPS.filter((m) => !m.ext || state.extensions[m.ext]);
  const [mapId, setMapId] = useState('base');
  const [zoneId, setZoneId] = useState(null);
  const map = availableMaps.find((m) => m.id === mapId) || availableMaps[0];

  function pickMap(id) { setMapId(id); setZoneId(null); }

  const selected = map.zones.find((z) => z.id === zoneId) || null;
  const bio = selected ? BIOME[selected.biome] : null;
  const resources = selected ? zoneResources(selected.biome) : [];
  const fish = selected ? zoneFish(selected.biome) : [];
  const critters = selected ? zoneCritters(selected.biome) : [];

  return (
    <div class="page wide">
      <h1>Carte de la vallée</h1>
      <p class="small muted" style={{ margin: 0 }}>Clique une zone pour voir ses ressources, sa pêche et ses animaux.</p>

      {availableMaps.length > 1 && (
        <Seg label="Carte affichée" options={availableMaps.map((m) => [m.id, m.label])} value={map.id} onChange={pickMap} />
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
        <div style={{ flex: '999 1 620px', minWidth: 0, background: 'var(--surface)', borderRadius: '24px', padding: '16px' }}>
          <svg viewBox="0 0 1000 800" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '18px' }} role="img" aria-label={'Carte — ' + map.label}>
            <defs>
              <filter id="map-sketchy" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="7" result="n" />
                <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" />
              </filter>
              <filter id="map-glow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="10" />
              </filter>
              <radialGradient id="map-ocean" cx="50%" cy="40%" r="78%">
                <stop offset="0%" stop-color="var(--surface-2)" />
                <stop offset="60%" stop-color="var(--surface)" />
                <stop offset="100%" stop-color="var(--bg)" />
              </radialGradient>
            </defs>

            <rect x="0" y="0" width="1000" height="800" fill="url(#map-ocean)" />
            <path d={map.river} fill="none" stroke="var(--teal)" stroke-width="22" stroke-linecap="round" opacity="0.35" />
            <path d={map.river} fill="none" stroke="var(--text)" stroke-width="7" stroke-linecap="round" opacity="0.3" />

            {map.zones.map((zone) => {
              const isSel = zone.id === zoneId;
              const tile = TILE[zone.id];
              return (
                <g key={zone.id} transform={`translate(${zone.cx},${zone.cy}) rotate(${zone.rot}) scale(${zone.scale})`} onClick={() => setZoneId(zone.id)} style={{ cursor: 'pointer' }}>
                  {isSel && <path d={BLOBS[zone.blob]} fill="var(--accent)" opacity="0.5" filter="url(#map-glow)" transform="scale(1.22)" />}
                  <path d={BLOBS[zone.blob]} fill={BIOME[zone.biome]?.color || '#999'} fill-opacity="0.88" filter="url(#map-sketchy)" />
                  {tile && (
                    <g clip-path={`url(#clip-${zone.id})`}>
                      <clipPath id={`clip-${zone.id}`}><path d={BLOBS[zone.blob]} /></clipPath>
                      <image href={`img/map/${tile}`} x="-140" y="-140" width="280" height="280" preserveAspectRatio="xMidYMid slice" />
                      <path d={BLOBS[zone.blob]} fill={BIOME[zone.biome]?.color || '#999'} opacity="0.3" />
                    </g>
                  )}
                  <path d={BLOBS[zone.blob]} fill="none" stroke={isSel ? '#FFE8A3' : 'var(--bg)'} stroke-width={isSel ? 9 : 7} stroke-dasharray="2 11" stroke-linecap="round" filter="url(#map-sketchy)" />
                </g>
              );
            })}

            {map.zones.map((zone) => {
              const isSel = zone.id === zoneId;
              return (
                <g key={zone.id} transform={`translate(${zone.cx},${zone.cy})`} onClick={() => setZoneId(zone.id)} role="button" tabindex="0" aria-label={zone.name} style={{ cursor: 'pointer' }}>
                  {isSel && <circle r="23" cy="-34" fill="none" stroke="var(--accent)" stroke-width="2" opacity="0.65" />}
                  <circle r="17" cy="-34" fill="var(--surface-2)" stroke={isSel ? '#FFE8A3' : 'var(--bg)'} stroke-width={isSel ? 3.5 : 2} />
                  <ZoneIcon name={zone.icon} x={0} y={-34} />
                  <text x="0" y="2" text-anchor="middle" font-family="var(--font-display)" font-weight="700" font-size="21" fill="var(--text)" stroke="var(--bg)" stroke-width="4" stroke-linejoin="round" paint-order="stroke" style={{ letterSpacing: '1px' }}>{zone.l1}</text>
                  {zone.l2 && <text x="0" y="24" text-anchor="middle" font-family="var(--font-display)" font-weight="700" font-size="21" fill="var(--text)" stroke="var(--bg)" stroke-width="4" stroke-linejoin="round" paint-order="stroke" style={{ letterSpacing: '1px' }}>{zone.l2}</text>}
                </g>
              );
            })}
          </svg>
        </div>

        <div class="card" style={{ flex: '1 1 320px', minWidth: '300px', maxWidth: '420px', padding: 0, overflow: 'hidden', alignSelf: 'stretch' }}>
          {selected ? (
            <>
              <div style={{ padding: '18px 20px', background: bio?.color, position: 'relative' }}>
                <button type="button" onClick={() => setZoneId(null)} aria-label="Fermer le panneau"
                  style={{ position: 'absolute', top: '12px', right: '12px', width: '28px', height: '28px', borderRadius: '999px', border: 'none', background: 'rgba(20,18,58,0.22)', color: '#14123A', fontSize: '15px', fontWeight: 700, cursor: 'pointer', lineHeight: 1 }}>×</button>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px', color: '#14123A', paddingRight: '30px' }}>{selected.name}</div>
                <ExtTag ext={map.ext} />
              </div>
              <div style={{ padding: '4px 18px 20px', maxHeight: '560px', overflowY: 'auto' }}>
                <div class="small muted" style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', margin: '14px 0 6px' }}>Ressources</div>
                {resources.length ? (
                  <div class="list-rows">
                    {resources.map((r) => (
                      <a key={r.href} href={r.href} class="list-row">
                        <span style={{ flex: 1, fontWeight: 700 }}>{r.name}</span>
                        <span class="tag">{TYPE_LABEL[r.type]}</span>
                      </a>
                    ))}
                  </div>
                ) : <div class="small muted">Pas encore de ressource recensée ici.</div>}

                <div class="small muted" style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', margin: '14px 0 6px' }}>Pêche</div>
                {fish.length ? (
                  <div class="list-rows">
                    {fish.map((f) => <a key={f.href} href={f.href} class="list-row"><span style={{ flex: 1, fontWeight: 700 }}>{f.name}</span></a>)}
                  </div>
                ) : <div class="small muted">Aucun poisson recensé dans cette zone.</div>}

                <div class="small muted" style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', margin: '14px 0 6px' }}>Animaux</div>
                {critters.length ? (
                  <div class="list-rows">
                    {critters.map((c) => <a key={c.href} href={c.href} class="list-row"><span style={{ flex: 1, fontWeight: 700 }}>{c.name}</span></a>)}
                  </div>
                ) : <div class="small muted">Pas encore d'animal recensé ici.</div>}

                <div class="small muted" style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', margin: '14px 0 6px' }}>Autres infos</div>
                <div class="small" style={{ lineHeight: 1.5, padding: '2px 4px 4px' }}>{selected.caption}</div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '50px 24px', minHeight: '400px' }}>
              <Icon name="search" size={28} style={{ color: 'var(--accent)', marginBottom: '14px' }} />
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px' }}>Choisis une zone</div>
              <div class="small muted" style={{ marginTop: '8px', maxWidth: '240px', lineHeight: 1.5 }}>Clique sur une zone de la carte pour afficher ses ressources, sa pêche, ses animaux et plus.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
