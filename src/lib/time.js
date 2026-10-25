import { rangesOf } from '../data/critters.js';

export const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
export const DAYS_SHORT = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

const hourOf = (d) => d.getHours() + d.getMinutes() / 60;

// Plage en cours (ou null) pour une date donnée, en tenant compte des plages
// qui se prolongent d'un jour sur l'autre (ex. 12 h-24 h suivi de 0 h-12 h).
export function currentRange(schedule, date = new Date()) {
  const day = date.getDay();
  const h = hourOf(date);
  const r = rangesOf(schedule[day]).find(([a, b]) => h >= a && h < b);
  if (!r) return null;
  // Calcule la vraie fin en enchaînant sur les jours suivants si la plage finit à 24 h.
  let endDay = 0;
  let end = r[1];
  while (end === 24 && endDay < 7) {
    const next = rangesOf(schedule[(day + endDay + 1) % 7]);
    const cont = next.find(([a]) => a === 0);
    if (!cont) break;
    endDay += 1;
    end = cont[1];
  }
  return { endDay, end };
}

export function isAvailable(schedule, date = new Date()) {
  return !!currentRange(schedule, date);
}

// Libellé court : « Encore 18 min », « Jusqu'à 20:00 », « Jusqu'à demain 12:00 »…
export function availabilityLabel(schedule, date = new Date()) {
  const r = currentRange(schedule, date);
  if (r) {
    if (r.endDay >= 6) return { text: 'Toujours là', now: true };
    // Dernier jour de présence (endDay jours après aujourd'hui) et heure de fin.
    const startOfToday = new Date(date);
    startOfToday.setHours(0, 0, 0, 0);
    const endDate = new Date(startOfToday);
    endDate.setDate(endDate.getDate() + r.endDay);
    endDate.setMinutes(Math.round(r.end * 60));
    const mins = Math.round((endDate - date) / 60000);
    if (mins <= 90) return { text: `Encore ${mins} min`, urgent: true, now: true };
    const lastDay = (date.getDay() + r.endDay) % 7;
    const midnight = r.end === 24;
    const hh = String(Math.floor(r.end)).padStart(2, '0') + ':' + String(Math.round((r.end % 1) * 60)).padStart(2, '0');
    if (r.endDay === 0) return { text: midnight ? 'Jusqu’à minuit' : `Jusqu’à ${hh}`, now: true };
    if (r.endDay === 1) return { text: midnight ? 'Jusqu’à demain soir' : `Jusqu’à demain ${hh}`, now: true };
    return { text: midnight ? `Jusqu’à ${DAYS[lastDay]} soir` : `Jusqu’à ${DAYS[lastDay]} ${hh}`, now: true };
  }
  return { text: nextLabel(schedule, date), now: false };
}

// Prochaine apparition.
export function nextLabel(schedule, date = new Date()) {
  const day = date.getDay();
  const h = hourOf(date);
  for (let i = 0; i < 8; i++) {
    const d = (day + i) % 7;
    const ranges = rangesOf(schedule[d]).filter(([a]) => i > 0 || a > h);
    if (ranges.length) {
      const start = ranges[0][0];
      const hh = String(Math.floor(start)).padStart(2, '0') + ':00';
      if (i === 0) return `Revient à ${hh}`;
      if (i === 1) return start === 0 ? 'Revient demain' : `Revient demain à ${hh}`;
      return `Revient ${DAYS[d]}`;
    }
  }
  return 'Pas d’horaire connu';
}

// Une couleur est « rare aujourd'hui » si elle n'apparaît qu'un seul jour par semaine
// et que ce jour est aujourd'hui.
export function rareToday(schedule, date = new Date()) {
  const days = schedule.map((d) => rangesOf(d).length > 0);
  return days.filter(Boolean).length === 1 && days[date.getDay()];
}

// Date locale (et non UTC) : le jeu suit l'heure de l'appareil.
export function todayKey(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export function formatDuration(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m}` : `${h} h`;
}
