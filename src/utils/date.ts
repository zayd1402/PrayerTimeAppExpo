/**
 * Returns a YYYY-MM-DD string using the device's local timezone.
 * Prefer this over `toISOString().split('T')[0]` for prayer logs and
 * any UI that is tied to the user's local day.
 */
export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLocalDateFromKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Returns the local YYYY-MM-DD key `days` days before `date` (DST-safe). */
export function getLocalDateKeyDaysAgo(days: number, date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() - days);
  return getLocalDateKey(d);
}

/**
 * The local day a prayer belongs to, given when its notification was delivered.
 * Isha's time can run past midnight, so an Isha notification delivered in the
 * small hours (before noon) still belongs to the previous day.
 */
export function getPrayerDateKey(prayerId: string, deliveredAt: Date): string {
  if (prayerId === 'isha' && deliveredAt.getHours() < 12) {
    return getLocalDateKeyDaysAgo(1, deliveredAt);
  }
  return getLocalDateKey(deliveredAt);
}
