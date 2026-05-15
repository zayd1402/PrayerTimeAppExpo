import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Platform, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Design Tokens ───────────────────────────────────────────
const C = {
  bgBase:       '#FAF6EF',
  bgSurface:    '#FFFFFF',
  navy:         '#071A35',
  navySoft:     '#1A3560',
  gold:         '#B8892F',
  goldLight:    '#D4AF6A',
  goldPale:     '#F0E4C8',
  emerald:      '#0F7A4F',
  emeraldPale:  '#D4EDE1',
  textPrimary:  '#071A35',
  textSecondary:'#6B7280',
  textMuted:    '#9CA3AF',
  border:       'rgba(7,26,53,0.08)',
  borderStrong: 'rgba(7,26,53,0.15)',
};

// ─── Data ────────────────────────────────────────────────────
const PRAYERS = [
  { id: 'fajr',    name: 'Fajr',    arabic: 'الفجر',    time: '5:17 AM',  icon: 'sunny-outline',        status: 'ontime',  qaza: false },
  { id: 'sunrise', name: 'Sunrise', arabic: 'الشروق',   time: '6:42 AM',  icon: 'partly-sunny-outline', status: 'done',    qaza: false },
  { id: 'dhuhr',  name: 'Dhuhr',   arabic: 'الظهر',     time: '12:04 PM', icon: 'sun-outline',         status: 'qaza',    qaza: true  },
  { id: 'asr',    name: 'Asr',      arabic: 'العصر',     time: '3:48 PM',  icon: 'cloud-outline',       status: 'qaza',    qaza: true  },
  { id: 'maghrib',name: 'Maghrib',  arabic: 'المغرب',   time: '6:19 PM',  icon: 'sunset-outline',     status: 'qaza',    qaza: true  },
  { id: 'isha',   name: 'Isha',     arabic: 'العشاء',   time: '7:39 PM',  icon: 'moon-outline',        status: 'qaza',    qaza: true  },
];

const NAV_TABS = [
  { id: 'home',      label: 'Home',      icon: 'home-outline',         iconActive: 'home'         },
  { id: 'countdown', label: 'Countdown', icon: 'time-outline',          iconActive: 'time'         },
  { id: 'calendar',  label: 'Calendar',  icon: 'calendar-outline',      iconActive: 'calendar'     },
  { id: 'journey',   label: 'Journey',   icon: 'analytics-outline',     iconActive: 'analytics'   },
  { id: 'qibla',     label: 'Qibla',     icon: 'compass-outline',       iconActive: 'compass'      },
  { id: 'settings',  label: 'Settings',  icon: 'settings-outline',       iconActive: 'settings'     },
];

