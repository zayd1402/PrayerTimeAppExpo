import { AppLocation } from '../types';
import { LocalMosque, LOCAL_MOSQUES } from '../data/mosques';

export interface NearbyMosque extends LocalMosque {
  distanceKm: number;
}

export function haversineKm(a: Pick<AppLocation, 'latitude' | 'longitude'>, b: Pick<AppLocation, 'latitude' | 'longitude'>): number {
  const radiusKm = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * radiusKm * Math.asin(Math.sqrt(h));
}

export function searchLocalMosques(query: string): LocalMosque[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return LOCAL_MOSQUES;

  return LOCAL_MOSQUES.filter(mosque => {
    const haystack = [
      mosque.name,
      mosque.city,
      mosque.state,
      mosque.address,
    ].join(' ').toLowerCase();
    return haystack.includes(normalized);
  });
}

export function getNearbyMosques(location: Pick<AppLocation, 'latitude' | 'longitude'>, radiusKm: number = 50): NearbyMosque[] {
  return LOCAL_MOSQUES
    .map(mosque => ({
      ...mosque,
      distanceKm: haversineKm(location, mosque),
    }))
    .filter(mosque => mosque.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function getNearestMosque(location: Pick<AppLocation, 'latitude' | 'longitude'>): NearbyMosque | undefined {
  return getNearbyMosques(location, Number.POSITIVE_INFINITY)[0];
}
