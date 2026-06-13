import { getLocalDateKey } from '../utils/date';

describe('getLocalDateKey', () => {
  it('returns YYYY-MM-DD format', () => {
    const result = getLocalDateKey(new Date(2024, 0, 1));
    expect(result).toBe('2024-01-01');
  });

  it('pads single-digit months and days', () => {
    const result = getLocalDateKey(new Date(2024, 11, 5));
    expect(result).toBe('2024-12-05');
  });

  it('uses local timezone', () => {
    // January 1, 2024 00:00:00 local
    const result = getLocalDateKey(new Date(2024, 0, 1, 0, 0, 0));
    expect(result).toBe('2024-01-01');
  });
});
