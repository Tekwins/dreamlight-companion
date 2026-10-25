import { useEffect, useState } from 'preact/hooks';

// Navigation par « # » : fonctionne sur GitHub Pages sans configuration serveur.
function parse() {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  const [path, query = ''] = hash.split('?');
  const parts = path.split('/').filter(Boolean);
  return { path: '/' + parts.join('/'), parts, query: new URLSearchParams(query) };
}

export function useRoute() {
  const [route, setRoute] = useState(parse());
  useEffect(() => {
    const fn = () => { setRoute(parse()); window.scrollTo(0, 0); };
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
