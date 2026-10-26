import { Fragment } from 'preact';
import { useEffect } from 'preact/hooks';
import { useRoute } from './lib/router.js';
import { useStore } from './lib/store.js';
import { Icon } from './ui.jsx';
import { Home } from './screens/Home.jsx';
import { Animals } from './screens/Animals.jsx';
import { Valley } from './screens/Valley.jsx';
import { ResourceScreen } from './screens/Resources.jsx';
import { Recipes } from './screens/Recipes.jsx';
import { Pantry } from './screens/Pantry.jsx';
import { Shopping } from './screens/Shopping.jsx';
import { Friends } from './screens/Friends.jsx';
import { Guide } from './screens/Guide.jsx';
import { Settings } from './screens/Settings.jsx';

const TABS = [
  { href: '#/', label: 'Aujourd’hui', icon: 'home', match: (p) => p === '/' },
  { href: '#/guide', label: 'Guide', icon: 'book', match: (p) => p.startsWith('/guide') },
  { href: '#/recettes', label: 'Recettes', icon: 'pot', match: (p) => /^\/(recettes|garde-manger|courses)/.test(p) },
  { href: '#/vallee', label: 'Vallée', icon: 'leaf', match: (p) => /^\/(vallee|animaux|potager|peche|cueillette|mines)/.test(p) },
  { href: '#/amitie', label: 'Amitié', icon: 'heart', match: (p) => p.startsWith('/amitie') }
];

const SUB = {
  '#/recettes': [['#/garde-manger', 'Garde-manger'], ['#/courses', 'Liste de courses']],
  '#/vallee': [['#/animaux', 'Animaux'], ['#/potager', 'Potager'], ['#/peche', 'Pêche'], ['#/cueillette', 'Cueillette'], ['#/mines', 'Mines']]
};

function screenFor(route) {
  const [first, second] = route.parts;
  switch (first) {
    case undefined: return <Home />;
    case 'animaux': return <Animals selectedId={second} />;
    case 'vallee': return <Valley />;
    case 'potager': case 'peche': case 'cueillette': case 'mines': return <ResourceScreen kind={first} />;
    case 'recettes': return <Recipes selectedId={second} />;
    case 'garde-manger': return <Pantry />;
    case 'courses': return <Shopping />;
    case 'amitie': return <Friends />;
    case 'guide': return <Guide />;
    case 'reglages': return <Settings />;
    default: return <Home />;
  }
}

export function App() {
  const route = useRoute();
  const { state } = useStore();

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme || 'nuit';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', state.theme === 'chateau' ? '#F6F4FB' : '#14123A');
  }, [state.theme]);

  // Les rangées .chips n'ont pas de scrollbar visible et le tactile n'existe pas sur PC :
  // on convertit la molette verticale en défilement horizontal au survol.
  useEffect(() => {
    const onWheel = (e) => {
      if (e.deltaX !== 0) return;
      const row = e.target.closest?.('.chips');
      if (!row || row.scrollWidth <= row.clientWidth) return;
      row.scrollLeft += e.deltaY;
      e.preventDefault();
    };
    document.addEventListener('wheel', onWheel, { passive: false });
    return () => document.removeEventListener('wheel', onWheel);
  }, []);

  const path = route.path;
  const subActive = (href) => path === href.slice(1) || path.startsWith(href.slice(1) + '/');

  return (
    <div class="shell">
      <nav class="side-nav" aria-label="Navigation principale">
        <div class="brand"><img src="icon-192.png" alt="" />Dreamlight</div>
        {TABS.map((t) => (
          <Fragment key={t.href}>
            <a href={t.href} class={t.match(path) && !(SUB[t.href] || []).some(([h]) => subActive(h)) ? 'on' : ''}>
              <Icon name={t.icon} />{t.label}
            </a>
            {(SUB[t.href] || []).map(([h, l]) => (
              <a key={h} href={h} class={'sub' + (subActive(h) ? ' on' : '')}>{l}</a>
            ))}
          </Fragment>
        ))}
        <div class="spacer" />
        <a href="#/reglages" class={path.startsWith('/reglages') ? 'on' : ''}><Icon name="gear" />Réglages</a>
      </nav>

      <main class="main">{screenFor(route)}</main>

      <nav class="bottom-nav" aria-label="Navigation principale">
        {TABS.map((t) => (
          <a key={t.href} href={t.href} class={t.match(path) ? 'on' : ''}>
            <Icon name={t.icon} size={24} />{t.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