// ─── Home Screen ─────────────────────────────────────────────
function HomeScreen() {
  const [activePrayer] = useState('sunrise');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenPadding} showsVerticalScrollIndicator={false}>
      {/* Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroLabel}>Next Prayer</Text>
          <View style={styles.heroTimeRow}>
            <Text style={styles.heroTime}>5:17</Text>
            <Text style={styles.heroAmPm}>AM</Text>
          </View>
          <View style={styles.heroNextRow}>
            <View style={styles.heroDot} />
            <Text style={styles.heroNextText}>Fajr in 4h 23m</Text>
          </View>
        </View>
        <View style={styles.heroRight}>
          <View style={styles.progressRing}>
            <Text style={styles.progressPct}>70%</Text>
            <Text style={styles.progressDay}>of day</Text>
          </View>
        </View>
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>TODAY'S PRAYERS</Text>
        <Text style={styles.sectionLink}>View Calendar</Text>
      </View>

      {/* Prayer Rows */}
      {PRAYERS.map((prayer, i) => {
        const isActive = prayer.id === activePrayer;
        return (
          <View
            key={prayer.id}
            style={[
              styles.prayerRow,
              isActive && styles.prayerRowActive,
              i < PRAYERS.length - 1 && styles.prayerRowBorder,
            ]}
          >
            <View style={[styles.prayerIconWrap, isActive && styles.prayerIconActive]}>
              <Ionicons
                name={prayer.icon as any}
                size={18}
                color={isActive ? C.gold : C.navySoft}
              />
            </View>
            <View style={styles.prayerInfo}>
              <Text style={[styles.prayerName, isActive && styles.prayerNameActive]}>
                {prayer.name}
              </Text>
            </View>
            <Text style={[styles.prayerTime, isActive && styles.prayerTimeActive]}>
              {prayer.time}
            </Text>
            {prayer.status === 'done' && (
              <View style={styles.statusBadgeDone}><Text style={styles.statusTextDone}>Done</Text></View>
            )}
            {prayer.status === 'ontime' && (
              <View style={styles.statusBadgeOntime}><Text style={styles.statusTextOntime}>On time</Text></View>
            )}
            {prayer.status === 'qaza' && (
              <View style={styles.statusBadgeQaza}><Text style={styles.statusTextQaza}>Qaza</Text></View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

// ─── Countdown Screen ────────────────────────────────────────
function CountdownScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenPadding} showsVerticalScrollIndicator={false}>
      <View style={styles.cdHero}>
        <Text style={styles.cdLabel}>Time until Fajr</Text>
        <Text style={styles.cdTime}>4:23</Text>
        <Text style={styles.cdPrayer}>Fajr — 5:17 AM</Text>
        <View style={styles.cdDivider} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>UPCOMING PRAYERS</Text>
      </View>

      {[
        { time: '12:04', name: 'Dhuhr',   elapsed: '2h 41m' },
        { time: '3:48',  name: 'Asr',     elapsed: '6h 25m' },
        { time: '6:19',  name: 'Maghrib', elapsed: '8h 56m' },
        { time: '7:39',  name: 'Isha',    elapsed: '10h 16m' },
      ].map((p) => (
        <View key={p.name} style={styles.cdCard}>
          <Text style={styles.cdCardTime}>{p.time}</Text>
          <Text style={styles.cdCardName}>{p.name}</Text>
          <View style={styles.cdCardElapsed}><Text style={styles.cdCardElapsedText}>{p.elapsed}</Text></View>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Calendar Screen ─────────────────────────────────────────
function CalendarScreen() {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const firstDayOffset = 4; // May 1 2026 = Thursday (index 4)
  const prayedDays = new Set([1,2,3,5,6,7,9,10,12,14,15]);
  const missedDays = new Set([4,8,11,13]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenPadding} showsVerticalScrollIndicator={false}>
      {/* Month header */}
      <View style={styles.calHeader}>
        <Text style={styles.calMonth}>May 2026</Text>
        <View style={styles.calNav}>
          <TouchableOpacity style={styles.calNavBtn}><Ionicons name="chevron-back" size={16} color={C.navy} /></TouchableOpacity>
          <TouchableOpacity style={styles.calNavBtn}><Ionicons name="chevron-forward" size={16} color={C.navy} /></TouchableOpacity>
        </View>
      </View>

      {/* Weekday headers */}
      <View style={styles.calWeekdays}>
        {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => (
          <Text key={d} style={styles.calWeekday}>{d}</Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calGrid}>
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.calDayEmpty} />
        ))}
        {days.map(day => {
          const isToday = day === 15;
          const isPrayed = prayedDays.has(day);
          const isMissed = missedDays.has(day);
          return (
            <View key={day} style={[styles.calDay, isToday && styles.calDayToday, isPrayed && styles.calDayPrayed, isMissed && styles.calDayMissed]}>
              <Text style={[styles.calDayText, isToday && styles.calDayTextToday, isPrayed && styles.calDayTextPrayed]}>
                {day}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Focus Time */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>FOCUS TIME TODAY</Text>
      </View>
      {[
        { name: 'Fajr',   fill: 100, min: '30m' },
        { name: 'Dhuhr',  fill: 0,   min: '0m'  },
        { name: 'Asr',    fill: 0,   min: '0m'  },
      ].map(p => (
        <View key={p.name} style={styles.focusRow}>
          <Text style={styles.focusName}>{p.name}</Text>
          <View style={styles.focusBar}>
            <View style={[styles.focusFill, { width: `${p.fill}%` }]} />
          </View>
          <Text style={styles.focusMin}>{p.min}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Journey Screen ──────────────────────────────────────────
function JourneyScreen() {
  const heatmapApril = [
    [1,2,2,1,3,3,0],
    [2,1,1,2,1,0,0],
    [1,2,3,2,1,0,0],
    [1,1,2,1,3,0,0],
    [2,1,1,0,0,0,0],
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenPadding} showsVerticalScrollIndicator={false}>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: C.gold }]}>27</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>142</Text>
          <Text style={styles.statLabel}>Total Prayers</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: C.emerald }]}>94%</Text>
          <Text style={styles.statLabel}>On Time</Text>
        </View>
      </View>

      {/* Heatmap */}
      <View style={styles.heatmapCard}>
        <View style={styles.heatmapHeader}>
          <Text style={styles.heatmapTitle}>April Activity</Text>
          <View style={styles.heatmapLegend}>
            <Text style={styles.heatmapLegendText}>Less</Text>
            {[0,1,2,3,4].map(l => <View key={l} style={[styles.heatCell, l === 1 && styles.heatCellL1, l === 2 && styles.heatCellL2, l === 3 && styles.heatCellL3]} />)}
            <Text style={styles.heatmapLegendText}>More</Text>
          </View>
        </View>
        <View style={styles.heatWeekdays}>
          {['S','M','T','W','T','F','S'].map((d,i) => <Text key={i} style={styles.heatDayLabel}>{d}</Text>)}
        </View>
        {heatmapApril.map((week, wi) => (
          <View key={wi} style={styles.heatRow}>
            {week.map((level, di) => (
              <View key={di} style={[styles.heatCellBase, level === 1 && styles.heatCellL1, level === 2 && styles.heatCellL2, level === 3 && styles.heatCellL3]} />
            ))}
          </View>
        ))}
      </View>

      {/* Weekly Chart */}
      <View style={styles.weeklyCard}>
        <View style={styles.weeklyHeader}>
          <Text style={styles.weeklyTitle}>This Week</Text>
          <View style={styles.weeklyTrend}><Text style={styles.weeklyTrendText}>↑ 12%</Text></View>
        </View>
        <View style={styles.weeklyBars}>
          {[
            { day: 'S', h: 60 },
            { day: 'M', h: 85 },
            { day: 'T', h: 100 },
            { day: 'W', h: 70 },
            { day: 'T', h: 90 },
            { day: 'F', h: 0 },
            { day: 'S', h: 0 },
          ].map((b) => (
            <View key={b.day} style={styles.wbarWrap}>
              <View style={styles.wbarTrack}>
                <View style={[styles.wbar, b.h > 0 && styles.wbarFilled, { height: `${b.h}%` }]} />
              </View>
              <Text style={styles.wbarLabel}>{b.day}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Qibla Screen ────────────────────────────────────────────
function QiblaScreen() {
  const [toggled, setToggled] = useState(false);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenPadding} showsVerticalScrollIndicator={false}>
      {/* Compass */}
      <View style={styles.qiblaWrap}>
        <View style={styles.compassRing}>
          <View style={styles.compassInner}>
            <Ionicons name="location" size={28} color={C.navy} />
            <Text style={styles.compassDeg}>243°</Text>
            <Text style={styles.compassBearing}>SE</Text>
          </View>
        </View>
        <Text style={styles.qiblaCity}>Makkah Al Mukkaramah</Text>
        <Text style={styles.qiblaDist}>8,356 km away</Text>
      </View>

      {/* Nearby Mosques */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>NEARBY MOSQUES</Text>
      </View>

      {[
        { name: 'Lakemba Mosque', dist: '1.2 km away' },
        { name: 'Auburn Mosque',   dist: '2.8 km away' },
      ].map((m) => (
        <View key={m.name} style={styles.mosqueCard}>
          <View style={styles.mosqueIcon}>
            <Ionicons name="business-outline" size={20} color={C.gold} />
          </View>
          <View>
            <Text style={styles.mosqueName}>{m.name}</Text>
            <Text style={styles.mosqueDist}>{m.dist}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Settings Screen ─────────────────────────────────────────
function SettingsScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenPadding} showsVerticalScrollIndicator={false}>
      {/* Notifications */}
      <Text style={styles.settingsSectionTitle}>NOTIFICATIONS</Text>
      <View style={styles.settingsCard}>
        <View style={styles.srow}>
          <View style={styles.srowLeft}>
            <View style={[styles.srowIcon, { backgroundColor: 'rgba(7,26,53,0.07)' }]}>
              <Ionicons name="notifications-outline" size={16} color={C.navy} />
            </View>
            <Text style={styles.srowLabel}>Prayer Alerts</Text>
          </View>
          <View style={[styles.toggle, true && styles.toggleActive]}><View style={styles.toggleKnob} /></View>
        </View>
        <View style={[styles.srow, styles.srowBorder]}>
          <View style={styles.srowLeft}>
            <View style={[styles.srowIcon, { backgroundColor: C.goldPale }]}>
              <Ionicons name="alarm-outline" size={16} color={C.gold} />
            </View>
            <Text style={styles.srowLabel}>Fajr Auto-Alarm</Text>
          </View>
          <Text style={styles.srowValue}>15 min before</Text>
          <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
        </View>
        <View style={[styles.srow, styles.srowBorder]}>
          <View style={styles.srowLeft}>
            <View style={[styles.srowIcon, { backgroundColor: C.emeraldPale }]}>
              <Ionicons name="checkmark-circle-outline" size={16} color={C.emerald} />
            </View>
            <Text style={styles.srowLabel}>Iqama Countdown</Text>
          </View>
          <View style={styles.toggle}><View style={styles.toggleKnob} /></View>
        </View>
      </View>

      {/* Calendar */}
      <Text style={styles.settingsSectionTitle}>CALENDAR</Text>
      <View style={styles.settingsCard}>
        <View style={[styles.srow, styles.srowBorder]}>
          <View style={styles.srowLeft}>
            <View style={[styles.srowIcon, { backgroundColor: 'rgba(7,26,53,0.07)' }]}>
              <Ionicons name="calendar-outline" size={16} color={C.navy} />
            </View>
            <Text style={styles.srowLabel}>Import Calendar</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
        </View>
        <View style={[styles.srow, styles.srowBorder]}>
          <View style={styles.srowLeft}>
            <View style={[styles.srowIcon, { backgroundColor: 'rgba(107,114,128,0.1)' }]}>
              <Ionicons name="sync-outline" size={16} color={C.textSecondary} />
            </View>
            <Text style={styles.srowLabel}>Sync to Calendar</Text>
          </View>
          <View style={styles.toggle}><View style={styles.toggleKnob} /></View>
        </View>
      </View>

      {/* Calculation */}
      <Text style={styles.settingsSectionTitle}>CALCULATION</Text>
      <View style={styles.settingsCard}>
        <View style={[styles.srow, styles.srowBorder]}>
          <View style={styles.srowLeft}>
            <View style={[styles.srowIcon, { backgroundColor: 'rgba(7,26,53,0.07)' }]}>
              <Ionicons name="globe-outline" size={16} color={C.navy} />
            </View>
            <Text style={styles.srowLabel}>Madhab</Text>
          </View>
          <Text style={styles.srowValue}>Shafi</Text>
          <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
        </View>
        <View style={[styles.srow, styles.srowBorder]}>
          <View style={styles.srowLeft}>
            <View style={[styles.srowIcon, { backgroundColor: 'rgba(7,26,53,0.07)' }]}>
              <Ionicons name="options-outline" size={16} color={C.navy} />
            </View>
            <Text style={styles.srowLabel}>Calculation Method</Text>
          </View>
          <Text style={styles.srowValue}>Islamic Society</Text>
          <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Main App ────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':      return <HomeScreen />;
      case 'countdown': return <CountdownScreen />;
      case 'calendar':  return <CalendarScreen />;
      case 'journey':   return <JourneyScreen />;
      case 'qibla':     return <QiblaScreen />;
      case 'settings':  return <SettingsScreen />;
      default:          return <HomeScreen />;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bgBase} />
      {/* Status Bar spacer */}
      <View style={styles.statusBarSpacer} />

      {/* Screen */}
      <View style={styles.screenWrapper}>
        {renderScreen()}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {NAV_TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabItem}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={(activeTab === tab.id ? tab.iconActive : tab.icon) as any}
              size={22}
              color={activeTab === tab.id ? C.gold : C.textMuted}
            />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgBase,
  },
  statusBarSpacer: {
    height: 47,
    backgroundColor: C.bgBase,
  },
  screenWrapper: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: C.bgBase,
  },
  screenPadding: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  // ── Hero Card ──
  heroCard: {
    backgroundColor: C.bgSurface,
    borderRadius: 28,
    padding: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.11, shadowRadius: 32 },
      android: { elevation: 6 },
    }),
  },
  heroLeft: { flex: 1 },
  heroLabel: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: C.gold,
    marginBottom: 4,
  },
  heroTimeRow: { flexDirection: 'row', alignItems: 'flex-end' },
  heroTime: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 52,
    fontWeight: '600',
    color: C.navy,
    lineHeight: 54,
  },
  heroAmPm: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 22,
    fontWeight: '400',
    color: C.navySoft,
    marginLeft: 4,
    marginBottom: 6,
  },
  heroNextRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  heroDot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: C.gold,
    marginRight: 6,
  },
  heroNextText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 12,
    fontWeight: '500',
    color: C.textSecondary,
  },
  heroRight: { marginLeft: 16 },
  progressRing: {
    width: 100, height: 100,
    borderRadius: 50,
    backgroundColor: C.goldPale,
    borderWidth: 6,
    borderColor: 'rgba(184,137,47,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPct: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 24,
    fontWeight: '600',
    color: C.gold,
  },
  progressDay: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 9,
    fontWeight: '500',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  sectionTitle: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: C.textMuted,
  },
  sectionLink: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 12,
    fontWeight: '500',
    color: C.gold,
  },

  // ── Prayer Rows ──
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bgSurface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 6,
    ...Platform.select({
      ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  prayerRowBorder: {
    borderBottomWidth: 0,
  },
  prayerRowActive: {
    backgroundColor: C.goldPale,
    borderWidth: 1,
    borderColor: 'rgba(184,137,47,0.2)',
  },
  prayerIconWrap: {
    width: 36, height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(7,26,53,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  prayerIconActive: {
    backgroundColor: C.goldPale,
  },
  prayerInfo: { flex: 1 },
  prayerName: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 17,
    fontWeight: '500',
    color: C.navy,
  },
  prayerNameActive: { color: C.navy },
  prayerTime: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 13,
    fontWeight: '500',
    color: C.textMuted,
    marginRight: 10,
  },
  prayerTimeActive: {
    color: C.gold,
    fontWeight: '600',
  },
  statusBadgeDone: {
    backgroundColor: C.emeraldPale,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusTextDone: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 11,
    fontWeight: '600',
    color: C.emerald,
  },
  statusBadgeOntime: {
    backgroundColor: C.emeraldPale,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusTextOntime: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 11,
    fontWeight: '600',
    color: C.emerald,
  },
  statusBadgeQaza: {
    backgroundColor: 'rgba(107,114,128,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusTextQaza: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 11,
    fontWeight: '600',
    color: C.textMuted,
  },

  // ── Countdown ──
  cdHero: { alignItems: 'center', paddingVertical: 32 },
  cdLabel: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: C.textMuted,
    marginBottom: 16,
  },
  cdTime: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 72,
    fontWeight: '300',
    color: C.navy,
    lineHeight: 74,
    letterSpacing: -2,
  },
  cdPrayer: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 24,
    fontWeight: '400',
    color: C.gold,
    marginTop: 6,
    marginBottom: 32,
  },
  cdDivider: {
    width: 40,
    height: 1,
    backgroundColor: C.borderStrong,
  },
  cdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bgSurface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 8,
    ...Platform.select({
      ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  cdCardTime: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 26,
    fontWeight: '500',
    color: C.navy,
    marginRight: 12,
    minWidth: 90,
  },
  cdCardName: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 16,
    fontWeight: '500',
    color: C.textSecondary,
    flex: 1,
  },
  cdCardElapsed: {
    backgroundColor: 'rgba(107,114,128,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  cdCardElapsedText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 11,
    fontWeight: '600',
    color: C.textMuted,
  },

  // ── Calendar ──
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  calMonth: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 22,
    fontWeight: '600',
    color: C.navy,
  },
  calNav: { flexDirection: 'row', gap: 8 },
  calNavBtn: {
    width: 34, height: 34,
    borderRadius: 17,
    backgroundColor: C.bgSurface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  calWeekdays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calWeekday: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 11,
    fontWeight: '600',
    color: C.textMuted,
    letterSpacing: 0.5,
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calDayEmpty: { width: `${100/7}%`, aspectRatio: 1 },
  calDay: {
    width: `${100/7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  calDayToday: { backgroundColor: C.goldPale },
  calDayPrayed: { backgroundColor: C.emeraldPale },
  calDayMissed: { backgroundColor: 'rgba(184,137,47,0.1)' },
  calDayText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 14,
    fontWeight: '500',
    color: C.textPrimary,
  },
  calDayTextToday: { color: C.gold, fontWeight: '700' },
  calDayTextPrayed: { color: C.emerald },
  focusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bgSurface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    ...Platform.select({
      ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  focusName: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 15,
    fontWeight: '500',
    color: C.navy,
    minWidth: 70,
  },
  focusBar: {
    flex: 1,
    height: 6,
    backgroundColor: C.goldPale,
    borderRadius: 3,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  focusFill: {
    height: '100%',
    backgroundColor: C.gold,
    borderRadius: 3,
  },
  focusMin: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 11,
    fontWeight: '600',
    color: C.textMuted,
    minWidth: 28,
    textAlign: 'right',
  },

  // ── Journey ──
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.bgSurface,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.09, shadowRadius: 16 },
      android: { elevation: 4 },
    }),
  },
  statValue: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 28,
    fontWeight: '600',
    color: C.navy,
    lineHeight: 30,
  },
  statLabel: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: C.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  heatmapCard: {
    backgroundColor: C.bgSurface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.09, shadowRadius: 16 },
      android: { elevation: 4 },
    }),
  },
  heatmapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  heatmapTitle: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 13,
    fontWeight: '600',
    color: C.navy,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heatmapLegendText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 10,
    color: C.textMuted,
  },
  heatCell: {
    width: 14, height: 14,
    borderRadius: 3,
    backgroundColor: 'rgba(7,26,53,0.06)',
  },
  heatCellL1: { backgroundColor: C.goldPale },
  heatCellL2: { backgroundColor: 'rgba(184,137,47,0.35)' },
  heatCellL3: { backgroundColor: 'rgba(184,137,47,0.60)' },
  heatWeekdays: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  heatDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 9,
    color: C.textMuted,
  },
  heatRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  heatCellBase: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 3,
    backgroundColor: 'rgba(7,26,53,0.04)',
  },
  weeklyCard: {
    backgroundColor: C.bgSurface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.09, shadowRadius: 16 },
      android: { elevation: 4 },
    }),
  },
  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weeklyTitle: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 13,
    fontWeight: '600',
    color: C.navy,
  },
  weeklyTrend: {
    backgroundColor: C.emeraldPale,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  weeklyTrendText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 11,
    fontWeight: '600',
    color: C.emerald,
  },
  weeklyBars: {
    flexDirection: 'row',
    gap: 8,
    height: 80,
  },
  wbarWrap: {
    flex: 1,
    alignItems: 'center',
  },
  wbarTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  wbar: {
    width: '100%',
    borderRadius: 4,
    backgroundColor: 'rgba(7,26,53,0.06)',
    minHeight: 4,
  },
  wbarFilled: {
    backgroundColor: C.gold,
  },
  wbarLabel: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 10,
    fontWeight: '600',
    color: C.textMuted,
    marginTop: 6,
  },

  // ── Qibla ──
  qiblaWrap: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  compassRing: {
    width: 220, height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bgSurface,
    ...Platform.select({
      ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.11, shadowRadius: 24 },
      android: { elevation: 5 },
    }),
  },
  compassInner: {
    width: 160, height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bgSurface,
  },
  compassDeg: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 32,
    fontWeight: '600',
    color: C.navy,
    lineHeight: 34,
  },
  compassBearing: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 11,
    fontWeight: '600',
    color: C.textMuted,
    letterSpacing: 1,
    marginTop: 4,
  },
  qiblaCity: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 20,
    fontWeight: '500',
    color: C.navy,
    marginTop: 24,
  },
  qiblaDist: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 4,
  },
  mosqueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bgSurface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    ...Platform.select({
      ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  mosqueIcon: {
    width: 42, height: 42,
    borderRadius: 12,
    backgroundColor: C.goldPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  mosqueName: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 16,
    fontWeight: '500',
    color: C.navy,
  },
  mosqueDist: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
  },

  // ── Settings ──
  settingsSectionTitle: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: C.textMuted,
    paddingVertical: 12,
  },
  settingsCard: {
    backgroundColor: C.bgSurface,
    borderRadius: 18,
    marginBottom: 8,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  srow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  srowBorder: {
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  srowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  srowIcon: {
    width: 34, height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  srowLabel: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 15,
    fontWeight: '500',
    color: C.textPrimary,
  },
  srowValue: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 13,
    color: C.textMuted,
    marginRight: 8,
  },
  toggle: {
    width: 50, height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(7,26,53,0.12)',
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: C.emerald,
  },
  toggleKnob: {
    width: 24, height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    marginLeft: 3,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },

  // ── Tab Bar ──
  tabBar: {
    flexDirection: 'row',
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 10,
    ...Platform.select({
      ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 10,
    fontWeight: '600',
    color: C.textMuted,
  },
  tabLabelActive: {
    color: C.gold,
  },
});
