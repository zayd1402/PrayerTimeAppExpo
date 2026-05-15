import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import * as Location from 'expo-location';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface QiblaScreenProps {
  coordinate: Coordinate;
}

const MAKKAH_LAT = 21.4225;
const MAKKAH_LON = 39.8262;

export default function QiblaScreen({ coordinate }: QiblaScreenProps) {
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    calculateQibla();
    getDeviceHeading();
  }, []);

  function calculateQibla() {
    const { latitude, longitude } = coordinate;
    
    const lat1 = toRadians(latitude);
    const lon1 = toRadians(longitude);
    const lat2 = toRadians(MAKKAH_LAT);
    const lon2 = toRadians(MAKKAH_LON);

    const dLon = lon2 - lon1;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    
    let qibla = Math.atan2(y, x);
    qibla = toDegrees(qibla);
    qibla = (qibla + 360) % 360;
    
    setQiblaDirection(qibla);
  }

  async function getDeviceHeading() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const subscription = await Location.watchHeadingAsync((heading) => {
        setDeviceHeading(heading.magneticHeading);
        // Calculate relative direction
        const relative = qiblaDirection - heading.magneticHeading;
        setRotation((relative + 360) % 360);
      });

      return () => subscription.remove();
    } catch (error) {
      console.log('Heading not available');
    }
  }

  function toRadians(deg: number): number {
    return deg * (Math.PI / 180);
  }

  function toDegrees(rad: number): number {
    return rad * (180 / Math.PI);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Qibla Direction</Text>
        <Text style={styles.subtitle}>
          {Math.round(qiblaDirection)}° from North
        </Text>
      </View>

      <View style={styles.compassContainer}>
        <View style={styles.compass}>
          {/* Compass rings */}
          <View style={[styles.compassRing, styles.ring1]} />
          <View style={[styles.compassRing, styles.ring2]} />
          <View style={[styles.compassRing, styles.ring3]} />
          
          {/* Direction markers */}
          <Text style={[styles.directionMarker, styles.north]}>N</Text>
          <Text style={[styles.directionMarker, styles.east]}>E</Text>
          <Text style={[styles.directionMarker, styles.south]}>S</Text>
          <Text style={[styles.directionMarker, styles.west]}>W</Text>
          
          {/* Compass needle pointing to Qibla */}
          <View style={[styles.needleContainer, { transform: [{ rotate: `${rotation}deg` }] }]}>
            <Text style={styles.needle}>🕌</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How to use</Text>
        <Text style={styles.infoText}>
          Hold your phone flat and point the 🕌 icon towards the direction shown. 
          The compass needle will point towards Makkah.
        </Text>
      </View>

      <View style={styles.locationInfo}>
        <Text style={styles.locationLabel}>Your location</Text>
        <Text style={styles.locationValue}>
          {coordinate.latitude.toFixed(4)}°, {coordinate.longitude.toFixed(4)}°
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  header: {
    padding: 18,
    paddingTop: 60,
    backgroundColor: '#014836',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  compassContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compass: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  compassRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,100,80,0.1)',
  },
  ring1: { width: 220, height: 220 },
  ring2: { width: 180, height: 180 },
  ring3: { width: 140, height: 140 },
  directionMarker: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#014836',
  },
  north: { top: 12, color: '#E53935' },
  east: { right: 12 },
  south: { bottom: 12 },
  west: { left: 12 },
  needleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  needle: {
    fontSize: 48,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    margin: 18,
    marginTop: 0,
    borderRadius: 16,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  locationInfo: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  locationLabel: {
    fontSize: 12,
    color: '#888',
  },
  locationValue: {
    fontSize: 14,
    color: '#014836',
    fontWeight: '600',
  },
});