import { CalculationMethod, Madhab, PrayerId, PrayerTime, PRAYER_ICONS } from '../types';
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

// Method parameters: [fajr angle, isha angle/maghrib mins for Umm Al-Qura]
const METHOD_PARAMS: Record<CalculationMethod, [number, number]> = {
  muslim_world_league: [18,   17],    // Fajr 18°, Isha 17°
  isna:                [15,   15],    // Fajr 15°, Isha 15°
  egyptian:            [19.5, 17.5],  // Fajr 19.5°, Isha 17.5°
  umm_al_qura:        [18.5, 90],    // Fajr 18.5°, Isha 90min after Maghrib
  karachi:            [18,   18],    // Fajr 18°, Isha 18°
  dubai:              [18.5, 90],    // Fajr 18.5°, Isha 90min after Maghrib
  qatar:              [18,   90],    // Fajr 18°, Isha 90min after Maghrib
  kuwait:             [18,   17.5],  // Fajr 18°, Isha 17.5°
  moonsighting_committee: [18, 18], // Fajr 18°, Isha 18°
  singapore:          [20,   18],    // Fajr 20°, Isha 18°
  tehran:             [17.7, 14],    // Fajr 17.7°, Isha 14°
  north_america:      [15,   15],    // Fajr 15°, Isha 15° (ISNA)
  custom:             [18,   17],    // Default to MWL
};

// ─── Julian Date ─────────────────────────────────────────────
function getJulianDate(date: Date): number {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;

  return d + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045;
}

function getJulianCentury(jd: number): number {
  return (jd - 2451545.0) / 36525.0;
}

// ─── Solar Position ──────────────────────────────────────────
function getSunDeclination(jd: number): number {
  const T = getJulianCentury(jd);
  const L0 = 280.46646 + T * (36000.76983 + 0.0003032 * T);
  const M = 357.52911 + T * (35999.0503 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001264 * T);

  const C = Math.sin((Math.PI / 180) * M) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
            Math.sin((Math.PI / 180) * 2 * M) * (0.019993 - 0.000101 * T) +
            Math.sin((Math.PI / 180) * 3 * M) * 0.000289;

  const sunTrue = L0 + C;
  const sunApp = sunTrue - 0.00569 - 0.00478 * Math.sin((Math.PI / 180) * 23.439291 * (1 - T / 100));
  return Math.asin(Math.sin((Math.PI / 180) * sunApp) * Math.sin((Math.PI / 180) * 23.439291)) * (180 / Math.PI);
}

function getEquationOfTime(jd: number): number {
  const T = getJulianCentury(jd);
  const L0 = 280.46646 + T * (36000.76983 + 0.0003032 * T);
  const M = 357.52911 + T * (35999.0503 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001264 * T);
  const L = L0 + (1.914602 - T * (0.004817 + 0.000014 * T)) * Math.sin((Math.PI / 180) * M) +
            0.019993 * Math.sin((Math.PI / 180) * 2 * M) - 0.000289 * Math.sin((Math.PI / 180) * 3 * M);
  const obliq = 23.439291 - 0.0130042 * T;
  const y = Math.tan((Math.PI / 180) * obliq / 2) ** 2;
  const eot = y * Math.sin((Math.PI / 180) * 2 * L) - 2 * e * Math.sin((Math.PI / 180) * M) +
              4 * e * y * Math.sin((Math.PI / 180) * M) * Math.cos((Math.PI / 180) * 2 * L) -
              0.5 * y * y * Math.sin((Math.PI / 180) * 4 * L) - 1.25 * e * e * Math.sin((Math.PI / 180) * 2 * M);
  return eot * (180 / Math.PI) * 4; // minutes
}

// ─── Time Calculation ─────────────────────────────────────────
function computeTime(lat: number, decl: number, t: number): number {
  // lat = latitude, decl = declination, t = equation of time in minutes
  const latRad = (Math.PI / 180) * lat;
  const declRad = (Math.PI / 180) * decl;
  const cosHa = (Math.sin((Math.PI / 180) * -0.8333) - Math.sin(latRad) * Math.sin(declRad)) /
               (Math.cos(latRad) * Math.cos(declRad));
  if (cosHa > 1 || cosHa < -1) return 0;
  const haDeg = (180 / Math.PI) * Math.acos(cosHa);
  return (haDeg - t / 4) / 15; // hours from solar noon
}

