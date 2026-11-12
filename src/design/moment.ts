// The one timely suggestion shown on Today and Library: Jumu'ah, Ramadan, a sacred day coming up,
// or, on an ordinary day, the hadith or lesson of the day.
import { getRamadanState } from '../services/RamadanService';
import { getUpcomingSacredPeriods } from '../services/SacredTimeService';
import type { SubPage } from '../navigation/routes';

export interface Moment {
  kicker: string;
  title: string;
  body?: string;
  route?: SubPage;
}

/** A special occasion for this date, or null on an ordinary day. */
export function getSpecialMoment(date: Date = new Date()): Moment | null {
  const day = date.getDay();
  if (day === 4) {
    return { kicker: "Tomorrow is Jumu'ah", title: 'Read Surah Al-Kahf from Maghrib tonight', body: 'Friday begins at sunset.', route: 'friday' };
  }
  if (day === 5) {
    return { kicker: "Jumu'ah Mubarak", title: 'Read Surah Al-Kahf before Maghrib', body: 'And send salawat on the Prophet ﷺ often today.', route: 'friday' };
  }
  const ramadan = getRamadanState();
  if (ramadan.isRamadan) {
    return {
      kicker: `Ramadan, day ${ramadan.ramadanDay}`,
      title: ramadan.isLast10Nights ? 'Seek Laylat al-Qadr tonight' : 'Keep your fast, Quran and taraweeh',
      route: 'ramadan',
    };
  }
  const sacred = getUpcomingSacredPeriods(14)[0];
  if (sacred) {
    return {
      kicker: sacred.isActive ? 'Today' : sacred.daysUntil === 1 ? 'Tomorrow' : `In ${sacred.daysUntil} days`,
      title: sacred.title,
      body: sacred.description,
      route: 'calendar',
    };
  }
  return null;
}
