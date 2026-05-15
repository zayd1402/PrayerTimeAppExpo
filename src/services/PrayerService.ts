import {
  CalculationMethod as AdhanCalculationMethod,
  Coordinates,
  HighLatitudeRule,
  Madhab as AdhanMadhab,
  PrayerTimes,
} from 'adhan';
import tzLookup from 'tz-lookup';
import { CalculationMethod, Madhab, PrayerId, PrayerTime } from '../types';

const PRAYER_IDS_ORDER: PrayerId[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

const PRAYER_NAMES: Record<PrayerId, { name: string; arabic: string }> = {
  fajr: { name: 'Fajr', arabic: 'الفجر' },
  sunrise: { name: 'Sunrise', arabic: 'الشروق' },
  dhuhr: { name: 'Dhuhr', arabic: 'الظهر' },
  asr: { name: 'Asr', arabic: 'العصر' },
  maghrib: { name: 'Maghrib', arabic: 'المغرب' },
  isha: { name: 'Isha', arabic: 'العشاء' },
};

const ADHAN_METHODS: Record<CalculationMethod, () => ReturnType<typeof AdhanCalculationMethod.Other>> = {
  muslim_world_league: AdhanCalculationMethod.MuslimWorldLeague,
  isna: AdhanCalculationMethod.NorthAmerica,
  egyptian: AdhanCalculationMethod.Egyptian,
  umm_al_qura: AdhanCalculationMethod.UmmAlQura,
  karachi: AdhanCalculationMethod.Karachi,
};

type TimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function getTimeParts(date: Date, timeZone: string): TimeParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const value = (type: string) => Number(parts.find(part => part.type === type)?.value ?? 0);
  const rawHour = value('hour');

  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: rawHour === 24 ? 0 : rawHour,
    minute: value('minute'),
  };
}

function getDateForTimeZone(date: Date, timeZone: string): Date {
  const parts = getTimeParts(date, timeZone);
  return new Date(parts.year, parts.month - 1, parts.day);
}

function formatTimeInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function minutesInTimeZone(date: Date, timeZone: string): number {
  const parts = getTimeParts(date, timeZone);
  return parts.hour * 60 + parts.minute;
}

function getPrayerDate(prayerTimes: PrayerTimes, prayerId: PrayerId): Date {
  switch (prayerId) {
    case 'fajr':
      return prayerTimes.fajr;
    case 'sunrise':
      return prayerTimes.sunrise;
    case 'dhuhr':
      return prayerTimes.dhuhr;
    case 'asr':
      return prayerTimes.asr;
    case 'maghrib':
      return prayerTimes.maghrib;
    case 'isha':
      return prayerTimes.isha;
  }
}

export function getTimeZoneForCoordinates(latitude: number, longitude: number): string {
  return tzLookup(latitude, longitude);
}

export function getCurrentMinutesForCoordinates(
  latitude: number,
  longitude: number,
  now: Date = new Date()
): number {
  return minutesInTimeZone(now, getTimeZoneForCoordinates(latitude, longitude));
}

export function calculatePrayerTimes(
  date: Date,
  latitude: number,
  longitude: number,
  method: CalculationMethod,
  madhab: Madhab
): Record<PrayerId, number> {
  const timeZone = getTimeZoneForCoordinates(latitude, longitude);
  const coordinates = new Coordinates(latitude, longitude);
  const params = ADHAN_METHODS[method]();
  params.madhab = madhab === 'hanafi' ? AdhanMadhab.Hanafi : AdhanMadhab.Shafi;
  params.highLatitudeRule = HighLatitudeRule.TwilightAngle;

  const prayerTimes = new PrayerTimes(coordinates, getDateForTimeZone(date, timeZone), params);

  return PRAYER_IDS_ORDER.reduce((result, id) => {
    result[id] = minutesInTimeZone(getPrayerDate(prayerTimes, id), timeZone);
    return result;
  }, {} as Record<PrayerId, number>);
}

export function minutesToTimeString(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function minutesToDisplayMinutes(minutes: number): number {
  return ((minutes % 60) + 60) % 60;
}

export function minutesToDisplayHours(minutes: number): number {
  return Math.floor((((minutes % 1440) + 1440) % 1440) / 60);
}

export function getPrayerStatus(minutes: number, currentMinutes: number): 'upcoming' | 'active' | 'passed' {
  if (minutes > currentMinutes) return 'upcoming';
  if (minutes + 30 > currentMinutes) return 'active';
  return 'passed';
}

export function getPrayerTimesObject(
  date: Date,
  latitude: number,
  longitude: number,
  method: CalculationMethod,
  madhab: Madhab,
  currentMinutes?: number
): PrayerTime[] {
  const timeZone = getTimeZoneForCoordinates(latitude, longitude);
  const coordinates = new Coordinates(latitude, longitude);
  const params = ADHAN_METHODS[method]();
  params.madhab = madhab === 'hanafi' ? AdhanMadhab.Hanafi : AdhanMadhab.Shafi;
  params.highLatitudeRule = HighLatitudeRule.TwilightAngle;

  const prayerTimes = new PrayerTimes(coordinates, getDateForTimeZone(date, timeZone), params);
  const now = currentMinutes ?? minutesInTimeZone(date, timeZone);

  return PRAYER_IDS_ORDER.map(id => {
    const prayerDate = getPrayerDate(prayerTimes, id);
    const minutes = minutesInTimeZone(prayerDate, timeZone);

    return {
      id,
      name: PRAYER_NAMES[id].name,
      arabic: PRAYER_NAMES[id].arabic,
      icon: '',
      iconActive: '',
      time: formatTimeInTimeZone(prayerDate, timeZone),
      minutes,
      status: getPrayerStatus(minutes, now),
    };
  });
}

export function getNextPrayer(
  times: PrayerTime[],
  currentMinutes: number
): PrayerTime | null {
  const candidates = times
    .filter(p => p.id !== 'sunrise')
    .map(prayer => {
      const adjustedMinutes = prayer.minutes > currentMinutes
        ? prayer.minutes
        : prayer.minutes + 1440;
      return {
        ...prayer,
        minutes: adjustedMinutes,
        status: 'upcoming' as const,
      };
    })
    .sort((a, b) => a.minutes - b.minutes);

  return candidates[0] ?? null;
}

export function getTimeUntilNext(nextPrayer: PrayerTime, currentMinutes: number): string {
  const diff = nextPrayer.minutes - currentMinutes;
  if (diff <= 0) return '0m';
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function calculateQiblaDirection(latitude: number, longitude: number): number {
  const kaabaLat = 21.4225;
  const kaabaLon = 39.8264;

  const lat1 = (Math.PI / 180) * latitude;
  const lat2 = (Math.PI / 180) * kaabaLat;
  const dLon = (Math.PI / 180) * (kaabaLon - longitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
}

export function bearingToCompassDirection(bearing: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(bearing / 22.5) % 16;
  return dirs[index];
}
