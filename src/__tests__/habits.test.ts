import { dayLevel, hasQaza, monthCells, monthInsight, prayerRates, rangeStats, settledDays, yearGridKeys } from '../design/habits';

const NOW = new Date(2026, 10, 12, 14, 0); // Thursday 12 November 2026

const log = {
  '2026-11-01': { fajr: 'prayed', dhuhr: 'prayed', asr: 'prayed', maghrib: 'prayed', isha: 'prayed' },
  '2026-11-02': { fajr: 'qaza', dhuhr: 'prayed', asr: 'prayed', maghrib: 'prayed', isha: 'prayed' },
  '2026-11-03': { fajr: 'missed', dhuhr: 'prayed', asr: 'prayed', maghrib: 'missed', isha: 'prayed' },
  '2026-11-12': { fajr: 'prayed' },
} as const;

describe('habits', () => {
  it('counts on-time and qaza prayers toward the heat level', () => {
    expect(dayLevel(log['2026-11-01'])).toBe(5);
    expect(dayLevel(log['2026-11-02'])).toBe(5);
    expect(dayLevel(log['2026-11-03'])).toBe(3);
    expect(dayLevel(undefined)).toBe(0);
    expect(hasQaza(log['2026-11-02'])).toBe(true);
  });

  it('lays out November 2026 starting on a Sunday with later days marked as future', () => {
    const cells = monthCells(2026, 10, log, NOW);
    expect(cells[0]?.date).toBe(1);
    expect(cells).toHaveLength(30);
    expect(cells[11]?.today).toBe(true);
    expect(cells[12]?.future).toBe(true);
    expect(cells[1]?.qaza).toBe(true);
  });

  it('rates each prayer over settled days and finds the weakest', () => {
    const keys = settledDays(2026, 10, NOW);
    expect(keys).toHaveLength(11);
    const rates = prayerRates(keys, log);
    expect(rates.find(r => r.id === 'dhuhr')?.onTime).toBe(3);
    const insight = monthInsight(rates, { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' });
    expect(insight?.lead).toBe('Fajr is the one to work on.');
  });

  it('builds a whole-week grid that ends on Saturday', () => {
    const keys = yearGridKeys(26, NOW);
    expect(keys).toHaveLength(182);
    expect(keys[keys.length - 1]).toBe('2026-11-14');
  });

  it('summarises a range', () => {
    const s = rangeStats(yearGridKeys(26, NOW), log, NOW);
    expect(s.fullDays).toBe(2);
    expect(s.loggedDays).toBe(4);
  });
});
