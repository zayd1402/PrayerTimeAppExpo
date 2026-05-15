import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';

interface PrayerTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

interface Prayer {
  id: string;
  name: string;
  arabicName: string;
  icon: string;
}

interface TodayScreenProps {
  prayerTimes: PrayerTimes;
  nextPrayer: Prayer | null;
  nextPrayerTime: Date | null;
  completedPrayers: Set<string>;
  locationName: string;
  hijriDate: string;
  timerDisplay: string;
  togglePrayer: (id: string) => void;
}

const PRAYERS: Prayer[] = [
  { id: 'fajr', name: 'Fajr', arabicName: 'الفجر', icon: '🌅' },
  { id: 'sunrise', name: 'Sunrise', arabicName: 'الشروق', icon: '☀️' },
  { id: 'dhuhr', name: 'Dhuhr', arabicName: 'الظهر', icon: '🕌' },
  { id: 'asr', name: 'Asr', arabicName: 'العصر', icon: '🌤️' },
  { id: 'maghrib', name: 'Maghrib', arabicName: 'المغرب', icon: '🌅' },
  { id: 'isha', name: 'Isha', arabicName: 'العشاء', icon: '🌙' },
];

const TRACKABLE = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function TodayScreen({
  prayerTimes,
  nextPrayer,
  nextPrayerTime,
  completedPrayers,
  locationName,
  hijriDate,
  timerDisplay,
  togglePrayer,
}: TodayScreenProps) {
  const entries = [
    { prayer: PRAYERS[0], time: prayerTimes.fajr },
    { prayer: PRAYERS[1], time: prayerTimes.sunrise },
    { prayer: PRAYERS[2], time: prayerTimes.dhuhr },
    { prayer: PRAYERS[3], time: prayerTimes.asr },
    { prayer: PRAYERS[4], time: prayerTimes.maghrib },
    { prayer: PRAYERS[5], time: prayerTimes.isha },
  ];

  const completedCount = TRACKABLE.filter(id => completedPrayers.has(id)).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.locationText}>{locationName}</Text>
            <Text style={styles.nextPrayerText}>
              {nextPrayer ? nextPrayer.name : 'All Complete'}
            </Text>
            <Text style={styles.nextPrayerTime}>
              {nextPrayer && nextPrayerTime ? `at ${formatTime(nextPrayerTime)}` : 'All prayers tracked'}
            </Text>
          </View>
          <View style={styles.crescent}>
            <Text style={styles.crescentIcon}>☪</Text>
          </View>
        </View>
        
        {nextPrayerTime && (
          <Text style={styles.timerText}>{timerDisplay}</Text>
        )}

        <View style={styles.progressRow}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(completedCount / 5) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{completedCount}/5</Text>
        </View>
      </View>

      {/* Hijri Date */}
      <Text style={styles.hijriText}>{hijriDate}</Text>

      {/* Prayer List */}
      <View style={styles.prayerList}>
        {entries.map(({ prayer, time }) => {
          const isTrackable = TRACKABLE.includes(prayer.id);
          const isCompleted = completedPrayers.has(prayer.id);
          const isNext = nextPrayer?.id === prayer.id;

          return (
            <View key={prayer.id} style={[styles.prayerRow, isNext && styles.prayerRowNext]}>
              <Text style={styles.prayerIcon}>{prayer.icon}</Text>
              <View style={styles.prayerInfo}>
                <Text style={[styles.prayerName, isNext && styles.prayerNameNext]}>
                  {prayer.name}
                </Text>
                <Text style={styles.prayerTimeText}>{formatTime(time)}</Text>
              </View>
              
              <View style={styles.prayerActions}>
                {isNext && isTrackable && (
                  <TouchableOpacity
                    style={styles.focusButton}
                    onPress={() => {}}
                  >
                    <Text style={styles.focusButtonText}>Focus</Text>
                  </TouchableOpacity>
                )}
                
                {isTrackable && (
                  <TouchableOpacity
                    onPress={() => togglePrayer(prayer.id)}
                  >
                    <Text style={[styles.checkIcon, isCompleted && styles.checkIconCompleted]}>
                      {isCompleted ? '✓' : '○'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  content: {
    padding: 18,
    paddingBottom: 100,
  },
  heroCard: {
    backgroundColor: '#014836',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  locationText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
    marginBottom: 4,
  },
  nextPrayerText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  nextPrayerTime: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    marginTop: 2,
  },
  crescent: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crescentIcon: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  timerText: {
    color: '#FDD370',
    fontSize: 34,
    fontWeight: '600',
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FDD370',
    borderRadius: 4,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  hijriText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginBottom: 16,
    fontWeight: '500',
  },
  prayerList: {
    gap: 8,
  },
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  prayerRowNext: {
    borderWidth: 1,
    borderColor: 'rgba(0,100,80,0.2)',
  },
  prayerIcon: {
    fontSize: 22,
    width: 34,
    height: 34,
    textAlign: 'center',
    lineHeight: 34,
  },
  prayerInfo: {
    flex: 1,
  },
  prayerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  prayerNameNext: {
    fontWeight: 'bold',
    color: '#014836',
  },
  prayerTimeText: {
    fontSize: 14,
    color: '#888',
    marginTop: 1,
  },
  prayerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  focusButton: {
    backgroundColor: '#E8F5F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  focusButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#014836',
  },
  checkIcon: {
    fontSize: 24,
    color: '#888',
  },
  checkIconCompleted: {
    color: '#01806A',
  },
});