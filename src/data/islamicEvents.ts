import { IslamicEvent } from '../types';

export const ISLAMIC_EVENTS: IslamicEvent[] = [
  { id: 'ramadan', title: 'Ramadan', titleArabic: 'رمضان', hijriDate: { day: 1, month: 9 }, type: 'ramadan', description: 'The blessed month of fasting', descriptionArabic: 'شهر الصيام المبارك', isFixedHijri: true },
  { id: 'eid-fitr', title: 'Eid al-Fitr', titleArabic: 'عيد الفطر', hijriDate: { day: 1, month: 10 }, type: 'eid', description: 'Festival of breaking the fast', descriptionArabic: 'عيد الإفطار', isFixedHijri: true },
  { id: 'arafah', title: 'Day of Arafah', titleArabic: 'يوم عرفة', hijriDate: { day: 9, month: 12 }, type: 'hajj', description: 'The best day of the year', descriptionArabic: 'أفضل أيام السنة', isFixedHijri: true },
  { id: 'eid-adha', title: 'Eid al-Adha', titleArabic: 'عيد الأضحى', hijriDate: { day: 10, month: 12 }, type: 'eid', description: 'Festival of sacrifice', descriptionArabic: 'عيد الأضحى المبارك', isFixedHijri: true },
  { id: 'ashura', title: 'Ashura', titleArabic: 'عاشوراء', hijriDate: { day: 10, month: 1 }, type: 'ashura', description: '10th of Muharram - fasting recommended', descriptionArabic: 'صيام يوم عاشوراء', isFixedHijri: true },
  { id: 'mawlid', title: 'Mawlid al-Nabi', titleArabic: 'المولد النبوي', hijriDate: { day: 12, month: 3 }, type: 'mawlid', description: 'Birth of Prophet Muhammad ﷺ', descriptionArabic: 'مولد النبي محمد ﷺ', isFixedHijri: true },
  { id: 'isra', title: 'Isra and Mi\'raj', titleArabic: 'الإسراء والمعراج', hijriDate: { day: 27, month: 7 }, type: 'general', description: 'The Night Journey', descriptionArabic: 'رحلة الإسراء والمعراج', isFixedHijri: true },
  { id: 'laylat-qadr', title: 'Laylat al-Qadr', titleArabic: 'ليلة القدر', hijriDate: { day: 27, month: 9 }, type: 'laylatul_qadr', description: 'Night of Decree - better than 1000 months', descriptionArabic: 'خير من ألف شهر', isFixedHijri: true },
  { id: 'white-1', title: 'White Days', titleArabic: 'أيام البيض', hijriDate: { day: 13, month: 0 }, type: 'white_days', description: '13th of Hijri month - fasting recommended', descriptionArabic: 'صيام الأيام البيض', isFixedHijri: true },
  { id: 'white-2', title: 'White Days', titleArabic: 'أيام البيض', hijriDate: { day: 14, month: 0 }, type: 'white_days', description: '14th of Hijri month - fasting recommended', descriptionArabic: 'صيام الأيام البيض', isFixedHijri: true },
  { id: 'white-3', title: 'White Days', titleArabic: 'أيام البيض', hijriDate: { day: 15, month: 0 }, type: 'white_days', description: '15th of Hijri month - fasting recommended', descriptionArabic: 'صيام الأيام البيض', isFixedHijri: true },
];

export function getEventsForHijriDate(day: number, month: number): IslamicEvent[] {
  return ISLAMIC_EVENTS.filter(e => {
    if (e.hijriDate.month === 0) {
      // White days apply to all months
      return e.hijriDate.day === day;
    }
    return e.hijriDate.day === day && e.hijriDate.month === month;
  });
}

export function getUpcomingEvents(_daysAhead: number = 30): IslamicEvent[] {
  // Simplified - in production would calculate actual Hijri dates
  return ISLAMIC_EVENTS.slice(0, 3);
}