function computeAsrTime(lat: number, decl: number, t: number, factor: number): number {
  const latRad = (Math.PI / 180) * lat;
  const declRad = (Math.PI / 180) * decl;
  const angle = Math.atan(1 / (factor + Math.tan(Math.abs(latRad - declRad))));
  const cosA = (Math.sin(angle) - Math.sin(latRad) * Math.sin(declRad)) / (Math.cos(latRad) * Math.cos(declRad));
  if (cosA > 1 || cosA < -1) return 0;
  const haDeg = (180 / Math.PI) * Math.acos(cosA);
  return (haDeg - t / 4) / 15;
}

function computeMaghrib(lat: number, decl: number, t: number): number {
  return computeTime(lat, decl, t);
}

// ─── Main Calculation ─────────────────────────────────────────
export function calculatePrayerTimes(
  date: Date,
  latitude: number,
  longitude: number,
  method: CalculationMethod,
  madhab: Madhab
): Record<PrayerId, number> { // minutes from midnight
  const jd = getJulianDate(date);
  const decl = getSunDeclination(jd);
  const eqt = getEquationOfTime(jd);

  // Time zone offset (device timezone — the only reliable method)
  const tzOff = getTimezoneOffset(date); // device timezone offset in hours

  const asrFactor = madhab === 'hanafi' ? 2 : 1;
  const longitudeCorrection = longitude / 15;

  const fajrAngle = METHOD_PARAMS[method][0];
  const ishaAngle = METHOD_PARAMS[method][1];

  const latRad = (Math.PI / 180) * latitude;

  // Fajr
  const fajrCos = (Math.sin((Math.PI / 180) * fajrAngle) - Math.sin(latRad) * Math.sin((Math.PI / 180) * decl)) /
                  (Math.cos(latRad) * Math.cos((Math.PI / 180) * decl));
  const fajrHaDeg = (fajrCos >= -1 && fajrCos <= 1) ? (180 / Math.PI) * Math.acos(fajrCos) : 0;
  const fajrHour = 12 + tzOff - longitudeCorrection - eqt / 60 - fajrHaDeg / 15;

  // Sunrise
  const sunriseHour = computeTime(latitude, decl, eqt) + tzOff - longitudeCorrection;

  // Dhuhr
  const dhuhrHour = 12 + tzOff - longitudeCorrection - eqt / 60;

  // Asr
  const asrHour = computeAsrTime(latitude, decl, eqt, asrFactor) + tzOff - longitudeCorrection;

  // Maghrib
  const maghribHour = computeMaghrib(latitude, decl, eqt) + tzOff - longitudeCorrection;

  // Isha
  let ishaHour: number;
  if (ishaAngle >= 90) {
    // Minutes-after-Maghrib mode (e.g., Umm Al-Qura, Dubai, Qatar)
    ishaHour = maghribHour + ishaAngle / 60;
  } else {
    const ishaCos = (Math.sin((Math.PI / 180) * ishaAngle) - Math.sin(latRad) * Math.sin((Math.PI / 180) * decl)) /
                   (Math.cos(latRad) * Math.cos((Math.PI / 180) * decl));
    const ishaHaDeg = (ishaCos >= -1 && ishaCos <= 1) ? (180 / Math.PI) * Math.acos(ishaCos) : 0;
    ishaHour = 12 + tzOff - longitudeCorrection - eqt / 60 + ishaHaDeg / 15;
  }

  const times: Record<PrayerId, number> = {
    fajr:    Math.round(fajrHour * 60),
    sunrise: Math.round(sunriseHour * 60),
    dhuhr:   Math.round(dhuhrHour * 60),
    asr:     Math.round(asrHour * 60),
    maghrib: Math.round(maghribHour * 60),
    isha:    Math.round(ishaHour * 60),
  };

  // Handle negative values
  for (const key of Object.keys(times) as PrayerId[]) {
    if (times[key] < 0) times[key] += 1440;
    if (times[key] >= 1440) times[key] -= 1440;
  }

  return times;
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
