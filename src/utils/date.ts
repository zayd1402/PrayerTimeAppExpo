export function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getHourMinute(minutes: number): { hour: number; minute: number } {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  return {
    hour: Math.floor(normalized / 60),
    minute: normalized % 60,
  };
}
