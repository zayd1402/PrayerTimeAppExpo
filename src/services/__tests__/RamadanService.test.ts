import {
  getRamadanState,
  calculateKhatmPlan,
  getTodayJuz,
  getNightVirtue,
} from '../RamadanService';

describe('RamadanService', () => {
  describe('getRamadanState', () => {
    it('returns a state object with expected keys', () => {
      const state = getRamadanState();
      expect(state).toHaveProperty('isRamadan');
      expect(state).toHaveProperty('isPreRamadan');
      expect(state).toHaveProperty('isPostRamadan');
      expect(state).toHaveProperty('ramadanDay');
      expect(state).toHaveProperty('totalDays');
      expect(state).toHaveProperty('isLast10Nights');
      expect(state).toHaveProperty('currentNight');
      expect(state).toHaveProperty('daysUntilRamadan');
      expect(state).toHaveProperty('eidDaysLeft');
    });

    it('has totalDays set to 30', () => {
      expect(getRamadanState().totalDays).toBe(30);
    });
  });

  describe('calculateKhatmPlan', () => {
    it('calculates pages per day for one khatm in 30 days', () => {
      const plan = calculateKhatmPlan(1, 30);
      expect(plan.totalPages).toBe(604);
      expect(plan.pagesPerDay).toBe(21);
    });

    it('falls back to total pages when no days remain', () => {
      const plan = calculateKhatmPlan(1, 0);
      expect(plan.pagesPerDay).toBe(604);
    });
  });

  describe('getTodayJuz', () => {
    it('returns the juz number for a valid Ramadan day', () => {
      expect(getTodayJuz(1)).toBe(1);
      expect(getTodayJuz(15)).toBe(15);
      expect(getTodayJuz(30)).toBe(30);
    });

    it('returns 0 for invalid days', () => {
      expect(getTodayJuz(0)).toBe(0);
      expect(getTodayJuz(31)).toBe(0);
    });
  });

  describe('getNightVirtue', () => {
    it('returns highest score for odd nights in last 10', () => {
      expect(getNightVirtue(27)).toEqual({
        score: 100,
        label: 'Highly blessed night — intensify worship',
      });
    });

    it('returns elevated score for non-odd last 10 nights', () => {
      expect(getNightVirtue(22)).toEqual({
        score: 60,
        label: 'Last 10 nights — increase your worship',
      });
    });

    it('returns base score for other Ramadan days', () => {
      expect(getNightVirtue(10)).toEqual({
        score: 30,
        label: 'Blessed month — keep going',
      });
    });
  });
});
