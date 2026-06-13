// ─── Hijri Calendar Conversion ───────────────────────────────
// Based on the Umm al-Qura calendar conversion algorithm

const HIJRI_MONTHS_EN = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', 'Dhu al-Qidah', 'Dhu al-Hijjah',
];

const HIJRI_MONTHS_AR = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
  'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة',
];

export interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthName: string;
  monthNameArabic: string;
}

function julianDayToHijri(jd: number): HijriDate {
  // Convert Julian Day to Hijri
  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
            Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
       Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const m = Math.floor(24 * l / 709);
  const day = l - Math.floor(709 * m / 24);
  const y = Math.floor(30 * n + j - 30);
  const month = m;
  const year = y;

  return {
    day,
    month,
    year,
    monthName: HIJRI_MONTHS_EN[month - 1],
    monthNameArabic: HIJRI_MONTHS_AR[month - 1],
  };
}

function gregorianToJulianDay(date: Date): number {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;

  return d + Math.floor((153 * m2 + 2) / 5) + 365 * y2 +
         Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045;
}

export function gregorianToHijri(date: Date): HijriDate {
  const jd = gregorianToJulianDay(date);
  return julianDayToHijri(jd);
}

export function hijriToGregorian(hijriYear: number, hijriMonth: number, hijriDay: number): Date {
  // Approximate days since the Hijri epoch (16 July 622 CE). This estimate is
  // within a few days of the true Umm al-Qura date, which is refined by binary
  // searching against the exact gregorianToHijri conversion.
  const hijriEpoch = new Date(622, 6, 16);
  const daysSinceEpoch =
    (hijriYear - 1) * 354 +
    Math.floor(((hijriYear - 1) * 11) / 30) +
    Math.ceil(29.5 * (hijriMonth - 1)) +
    (hijriDay - 1);

  const msPerDay = 24 * 60 * 60 * 1000;
  const estimate = hijriEpoch.getTime() + daysSinceEpoch * msPerDay;
  let low = new Date(estimate - 30 * msPerDay);
  let high = new Date(estimate + 30 * msPerDay);

  const minDate = new Date(1900, 0, 1);
  const maxDate = new Date(2100, 0, 1);
  if (low < minDate) low = minDate;
  if (high > maxDate) high = maxDate;

  const targetKey = `${hijriYear}-${hijriMonth}-${hijriDay}`;
  let best: Date | null = null;
  let left = low.getTime();
  let right = high.getTime();

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    const candidate = new Date(mid);
    const candidateHijri = gregorianToHijri(candidate);
    const candidateKey = `${candidateHijri.year}-${candidateHijri.month}-${candidateHijri.day}`;

    if (candidateKey === targetKey) {
      best = candidate;
      right = mid - 1; // find earliest matching instant
    } else if (
      candidateHijri.year > hijriYear ||
      (candidateHijri.year === hijriYear && candidateHijri.month > hijriMonth) ||
      (candidateHijri.year === hijriYear && candidateHijri.month === hijriMonth && candidateHijri.day > hijriDay)
    ) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  return best ?? new Date(left);
}

// Get days in a Hijri month
export function getDaysInHijriMonth(hijriYear: number, hijriMonth: number): number {
  // Odd months have 30 days, even months have 29
  // Dhu al-Hijjah has 30 days in leap years
  const isLeapYear = (11 * hijriYear + 14) % 30 < 11;
  if (hijriMonth === 12 && isLeapYear) return 30;
  return hijriMonth % 2 === 1 ? 30 : 29;
}

// Get the first day of the month (0 = Saturday)
export function getFirstDayOfHijriMonth(hijriYear: number, hijriMonth: number): number {
  const jd = 1948440 - 1 +
             (hijriYear - 1) * 354 +
             Math.floor((3 + 11 * hijriYear) / 30) +
             Math.ceil(29.5 * (hijriMonth - 1)) +
             1;
  return (jd + 1) % 7; // 0 = Saturday in our system
}

export function formatHijriDate(hijri: HijriDate): string {
  return `${hijri.day} ${hijri.monthName} ${hijri.year}`;
}

export function formatHijriDateArabic(hijri: HijriDate): string {
  return `${hijri.day} ${hijri.monthNameArabic} ${hijri.year}`;
}

// Generate array of Hijri calendar days for a given Gregorian month
export function getMonthGrid(
  year: number,
  month: number // 0-indexed
): Array<{ gregorian: Date; hijri: HijriDate; isCurrentMonth: boolean }> {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday

  const grid: Array<{ gregorian: Date; hijri: HijriDate; isCurrentMonth: boolean }> = [];

  // Previous month fill
  const prevMonth = new Date(year, month, 0);
  const prevMonthDays = prevMonth.getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const date = new Date(year, month - 1, d);
    grid.push({ gregorian: date, hijri: gregorianToHijri(date), isCurrentMonth: false });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    grid.push({ gregorian: date, hijri: gregorianToHijri(date), isCurrentMonth: true });
  }

  // Next month fill to complete 6 rows (42 cells)
  const remaining = 42 - grid.length;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d);
    grid.push({ gregorian: date, hijri: gregorianToHijri(date), isCurrentMonth: false });
  }

  return grid;
}

// Alias for backward compatibility with PrayerService-style imports
export const HijriService = {
  gregorianToHijri,
  hijriToGregorian,
  getMonthGrid,
  getDaysInHijriMonth,
  getFirstDayOfHijriMonth,
  formatHijriDate,
  formatHijriDateArabic,
};
