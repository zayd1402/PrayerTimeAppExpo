import * as Location from 'expo-location';

export interface LocationResult {
  latitude: number;
  longitude: number;
  name: string;
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

    return { latitude, longitude, name };
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

// Sydney default coordinates
export const DEFAULT_LOCATION: LocationResult = {
  latitude: -33.8688,
  longitude: 151.2093,
  name: 'Sydney, NSW',
};
