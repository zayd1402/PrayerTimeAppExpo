import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

interface AlarmAccessNative {
  canScheduleExactAlarms(): boolean;
  isIgnoringBatteryOptimizations(): boolean;
  openExactAlarmSettings(): void;
  openBatterySettings(): void;
}

// Missing in Expo Go and on iOS/web: every check then reports "fine" and the UI stays hidden.
const native = Platform.OS === 'android'
  ? requireOptionalNativeModule<AlarmAccessNative>('AlarmAccess')
  : null;

export interface AlarmAccessStatus {
  /** False only when we know the native check exists and says no. */
  supported: boolean;
  exactAlarms: boolean;
  batteryUnrestricted: boolean;
}

export function getAlarmAccess(): AlarmAccessStatus {
  if (!native) return { supported: false, exactAlarms: true, batteryUnrestricted: true };
  try {
    return {
      supported: true,
      exactAlarms: native.canScheduleExactAlarms(),
      batteryUnrestricted: native.isIgnoringBatteryOptimizations(),
    };
  } catch {
    return { supported: false, exactAlarms: true, batteryUnrestricted: true };
  }
}

export function openExactAlarmSettings(): void {
  native?.openExactAlarmSettings();
}

export function openBatterySettings(): void {
  native?.openBatterySettings();
}
