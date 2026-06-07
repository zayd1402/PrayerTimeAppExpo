import { HijriService } from './HijriService';

export interface RamadanState {
  isRamadan: boolean;
  isPreRamadan: boolean;
  isPostRamadan: boolean;
  ramadanDay: number;
  totalDays: number;
  isLast10Nights: boolean;
  currentNight: number;
  daysUntilRamadan: number;
  eidDaysLeft: number;
}

const RAMADAN_MONTH = 9;
const LAST_10_START = 21;
const RAMADAN_DAYS = 30;
const PRE_RAMADAN_WINDOW = 7;
const POST_RAMADAN_WINDOW = 7; // Shawwal 1-6 + Eid

export function getRamadanState(): RamadanState {
  const today = new Date();
  const hijri = HijriService.gregorianToHijri(today);

  const isRamadan = hijri.month === RAMADAN_MONTH;
  const ramadanDay = hijri.day;

  // Calculate days until Ramadan
  let daysUntilRamadan = 0;
  if (hijri.month < RAMADAN_MONTH) {
    // Before Ramadan — calculate days remaining
    for (let m = hijri.month; m < RAMADAN_MONTH; m++) {
      daysUntilRamadan += HijriService.getDaysInHijriMonth(1447, m + 1);
    }
    daysUntilRamadan -= hijri.day;
    daysUntilRamadan += 1;
  } else if (hijri.month > RAMADAN_MONTH) {
    // After Ramadan — calculate days until next Ramadan
    const daysLeftThisYear = getRemainingDaysThisYear(hijri);
    daysUntilRamadan = daysLeftThisYear + 1; // Approximate
  }

  const isPreRamadan = !isRamadan && daysUntilRamadan >= 0 && daysUntilRamadan <= PRE_RAMADAN_WINDOW;
  const isLast10Nights = isRamadan && ramadanDay >= LAST_10_START;
  const currentNight = isRamadan ? ramadanDay : 0;
  const isPostRamadan = hijri.month === 10 && hijri.day <= POST_RAMADAN_WINDOW;
  const eidDaysLeft = hijri.month === 10 ? Math.max(0, POST_RAMADAN_WINDOW - hijri.day) : 0;

  return {
    isRamadan,
    isPreRamadan,
    isPostRamadan,
    ramadanDay: isRamadan ? ramadanDay : 0,
    totalDays: RAMADAN_DAYS,
    isLast10Nights,
    currentNight,
    daysUntilRamadan,
    eidDaysLeft,
  };
}

function getRemainingDaysThisYear(hijri: { day: number; month: number; year: number }): number {
  let days = 0;
  for (let m = hijri.month; m <= 12; m++) {
    days += HijriService.getDaysInHijriMonth(hijri.year, m);
  }
  days -= hijri.day;
  return days;
}

// Khatm Planner — calculate pages per day
export function calculateKhatmPlan(targetKhatms: number, daysRemaining: number): { pagesPerDay: number; totalPages: number } {
  const PAGES_PER_KHATM = 604;
  const totalPages = targetKhatms * PAGES_PER_KHATM;
  const pagesPerDay = daysRemaining > 0 ? Math.ceil(totalPages / daysRemaining) : totalPages;
  return { pagesPerDay, totalPages };
}

// Suggest surah/juz based on current day
export function getTodayJuz(ramadanDay: number): number {
  if (ramadanDay < 1 || ramadanDay > 30) return 0;
  return ramadanDay;
}

// Night power score for last 10 nights (0-100)
export function getNightVirtue(ramadanDay: number): { score: number; label: string } {
  const oddNights = [21, 23, 25, 27, 29];
  if (oddNights.includes(ramadanDay)) {
    return { score: 100, label: 'Highly blessed night — intensify worship' };
  }
  if (ramadanDay >= 21) {
    return { score: 60, label: 'Last 10 nights — increase your worship' };
  }
  return { score: 30, label: 'Blessed month — keep going' };
}
