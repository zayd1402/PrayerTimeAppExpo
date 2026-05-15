import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';

const DUAS = [
  { id: '1', title: 'Morning Dua', arabic: 'اللهم إني أسألك العفو والعافية في الدنيا والآخرة', meaning: 'O Allah, I ask You for forgiveness and well-being in this world and the next' },
  { id: '2', title: 'Evening Dua', arabic: 'اللهم إني أعوذ بك من البخل وأعوذ بك من الجبن وأعوذ بك من أن نُرد إلى أرذل العمر', meaning: 'O Allah, I seek refuge in You from cowardice, from being brought back to the worst of life' },
  { id: '3', title: 'Before Sleep', arabic: 'باسمك ربي وضعت جنبي وبك أرفعه، فإن أمسكت نفسي فارحمها', meaning: 'In Your name my Lord, I lay my side down, and by You I raise it. If You take my soul, have mercy on it' },
  { id: '4', title: 'After Waking', arabic: 'الحمد لله الذي أحيانا ونعمنا ورزقنا وأفاض علينا', meaning: 'Praise be to Allah who gave us life, blessed us, and gave us abundantly' },
  { id: '5', title: 'Entering Mosque', arabic: 'اللهم افتح لي أبواب رحمتك', meaning: 'O Allah, open for me the doors of Your mercy' },
  { id: '6', title: 'Leaving Mosque', arabic: 'اللهم إني أسألك من فضلك', meaning: 'O Allah, I ask You of Your bounty' },
];

const SUNNAH_TRACKER = [
  { id: 'fajr-sunnah', name: 'Fajr Sunnah', rakah: 2 },
  { id: 'dhuhr-sunnah', name: 'Dhuhr Sunnah', rakah: 2 },
  { id: 'asr-sunnah', name: 'Asr Sunnah', rakah: 2 },
  { id: 'maghrib-sunnah', name: 'Maghrib Sunnah', rakah: 3 },
  { id: 'isha-sunnah', name: 'Isha Sunnah', rakah: 2 },
  { id: 'tahajjud', name: 'Tahajjud', rakah: 2 },
  { id: 'duha', name: 'Duha Prayer', rakah: 2 },
];

export default function WorshipScreen() {
  const [completedSunnah, setCompletedSunnah] = useState<Set<string>>(new Set());
  const [dhikr, setDhikr] = useState<{ subhanallah: number; alhamdulillah: number; allahuakbar: number }>({
    subhanallah: 0,
    alhamdulillah: 0,
    allahuakbar: 0,
  });

  function toggleSunnah(id: string) {
    setCompletedSunnah(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }

  function incrementDhikr(type: 'subhanallah' | 'alhamdulillah' | 'allahuakbar') {
    setDhikr(prev => ({ ...prev, [type]: prev[type] + 1 }));
  }

  function resetDhikr() {
    setDhikr({ subhanallah: 0, alhamdulillah: 0, allahuakbar: 0 });
  }

  const totalDhikr = dhikr.subhanallah + dhikr.alhamdulillah + dhikr.allahuakbar;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Worship Tracker</Text>
        <Text style={styles.subtitle}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </View>

      {/* Sunnah Tracker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sunnah & Optional Prayers</Text>
        <View style={styles.sunnahGrid}>
          {SUNNAH_TRACKER.map(item => {
            const completed = completedSunnah.has(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.sunnahCard, completed && styles.sunnahCardCompleted]}
                onPress={() => toggleSunnah(item.id)}
              >
                <Text style={styles.sunnahIcon}>{completed ? '✓' : '○'}</Text>
                <Text style={[styles.sunnahName, completed && styles.sunnahNameCompleted]}>{item.name}</Text>
                <Text style={styles.sunnahRakah}>{item.rakah} rakah</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Dhikr Counter */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dhikr Counter</Text>
          <TouchableOpacity onPress={resetDhikr}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.totalDhikr}>{totalDhikr}</Text>
        <Text style={styles.totalLabel}>total dhikr today</Text>

        <View style={styles.dhikrButtons}>
          <TouchableOpacity style={styles.dhikrButton} onPress={() => incrementDhikr('subhanallah')}>
            <Text style={styles.dhikrCount}>{dhikr.subhanallah}</Text>
            <Text style={styles.dhikrLabel}>SubhanAllah</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dhikrButton} onPress={() => incrementDhikr('alhamdulillah')}>
            <Text style={styles.dhikrCount}>{dhikr.alhamdulillah}</Text>
            <Text style={styles.dhikrLabel}>Alhamdulillah</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dhikrButton} onPress={() => incrementDhikr('allahuakbar')}>
            <Text style={styles.dhikrCount}>{dhikr.allahuakbar}</Text>
            <Text style={styles.dhikrLabel}>Allahu Akbar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* duas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Duas</Text>
        {DUAS.map(dua => (
          <View key={dua.id} style={styles.duaCard}>
            <Text style={styles.duaTitle}>{dua.title}</Text>
            <Text style={styles.duaArabic}>{dua.arabic}</Text>
            <Text style={styles.duaMeaning}>{dua.meaning}</Text>
          </View>
        ))}
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
    paddingBottom: 100,
  },
  header: {
    padding: 18,
    paddingTop: 60,
    backgroundColor: '#014836',
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
  section: {
    padding: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  resetText: {
    fontSize: 14,
    color: '#014836',
    marginBottom: 12,
  },
  sunnahGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sunnahCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  sunnahCardCompleted: {
    backgroundColor: '#E8F5F0',
  },
  sunnahIcon: {
    fontSize: 20,
    color: '#888',
    marginBottom: 6,
  },
  sunnahName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  sunnahNameCompleted: {
    color: '#014836',
  },
  sunnahRakah: {
    fontSize: 12,
    color: '#888',
  },
  totalDhikr: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#014836',
    textAlign: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  dhikrButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  dhikrButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  dhikrCount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#014836',
    marginBottom: 4,
  },
  dhikrLabel: {
    fontSize: 12,
    color: '#666',
  },
  duaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  duaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  duaArabic: {
    fontSize: 18,
    color: '#014836',
    textAlign: 'right',
    marginBottom: 8,
    lineHeight: 28,
  },
  duaMeaning: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});