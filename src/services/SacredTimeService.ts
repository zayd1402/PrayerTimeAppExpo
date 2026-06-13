import { HijriService } from './HijriService';
import { ISLAMIC_EVENTS } from '../data/islamicEvents';

export interface SacredPeriod {
  id: string;
  title: string;
  description: string;
  descriptionArabic: string;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
  daysUntil: number;
  icon: string;
  type: 'fasting' | 'eid' | 'hajj' | 'prayer' | 'general' | 'quran';
}

export function getUpcomingSacredPeriods(maxDays: number = 60): SacredPeriod[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const periods: SacredPeriod[] = [];

  for (const event of ISLAMIC_EVENTS) {
    // Convert Hijri date to approximate Gregorian for this year
    const gregDate = hijriDateToApproxGreg(event.hijriDate.day, event.hijriDate.month);
    if (!gregDate) continue;

    const diffTime = gregDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= -10 && diffDays <= maxDays) {
      const isActive = diffDays <= 0 && diffDays >= -3;
      periods.push({
        id: event.id,
        title: event.title,
        description: event.description || '',
        descriptionArabic: event.descriptionArabic || event.description || '',
        startDate: gregDate,
        endDate: null,
        isActive,
        daysUntil: Math.max(0, diffDays),
        icon: getEventIcon(event.type),
        type: getEventType(event.type),
      });
    }
  }

  return periods.sort((a, b) => a.daysUntil - b.daysUntil);
}

function hijriDateToApproxGreg(day: number, month: number): Date | null {
  if (month === 0) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), day);
  }
  const todayHijri = HijriService.gregorianToHijri(new Date());
  return HijriService.hijriToGregorian(todayHijri.year, month, day);
}

function getEventIcon(type: string): string {
  const icons: Record<string, string> = {
    ramadan: 'moon-outline',
    eid: 'gift-outline',
    hajj: 'airplane-outline',
    ashura: 'flame-outline',
    mawlid: 'heart-outline',
    laylatul_qadr: 'star-outline',
    white_days: 'sunny-outline',
    jumuah: 'time-outline',
    general: 'calendar-outline',
  };
  return icons[type] || 'calendar-outline';
}

function getEventType(type: string): SacredPeriod['type'] {
  if (type === 'ramadan' || type === 'white_days' || type === 'ashura') return 'fasting';
  if (type === 'eid') return 'eid';
  if (type === 'hajj') return 'hajj';
  if (type === 'laylatul_qadr') return 'prayer';
  if (type === 'jumuah') return 'prayer';
  return 'general';
}
