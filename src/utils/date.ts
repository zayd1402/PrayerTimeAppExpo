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
