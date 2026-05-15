/* eslint-disable import/first */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const calendarMock = vi.hoisted(() => ({
  getCalendarPermissionsAsync: vi.fn(),
  requestCalendarPermissionsAsync: vi.fn(),
  getCalendarsAsync: vi.fn(),
  getEventsAsync: vi.fn(),
  EntityTypes: { EVENT: 'event' },
}));

vi.mock('expo-calendar', () => calendarMock);

import { getDeviceCalendarEventsForDay, requestDeviceCalendarPermission } from './CalendarIntegrationService';

describe('CalendarIntegrationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not load events when calendar permission is denied', async () => {
    calendarMock.getCalendarPermissionsAsync.mockResolvedValue({ granted: false });
    calendarMock.requestCalendarPermissionsAsync.mockResolvedValue({ granted: false });

    await expect(requestDeviceCalendarPermission()).resolves.toBe(false);
    await expect(getDeviceCalendarEventsForDay(new Date('2026-05-15T12:00:00'))).resolves.toEqual([]);

    expect(calendarMock.getEventsAsync).not.toHaveBeenCalled();
  });

  it('normalizes and sorts device calendar events for the selected day', async () => {
    calendarMock.getCalendarPermissionsAsync.mockResolvedValue({ granted: true });
    calendarMock.getCalendarsAsync.mockResolvedValue([
      { id: 'work', title: 'Work', color: '#224488' },
      { id: 'home', title: 'Home', color: '#118855' },
    ]);
    calendarMock.getEventsAsync.mockResolvedValue([
      {
        id: 'late',
        title: 'School pickup',
        startDate: '2026-05-15T16:00:00.000Z',
        endDate: '2026-05-15T16:30:00.000Z',
        calendarId: 'home',
        allDay: false,
      },
      {
        id: 'early',
        title: 'Standup',
        startDate: '2026-05-15T09:00:00.000Z',
        endDate: '2026-05-15T09:15:00.000Z',
        calendarId: 'work',
        allDay: false,
      },
    ]);

    const events = await getDeviceCalendarEventsForDay(new Date('2026-05-15T12:00:00'));

    const [, start, end] = calendarMock.getEventsAsync.mock.calls[0];
    expect(calendarMock.getEventsAsync.mock.calls[0][0]).toEqual(['work', 'home']);
    expect(start).toBeInstanceOf(Date);
    expect(end).toBeInstanceOf(Date);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(events.map(event => event.id)).toEqual(['early', 'late']);
    expect(events[0]).toMatchObject({
      title: 'Standup',
      calendarTitle: 'Work',
      calendarColor: '#224488',
      isAllDay: false,
    });
  });
});
