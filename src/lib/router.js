import { useEffect, useRef, useState } from 'preact/hooks';

// Navigation par « # » : fonctionne sur GitHub Pages sans configuration serveur.
function parse() {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  const [path, query = ''] = hash.split('?');
  const parts = path.split('/').filter(Boolean);
  return { path: '/' + parts.join('/'), parts, query: new URLSearchParams(query) };
}

// Mémorise la position de défilement de chaque page visitée (en mémoire, pour la session) :
// un retour en arrière (lien « Retour », bouton précédent du navigateur) retrouve l'endroit
// exact où on en était, au lieu de remonter en haut à chaque fois.
const scrollMemory = new Map();

export function useRoute() {
  const [route, setRoute] = useState(parse());
  const pathRef = useRef(route.path);

  // Restaure la position connue de la nouvelle page une fois son contenu monté (sinon
  // scrollTo s'applique encore à l'ancienne page, pas assez haute pour y arriver).
  useEffect(() => {
    window.scrollTo(0, scrollMemory.get(route.path) || 0);
    pathRef.current = route.path;
  }, [route.path]);

  useEffect(() => {
    const fn = () => {
      scrollMemory.set(pathRef.current, window.scrollY);
      setRoute(parse());
    };
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);
  return route;
}

export function go(path) {
  window.location.hash = path;
}

export function useDesktop() {
  const mq = '(min-width: 960px)';
  const [desk, setDesk] = useState(() => window.matchMedia(mq).matches);
  useEffect(() => {
    const m = window.matchMedia(mq);
    const fn = () => setDesk(m.matches);
    m.addEventListener('change', fn);
    return () => m.removeEventListener('change', fn);
  }, []);
  return desk;
}

// Horloge qui se met à jour chaque minute (disponibilité des animaux, minuteurs).
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
