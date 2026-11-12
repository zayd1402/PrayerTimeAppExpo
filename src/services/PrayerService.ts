import { CalculationMethod, Madhab, PrayerId, PrayerTime, PRAYER_ICONS } from '../types';
import {
  CalculationMethod as CalculationMethod_,
  CalculationParameters,
  Coordinates,
  HighLatitudeRule,
  Madhab as AdhanMadhab,
  PrayerTimes,
} from 'adhan';
import { getTimezoneOffset } from './TimezoneService';

// ─── Constants ───────────────────────────────────────────────
const PRAYER_IDS_ORDER: PrayerId[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

const PRAYER_NAMES: Record<PrayerId, { name: string; arabic: string }> = {
  fajr:    { name: 'Fajr',    arabic: 'الفجر'    },
  sunrise: { name: 'Sunrise', arabic: 'الشروق'   },
  dhuhr:  { name: 'Dhuhr',   arabic: 'الظهر'     },
  asr:    { name: 'Asr',      arabic: 'العصر'     },
  maghrib:{ name: 'Maghrib',  arabic: 'المغرب'   },
  isha:   { name: 'Isha',     arabic: 'العشاء'   },
};

const ADHAN_METHODS: Record<CalculationMethod, () => CalculationParameters> = {
  muslim_world_league: () => CalculationMethod_.MuslimWorldLeague(),
  isna: () => CalculationMethod_.NorthAmerica(),
  north_america: () => CalculationMethod_.NorthAmerica(),
  egyptian: () => CalculationMethod_.Egyptian(),
  umm_al_qura: () => CalculationMethod_.UmmAlQura(),
  karachi: () => CalculationMethod_.Karachi(),
  dubai: () => CalculationMethod_.Dubai(),
  qatar: () => CalculationMethod_.Qatar(),
  kuwait: () => CalculationMethod_.Kuwait(),
  moonsighting_committee: () => CalculationMethod_.MoonsightingCommittee(),
  singapore: () => CalculationMethod_.Singapore(),
  tehran: () => CalculationMethod_.Tehran(),
  custom: () => CalculationMethod_.MuslimWorldLeague(),
};

export function getCalculationParameters(
  method: CalculationMethod,
  madhab: Madhab,
  latitude: number,
  longitude: number,
): CalculationParameters {
  const params = (ADHAN_METHODS[method] ?? ADHAN_METHODS.muslim_world_league)();
  params.madhab = madhab === 'hanafi' ? AdhanMadhab.Hanafi : AdhanMadhab.Shafi;
  // Keeps Fajr and Isha sensible where twilight never fully ends (e.g. UK summer).
  params.highLatitudeRule = HighLatitudeRule.recommended(new Coordinates(latitude, longitude));
  return params;
}

function toLocalMinutes(time: Date, tzOffsetHours: number): number {
  const utcMinutes = time.getUTCHours() * 60 + time.getUTCMinutes() + (time.getUTCSeconds() >= 30 ? 1 : 0);
  const local = Math.round(utcMinutes + tzOffsetHours * 60);
  return ((local % 1440) + 1440) % 1440;
}

// ─── Main Calculation ─────────────────────────────────────────
/**
 * Prayer times for the calendar day of `date` (its local year/month/day),
 * as minutes from local midnight. Uses the adhan library for the astronomy.
 */
export function calculatePrayerTimes(
  date: Date,
  latitude: number,
  longitude: number,
  method: CalculationMethod,
  madhab: Madhab
): Record<PrayerId, number> {
  const params = getCalculationParameters(method, madhab, latitude, longitude);
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const pt = new PrayerTimes(new Coordinates(latitude, longitude), day, params);
  // Offset at local noon of that day, so DST changes are applied per day.
  const tzOff = getTimezoneOffset(day);

  return {
    fajr: toLocalMinutes(pt.fajr, tzOff),
    sunrise: toLocalMinutes(pt.sunrise, tzOff),
    dhuhr: toLocalMinutes(pt.dhuhr, tzOff),
    asr: toLocalMinutes(pt.asr, tzOff),
    maghrib: toLocalMinutes(pt.maghrib, tzOff),
    isha: toLocalMinutes(pt.isha, tzOff),
  };
}

// ─── Formatters ──────────────────────────────────────────────
export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function minutesToDisplayMinutes(minutes: number): number {
  return minutes % 60;
}

export function minutesToDisplayHours(minutes: number): number {
  return Math.floor(minutes / 60) % 24;
}

// ─── Get Prayer Status ────────────────────────────────────────
export function getPrayerStatus(minutes: number, currentMinutes: number): 'upcoming' | 'active' | 'passed' {
  if (minutes > currentMinutes) return 'upcoming';
  // Within 30 minutes of prayer time = active
  if (minutes + 30 > currentMinutes) return 'active';
  return 'passed';
}

// ─── Full Prayer Times Object ────────────────────────────────
export function getPrayerTimesObject(
  date: Date,
  latitude: number,
  longitude: number,
  method: CalculationMethod,
  madhab: Madhab,
  currentMinutes?: number
): PrayerTime[] {
  const times = calculatePrayerTimes(date, latitude, longitude, method, madhab);
  const now = currentMinutes ?? (date.getHours() * 60 + date.getMinutes());

  return PRAYER_IDS_ORDER.map(id => {
    const minutes = times[id];
    const status = getPrayerStatus(minutes, now);
    return {
      id,
      name: PRAYER_NAMES[id].name,
      arabic: PRAYER_NAMES[id].arabic,
      icon: PRAYER_ICONS[id].icon,
      iconActive: PRAYER_ICONS[id].iconActive,
      time: minutesToTimeString(minutes),
      minutes,
      status,
    };
  });
}

// ─── Next Prayer ──────────────────────────────────────────────
export function getNextPrayer(
  times: PrayerTime[],
  currentMinutes: number
): PrayerTime | null {
  const prayers = times.filter(p => p.id !== 'sunrise');
  const upcoming = prayers.filter(p => p.minutes > currentMinutes);
  if (upcoming.length > 0) return upcoming[0];
  return prayers[0] ?? null;
}

export function getTimeUntilNext(nextPrayer: PrayerTime, currentMinutes: number): string {
  let diff = nextPrayer.minutes - currentMinutes;
  if (diff < 0) diff += 1440;
  if (diff <= 0) return '0m';
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ─── Qibla Direction ─────────────────────────────────────────
export function calculateQiblaDirection(latitude: number, longitude: number): number {
  // Kaaba coordinates
  const kaabaLat = 21.4225;
  const kaabaLon = 39.8264;

  const lat1 = (Math.PI / 180) * latitude;
  const lat2 = (Math.PI / 180) * kaabaLat;
  const dLon = (Math.PI / 180) * (kaabaLon - longitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  let bearing = Math.atan2(y, x) * (180 / Math.PI);
  bearing = (bearing + 360) % 360;
  return bearing;
}

export function bearingToCompassDirection(bearing: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(bearing / 22.5) % 16;
  return dirs[index];
}

// ─── Distance ───────────────────────────────────────────────
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (Math.PI / 180) * (lat2 - lat1);
  const dLon = (Math.PI / 180) * (lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos((Math.PI/180)*lat1) * Math.cos((Math.PI/180)*lat2) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
