jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
jest.mock('expo', () => ({ requireOptionalNativeModule: () => null }));

import { getAlarmAccess, openExactAlarmSettings, openBatterySettings } from '../../modules/alarm-access';

describe('alarm access when the native module is missing (Expo Go, iOS, web)', () => {
  it('reports everything as fine so no prompt appears', () => {
    expect(getAlarmAccess()).toEqual({ supported: false, exactAlarms: true, batteryUnrestricted: true });
  });

  it('opening settings is a safe no-op', () => {
    expect(() => openExactAlarmSettings()).not.toThrow();
    expect(() => openBatterySettings()).not.toThrow();
  });
});
