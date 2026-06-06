/**
 * Timezone service for accurate prayer time calculations.
 * Returns the device's current UTC offset in hours.
 */

export function getTimezoneOffset(date: Date = new Date()): number {
  // getTimezoneOffset returns minutes WEST of UTC (positive = behind UTC)
  // We want hours EAST of UTC (positive = ahead of UTC) for the prayer calc
  return -date.getTimezoneOffset() / 60;
}

export function getTimezoneOffsetMinutes(date: Date = new Date()): number {
  return -date.getTimezoneOffset();
}

export function getTimezoneName(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
