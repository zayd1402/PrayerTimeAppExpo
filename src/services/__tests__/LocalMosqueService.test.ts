import {
  haversineKm,
  searchLocalMosques,
  getNearbyMosques,
  getNearestMosque,
} from '../LocalMosqueService';
import { LOCAL_MOSQUES } from '../../data/mosques';

describe('LocalMosqueService', () => {
  describe('haversineKm', () => {
    it('returns ~0 for identical coordinates', () => {
      const loc = { latitude: -33.8688, longitude: 151.2093 };
      expect(haversineKm(loc, loc)).toBeCloseTo(0, 5);
    });

    it('returns a plausible distance between Sydney and Melbourne', () => {
      const sydney = { latitude: -33.8688, longitude: 151.2093 };
      const melbourne = { latitude: -37.8136, longitude: 144.9631 };
      const distance = haversineKm(sydney, melbourne);
      expect(distance).toBeGreaterThan(700);
      expect(distance).toBeLessThan(750);
    });
  });

  describe('searchLocalMosques', () => {
    it('returns all mosques for empty query', () => {
      expect(searchLocalMosques('')).toEqual(LOCAL_MOSQUES);
    });

    it('filters by name substring', () => {
      const results = searchLocalMosques('lakemba');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name.toLowerCase()).toContain('lakemba');
    });

    it('returns empty array for non-matching query', () => {
      expect(searchLocalMosques('xyznonexistent')).toEqual([]);
    });
  });

  describe('getNearbyMosques', () => {
    it('returns mosques within default radius', () => {
      const sydney = { latitude: -33.8688, longitude: 151.2093 };
      const results = getNearbyMosques(sydney);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].distanceKm).toBeLessThanOrEqual(50);
    });

    it('returns empty array when radius excludes all mosques', () => {
      const remote = { latitude: 0, longitude: 0 };
      const results = getNearbyMosques(remote, 1);
      expect(results).toEqual([]);
    });

    it('sorts results by distance ascending', () => {
      const sydney = { latitude: -33.8688, longitude: 151.2093 };
      const results = getNearbyMosques(sydney, 100);
      for (let i = 1; i < results.length; i++) {
        expect(results[i].distanceKm).toBeGreaterThanOrEqual(results[i - 1].distanceKm);
      }
    });
  });

  describe('getNearestMosque', () => {
    it('returns the closest mosque to a location', () => {
      const sydney = { latitude: -33.8688, longitude: 151.2093 };
      const nearest = getNearestMosque(sydney);
      expect(nearest).toBeDefined();
      expect(nearest!.distanceKm).toBeGreaterThanOrEqual(0);
    });
  });
});
