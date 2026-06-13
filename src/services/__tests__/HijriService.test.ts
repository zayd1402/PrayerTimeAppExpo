import {
  gregorianToHijri,
  hijriToGregorian,
  getDaysInHijriMonth,
  formatHijriDate,
} from '../HijriService';

describe('HijriService', () => {
  describe('gregorianToHijri', () => {
    it('converts known Gregorian date to Hijri', () => {
      // 2024-01-01
      const hijri = gregorianToHijri(new Date(2024, 0, 1));
      expect(hijri.year).toBe(1445);
      expect(hijri.month).toBeGreaterThanOrEqual(1);
      expect(hijri.month).toBeLessThanOrEqual(12);
      expect(hijri.day).toBeGreaterThanOrEqual(1);
      expect(hijri.day).toBeLessThanOrEqual(30);
    });

    it('includes Arabic and English month names', () => {
      const hijri = gregorianToHijri(new Date(2024, 0, 1));
      expect(hijri.monthName).toBeTruthy();
      expect(hijri.monthNameArabic).toBeTruthy();
    });
  });

  describe('hijriToGregorian', () => {
    it('round-trips approximately through gregorianToHijri', () => {
      const original = new Date(2024, 5, 15);
      const hijri = gregorianToHijri(original);
      const recovered = hijriToGregorian(hijri.year, hijri.month, hijri.day);
      // Umm al-Qura conversions can differ by a day due to local-midnight boundaries
      const diff = Math.abs(recovered.getTime() - original.getTime());
      expect(diff).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    });

    it('converts a known Hijri date to the expected Gregorian year', () => {
      const date = hijriToGregorian(1445, 9, 1);
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBeGreaterThanOrEqual(2);
      expect(date.getMonth()).toBeLessThanOrEqual(3);
    });
  });

  describe('getDaysInHijriMonth', () => {
    it('returns 30 for odd months', () => {
      expect(getDaysInHijriMonth(1445, 1)).toBe(30);
      expect(getDaysInHijriMonth(1445, 9)).toBe(30);
    });

    it('returns 29 for even months', () => {
      expect(getDaysInHijriMonth(1445, 2)).toBe(29);
      expect(getDaysInHijriMonth(1445, 4)).toBe(29);
    });

    it('returns 30 for Dhu al-Hijjah in leap years', () => {
      // 1445 is a leap year under this approximation
      expect(getDaysInHijriMonth(1445, 12)).toBe(30);
    });
  });

  describe('formatHijriDate', () => {
    it('formats a Hijri date', () => {
      const formatted = formatHijriDate({
        day: 1,
        month: 9,
        year: 1445,
        monthName: 'Ramadan',
        monthNameArabic: 'رمضان',
      });
      expect(formatted).toBe('1 Ramadan 1445');
    });
  });
});
