// Works out what Today should show at a given minute: the sky colour, the prayer that is
// open now, the next one, and the hero text. Pure, so it can be tested without React.
import type { PrayerId } from '../types';
import type { SkyState } from './palette';

export const FIVE: PrayerId[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export type Status = 'prayed' | 'qaza' | 'missed' | undefined;

export interface DayTimes {
  fajr: number;
  sunrise: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export interface DayState {
  sky: SkyState;
  /** The prayer whose time is open now, if any. Between sunrise and Dhuhr nothing is open. */
  open: PrayerId | null;
  /** Minute the open prayer's window ends (sunrise for Fajr, the next prayer otherwise). */
  openEnds: number | null;
  next: PrayerId;
  /** Minutes until the next prayer starts. */
  untilNext: number;
  /** True when the next prayer is tomorrow's Fajr. */
  nextIsTomorrow: boolean;
  hero: {
    mode: 'now' | 'next';
    prayer: PrayerId;
    /** Minutes for the countdown on the right. */
    minutes: number;
  };
}

const DAY = 24 * 60;

export function computeDayState(times: DayTimes, now: number, statuses: Partial<Record<PrayerId, Status>>): DayState {
  let sky: SkyState;
  let open: PrayerId | null = null;
  let openEnds: number | null = null;

  if (now < times.fajr) {
    sky = 'night';
  } else if (now < times.sunrise) {
    sky = 'dawn'; open = 'fajr'; openEnds = times.sunrise;
  } else if (now < times.dhuhr) {
    sky = 'day';
  } else if (now < times.asr) {
    sky = 'day'; open = 'dhuhr'; openEnds = times.asr;
  } else if (now < times.maghrib) {
    sky = 'golden'; open = 'asr'; openEnds = times.maghrib;
  } else if (now < times.isha) {
    sky = 'maghrib'; open = 'maghrib'; openEnds = times.isha;
  } else {
    sky = 'night'; open = 'isha'; openEnds = times.fajr + DAY;
  }

  const upcoming = FIVE.find(id => times[id] > now);
  const next: PrayerId = upcoming ?? 'fajr';
  const nextIsTomorrow = !upcoming;
  const untilNext = nextIsTomorrow ? times.fajr + DAY - now : times[next] - now;

  const openDone = open ? isDone(statuses[open]) : true;
  const left = openEnds !== null ? openEnds - now : Infinity;
  // A short window that's still unlogged takes the hero, so "Now Fajr, 40m left" beats "Next Dhuhr".
  const hero: DayState['hero'] = open && !openDone && left <= 90
    ? { mode: 'now', prayer: open, minutes: left }
    : { mode: 'next', prayer: next, minutes: untilNext };

  return { sky, open, openEnds, next, untilNext, nextIsTomorrow, hero };
}

export function isDone(status: Status): boolean {
  return status === 'prayed' || status === 'qaza';
}

/** "2h 0m", "44m", "0m". */
export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
}

/** "4:23 PM" from minutes after midnight. */
export function formatClock(minutes: number, withPeriod = true): string {
  const m = ((Math.round(minutes) % DAY) + DAY) % DAY;
  const h24 = Math.floor(m / 60);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const mm = String(m % 60).padStart(2, '0');
  return withPeriod ? `${h12}:${mm} ${h24 < 12 ? 'AM' : 'PM'}` : `${h12}:${mm}`;
}

export function minutesOf(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}
