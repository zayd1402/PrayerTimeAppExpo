import * as Calendar from 'expo-calendar';

import { CalendarEventSummary } from '../types';

export type DeviceCalendarSummary = {
  id: string;
  title: string;
  color: string;
};

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export async function requestDeviceCalendarPermission(): Promise<boolean> {
  const current = await Calendar.getCalendarPermissionsAsync();
  if (current.granted) return true;
  const next = await Calendar.requestCalendarPermissionsAsync();
  return next.granted;
}

export async function hasDeviceCalendarPermission(): Promise<boolean> {
  const current = await Calendar.getCalendarPermissionsAsync();
  return current.granted;
}

export async function getDeviceCalendars(): Promise<DeviceCalendarSummary[]> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  return calendars.map(calendar => ({
    id: calendar.id,
    title: calendar.title || 'Calendar',
    color: calendar.color || '#B88420',
  }));
}

export async function getDeviceCalendarEventsForDay(
  date: Date,
  visibleCalendarIds?: string[]
): Promise<CalendarEventSummary[]> {
  const granted = await requestDeviceCalendarPermission();
  if (!granted) return [];

  const calendars = await getDeviceCalendars();
  const calendarIds = visibleCalendarIds?.length
    ? visibleCalendarIds
    : calendars.map(calendar => calendar.id);

  if (!calendarIds.length) return [];

  const calendarLookup = new Map(calendars.map(calendar => [calendar.id, calendar]));
  const events = await Calendar.getEventsAsync(calendarIds, startOfDay(date), endOfDay(date));

  return events
    .map(event => {
      const calendar = calendarLookup.get(event.calendarId);
      return {
        id: event.id,
        title: event.title || 'Busy',
        startDate: String(event.startDate),
        endDate: String(event.endDate),
        calendarTitle: calendar?.title || 'Calendar',
        calendarColor: calendar?.color || '#B88420',
        isAllDay: Boolean(event.allDay),
      };
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}
