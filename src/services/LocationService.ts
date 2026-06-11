import * as Location from 'expo-location';
import { AppLocation, LocationSource } from '../types';

export interface LocationResult extends AppLocation {
  source: LocationSource;
}

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentLocation(): Promise<LocationResult | null> {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) return null;

  try {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = pos.coords;

    // Reverse geocode
    const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });

    let name = 'Current Location';
    if (address) {
      if (address.subregion) name = address.subregion;
      else if (address.region) name = address.region;
      else if (address.city) name = address.city;
      else if (address.country) name = address.country;
    }

    return { latitude, longitude, name, source: 'device', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
  } catch {
    return null;
  }
}

export async function getLocationName(latitude: number, longitude: number): Promise<string> {
  try {
    const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!address) return 'Unknown';
    if (address.subregion) return address.subregion;
    if (address.region) return address.region;
    if (address.city) return address.city;
    if (address.country) return address.country;
    return 'Unknown';
  } catch {
    return 'Unknown';
  }
}

// Manual fallback is intentionally disabled; callers must ask the user to enable location or choose a city.
