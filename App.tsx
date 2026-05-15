import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Platform, StatusBar, Alert, RefreshControl, Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';

// ─── Types & Config ──────────────────────────────────────────
import { C, NAV_TABS, PrayerId, PrayerTime, AppSettings, DEFAULT_SETTINGS, PRAYER_ICONS } from './src/types';
import {
  calculatePrayerTimes, getPrayerTimesObject, getNextPrayer, getTimeUntilNext,
  minutesToTimeString, calculateQiblaDirection, bearingToCompassDirection
} from './src/services/PrayerService';
import {
  gregorianToHijri, getMonthGrid, HijriService
} from './src/services/HijriService';
import {
  loadSettings, saveSettings, markPrayer, loadPrayerLog,
  getStreak, getTotalPrayers, getOnTimeRate, getHeatmapData
} from './src/services/StorageService';
import { getCurrentLocation, DEFAULT_LOCATION } from './src/services/LocationService';
import {
  schedulePrayerNotification, hasNotificationPermission
} from './src/services/NotificationService';

// ─── Utility ─────────────────────────────────────────────────
function getDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function minutesFromMidnight(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function formatCountdown(diffMinutes: number): string {
  if (diffMinutes <= 0) return '0:00';
  const h = Math.floor(diffMinutes / 60);
  const m = diffMinutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

function getHourMinute(minutes: number): { hour: number; minute: number } {
  return {
    hour: Math.floor((minutes % 1440) / 60),
    minute: minutes % 60,
  };
}

// ─── Shared UI Components ───────────────────────────────────
function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && <Text style={styles.sectionLink}>{action}</Text>}
    </View>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

// ─── Home Screen ─────────────────────────────────────────────
function HomeScreen({
  prayerTimes,
  nextPrayer,
  settings,
  onMarkPrayer,
}: {
  prayerTimes: PrayerTime[];
  nextPrayer: PrayerTime | null;
  settings: AppSettings;
  onMarkPrayer: (id: PrayerId, status: 'prayed' | 'qaza') => void;
}) {
  const [prayerLog, setPrayerLog] = useState<Record<string, string>>({});
  const todayKey = getDateKey(new Date());

  useEffect(() => {
    loadPrayerLog().then(log => {
      if (log[todayKey]) setPrayerLog(log[todayKey] as Record<string, string>);
    });
  }, [todayKey]);

  if (!prayerTimes.length) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  const dayProgress = Math.round((minutesFromMidnight() / 1440) * 100);
  const activePrayer = prayerTimes.find(p => p.status === 'active') || nextPrayer;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenPadding} showsVerticalScrollIndicator={false}>
      {/* Hero Card */}
      <Card style={styles.heroCard}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroLabel}>Next Prayer</Text>
          {nextPrayer && (
            <>
              <View style={styles.heroTimeRow}>
                <Text style={styles.heroTime}>
                  {minutesToTimeString(nextPrayer.minutes).split(' ')[0]}
                </Text>
                <Text style={styles.heroAmPm}>
                  {minutesToTimeString(nextPrayer.minutes).split(' ')[1]}
                </Text>
              </View>
              <View style={styles.heroNextRow}>
                <View style={styles.heroDot} />
                <Text style={styles.heroNextText}>
                  {nextPrayer.name} in {getTimeUntilNext(nextPrayer, minutesFromMidnight())}
                </Text>
              </View>
            </>
          )}
        </View>
        <View style={styles.heroRight}>
          <View style={styles.progressRing}>
            <Text style={styles.progressPct}>{dayProgress}%</Text>
            <Text style={styles.progressDay}>of day</Text>
          </View>
        </View>
      </Card>

      {/* Prayer Rows */}
      <SectionHeader title="TODAY'S PRAYERS" />
      {prayerTimes.filter(p => p.id !== 'sunrise').map((prayer, i) => {
        const logStatus = prayerLog[prayer.id];
        const isActive = activePrayer?.id === prayer.id;

        return (
          <TouchableOpacity
            key={prayer.id}
            style={[
              styles.prayerRow,
              isActive && styles.prayerRowActive,
              i > 0 && styles.prayerRowBorder,
            ]}
            onLongPress={() => {
              if (prayer.status === 'passed') {
                Alert.alert(
                  `Mark ${prayer.name}`,
                  'How did you pray?',
                  [
                    { text: 'Prayed On Time', onPress: () => onMarkPrayer(prayer.id, 'prayed') },
                    { text: 'Qaza', onPress: () => onMarkPrayer(prayer.id, 'qaza') },
                    { text: 'Cancel', style: 'cancel' },
                  ]
                );
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.prayerIconWrap, isActive && styles.prayerIconActive]}>
              <Ionicons
                name={(isActive ? PRAYER_ICONS[prayer.id].iconActive : PRAYER_ICONS[prayer.id].icon) as any}
                size={18}
                color={isActive ? C.gold : C.navySoft}
              />
            </View>
            <View style={styles.prayerInfo}>
              <Text style={[styles.prayerName, isActive && styles.prayerNameActive]}>
                {prayer.name}
              </Text>
              <Text style={styles.prayerArabic}>{prayer.arabic}</Text>
            </View>
            <Text style={[styles.prayerTime, isActive && styles.prayerTimeActive]}>
              {prayer.time}
            </Text>
            {logStatus === 'prayed' && (
              <View style={styles.statusBadgeDone}><Text style={styles.statusTextDone}>Done</Text></View>
            )}
            {logStatus === 'qaza' && (
              <View style={styles.statusBadgeQaza}><Text style={styles.statusTextQaza}>Qaza</Text></View>
            )}
            {prayer.status === 'active' && !logStatus && (
              <View style={styles.statusBadgeNow}><Text style={styles.statusTextNow}>Now</Text></View>
            )}
          </TouchableOpacity>
        );
      })}

      <Text style={styles.hintText}>Long press a passed prayer to mark it</Text>
    </ScrollView>
  );
}

// ─── Countdown Screen ────────────────────────────────────────
function CountdownScreen({ prayerTimes, nextPrayer }: { prayerTimes: PrayerTime[]; nextPrayer: PrayerTime | null }) {
  const [now, setNow] = useState(minutesFromMidnight());

  useEffect(() => {
    const interval = setInterval(() => setNow(minutesFromMidnight()), 30000);
    return () => clearInterval(interval);
  }, []);

  if (!nextPrayer) return <View style={styles.centered}><Text style={styles.loadingText}>Loading...</Text></View>;

  const diff = Math.max(0, nextPrayer.minutes - now);
  const upcoming = prayerTimes.filter(p => p.id !== 'sunrise' && p.minutes > now).slice(0, 4);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenPadding} showsVerticalScrollIndicator={false}>
      <View style={styles.cdHero}>
        <Text style={styles.cdLabel}>Time until {nextPrayer.name}</Text>
        <Text style={styles.cdTime}>{formatCountdown(diff)}</Text>
        <Text style={styles.cdPrayer}>{nextPrayer.name} — {nextPrayer.time}</Text>
        <View style={styles.cdDivider} />
      </View>

      <SectionHeader title="UPCOMING PRAYERS" />
      {upcoming.map((p) => {
        const elapsed = Math.max(0, p.minutes - now);
        return (
          <View key={p.id} style={styles.cdCard}>
            <Text style={styles.cdCardTime}>{p.time}</Text>
            <Text style={styles.cdCardName}>{p.name}</Text>
            <Text style={styles.cdCardElapsed}>{formatCountdown(elapsed)}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ─── Calendar Screen ─────────────────────────────────────────
function CalendarScreen({ prayerTimes }: { prayerTimes: PrayerTime[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [prayerLog, setPrayerLog] = useState<Record<string, Record<string, string>>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const todayKey = getDateKey(today);

  useEffect(() => {
    loadPrayerLog().then(setPrayerLog);
  }, []);

  const grid = HijriService.getMonthGrid(year, month);
  const hijriToday = HijriService.gregorianToHijri(today);
  const hijriCurrent = HijriService.gregorianToHijri(new Date(year, month, 15));

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const hijriMonthStr = `${hijriCurrent.monthNameArabic} ${hijriCurrent.year}`;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenPadding} showsVerticalScrollIndicator={false}>
      {/* Month header */}
      <View style={styles.calHeader}>
        <View>
          <Text style={styles.calMonth}>{monthName}</Text>
          <Text style={styles.calHijri}>{hijriMonthStr}</Text>
        </View>
        <View style={styles.calNav}>
          <TouchableOpacity style={styles.calNavBtn} onPress={prevMonth}>
            <Ionicons name="chevron-back" size={16} color={C.navy} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.calNavBtn} onPress={nextMonth}>
            <Ionicons name="chevron-forward" size={16} color={C.navy} />
          </TouchableOpacity>
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
        {grid.map((cell: { gregorian: Date; hijri: { day: number; monthNameArabic: string }; isCurrentMonth: boolean }, idx: number) => {
          const { gregorian, hijri, isCurrentMonth } = cell;
          const dateKey = getDateKey(gregorian);
          const isToday = dateKey === todayKey;
          const dayLog = prayerLog[dateKey];
          const prayedCount = dayLog ? Object.entries(dayLog).filter(([id, s]) => id !== 'sunrise' && s === 'prayed').length : 0;
          const isSelected = dateKey === selectedDate;

          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.calDay,
                !isCurrentMonth && styles.calDayOther,
                isToday && styles.calDayToday,
                isSelected && styles.calDaySelected,
              ]}
              onPress={() => setSelectedDate(dateKey === selectedDate ? null : dateKey)}
            >
              <Text style={[
                styles.calDayNum,
                isToday && styles.calDayNumToday,
                !isCurrentMonth && styles.calDayNumOther,
              ]}>
                {gregorian.getDate()}
              </Text>
              {isCurrentMonth && (
                <Text style={[styles.calDayHijri, prayedCount > 0 && styles.calDayHijriPrayed]}>
                  {hijri.day}
                </Text>
              )}
              {prayedCount >= 5 && (
                <View style={styles.calPrayedDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected date detail */}
      {selectedDate && (
        <View style={styles.calDetail}>
          {(() => {
            const selected = new Date(selectedDate + 'T12:00:00');
            const hijri = gregorianToHijri(selected);
            const dayLog = prayerLog[selectedDate] || {};
            const times = getPrayerTimesObject(
              selected,
              -33.8688, 151.2093,
              'muslim_world_league', 'shafi',
              0
            );
            return (
              <>
                <Text style={styles.calDetailDate}>
                  {selected.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
                <Text style={styles.calDetailHijri}>
                  {hijri.day} {hijri.monthNameArabic} {hijri.year}
                </Text>
                {times.filter((t: PrayerTime) => t.id !== 'sunrise').map((p: PrayerTime) => (
                  <View key={p.id} style={styles.calDetailRow}>
                    <Text style={styles.calDetailPrayer}>{p.name}</Text>
                    <Text style={styles.calDetailTime}>{p.time}</Text>
                    {dayLog[p.id] === 'prayed' && <Text style={styles.calDetailDone}>✓</Text>}
                    {dayLog[p.id] === 'qaza' && <Text style={styles.calDetailQaza}>Q</Text>}
                  </View>
                ))}
              </>
            );
          })()}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Journey Screen ──────────────────────────────────────────
function JourneyScreen() {
  const [streak, setStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const [onTimeRate, setOnTimeRate] = useState(0);
  const [heatmap, setHeatmap] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    const [s, t, o, h] = await Promise.all([
      getStreak(), getTotalPrayers(), getOnTimeRate(), getHeatmapData(8)
    ]);
    setStreak(s); setTotal(t); setOnTimeRate(o); setHeatmap(h);
  }, []);

  useEffect(() => { loadStats(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  // Build last 5 weeks of heatmap (35 days)
  const now = new Date();
  const weeks: Array<Array<{ date: string; level: number }>> = [];
  for (let w = 4; w >= 0; w--) {
    const week: Array<{ date: string; level: number }> = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(now);
      dt.setDate(dt.getDate() - (w * 7 + (6 - d)));
      const key = getDateKey(dt);
      const count = heatmap[key] || 0;
      const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : 3;
      week.push({ date: key, level });
    }
    weeks.push(week);
  }

  // Weekly bar chart — last 7 days
  const weeklyBars = Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() - (6 - i));
    const key = getDateKey(dt);
    const count = heatmap[key] || 0;
    const maxCount = 6;
    return { day: ['S','M','T','W','T','F','S'][dt.getDay()], h: Math.min(100, (count / maxCount) * 100) };
  });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenPadding}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}
    >
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: C.gold }]}>{streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{total}</Text>
          <Text style={styles.statLabel}>Total Prayers</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: C.emerald }]}>{onTimeRate}%</Text>
          <Text style={styles.statLabel}>On Time</Text>
        </Card>
      </View>

      {/* Heatmap */}
      <SectionHeader title="ACTIVITY" />
      <Card style={styles.heatmapCard}>
        <View style={styles.heatmapHeader}>
          <Text style={styles.heatmapTitle}>Last 5 Weeks</Text>
          <View style={styles.heatmapLegend}>
            <Text style={styles.heatmapLegendText}>Less</Text>
            {[0,1,2,3].map(l => <View key={l} style={[styles.heatCell, l === 1 && styles.heatCellL1, l === 2 && styles.heatCellL2, l === 3 && styles.heatCellL3]} />)}
            <Text style={styles.heatmapLegendText}>More</Text>
          </View>
        </View>
        <View style={styles.heatWeekdays}>
          {['S','M','T','W','T','F','S'].map((d,i) => <Text key={i} style={styles.heatDayLabel}>{d}</Text>)}
        </View>
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.heatRow}>
            {week.map(({ date, level }, di) => (
              <View
                key={di}
                style={[
                  styles.heatCellBase,
                  level === 1 && styles.heatCellL1,
                  level === 2 && styles.heatCellL2,
                  level === 3 && styles.heatCellL3,
                ]}
              />
            ))}
          </View>
        ))}
      </Card>

      {/* Weekly Chart */}
      <Card style={styles.weeklyCard}>
        <View style={styles.weeklyHeader}>
          <Text style={styles.weeklyTitle}>This Week</Text>
          <View style={styles.weeklyTrend}><Text style={styles.weeklyTrendText}>↑ {onTimeRate}%</Text></View>
        </View>
        <View style={styles.weeklyBars}>
          {weeklyBars.map((b, i) => (
            <View key={i} style={styles.wbarWrap}>
              <View style={styles.wbarTrack}>
                <View style={[styles.wbar, b.h > 0 && styles.wbarFilled, { height: `${b.h}%` }]} />
              </View>
              <Text style={styles.wbarLabel}>{b.day}</Text>
            </View>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}

// ─── Qibla Screen ─────────────────────────────────────────────
function QiblaScreen({ location }: { location: { latitude: number; longitude: number; name: string } }) {
  const [rotation, setRotation] = useState(0);
  const [compassSupported, setCompassSupported] = useState(true);

  const qiblaDir = calculateQiblaDirection(location.latitude, location.longitude);
  const bearingStr = bearingToCompassDirection(qiblaDir);
  const distance = Math.round(
    6371 * 2 * Math.atan2(
      Math.sqrt(Math.abs(Math.sin((location.latitude - 21.4225) * Math.PI / 360) ** 2 +
        Math.cos(location.latitude * Math.PI / 180) * Math.cos(21.4225 * Math.PI / 180) *
        Math.sin((location.longitude - 39.8264) * Math.PI / 360) ** 2)),
      Math.sqrt(1 - (Math.abs(Math.sin((location.latitude - 21.4225) * Math.PI / 360) ** 2 +
        Math.cos(location.latitude * Math.PI / 180) * Math.cos(21.4225 * Math.PI / 180) *
        Math.sin((location.longitude - 39.8264) * Math.PI / 360) ** 2))
      )
    )
  );

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    const { Magnetometer } = require('expo-sensors');
    Magnetometer.addListener((data: { x: number; y: number; z: number }) => {
      const { x, y } = data;
      const angle = Math.atan2(y, x) * (180 / Math.PI);
      const corrected = (angle + 360) % 360;
      const relative = (qiblaDir - corrected + 360) % 360;
      setRotation(relative);
    });
    return () => subscription?.remove();
  }, [qiblaDir]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenPadding} showsVerticalScrollIndicator={false}>
      {/* Compass */}
      <View style={styles.qiblaWrap}>
        <View style={[styles.compassRing, { transform: [{ rotate: `${rotation}deg` }] }]}>
          {/* Direction markers */}
          {['N','E','S','W'].map((d, i) => {
            const angles: Record<string, number> = { N: 0, E: 90, S: 180, W: 270 };
            const angle = angles[d];
            const offset = (angle - rotation + 360) % 360;
            return (
              <View
                key={d}
                style={[
                  styles.compassMarker,
                  { transform: [{ rotate: `${angle}deg` }, { translateY: -85 }], opacity: offset < 45 || offset > 315 ? 1 : 0.3 }
                ]}
              >
                <Text style={styles.compassMarkerText}>{d}</Text>
              </View>
            );
          })}
          <View style={styles.compassInner}>
            <Ionicons name="location" size={24} color={C.navy} />
            <Text style={styles.compassDeg}>{Math.round(qiblaDir)}°</Text>
            <Text style={styles.compassBearing}>{bearingStr}</Text>
          </View>
        </View>
        <Text style={styles.qiblaCity}>Makkah Al Mukkaramah</Text>
        <Text style={styles.qiblaDist}>{distance.toLocaleString()} km away</Text>
        <Text style={styles.qiblaLocation}>{location.name}</Text>
      </View>

      {/* Info */}
      <Card style={styles.qiblaInfoCard}>
        <View style={styles.qiblaInfoRow}>
          <Ionicons name="navigate" size={18} color={C.gold} />
          <Text style={styles.qiblaInfoText}>
            Point your device in the direction of the arrow. The compass shows the relative direction to Makkah.
          </Text>
        </View>
      </Card>

      {/* Nearby Mosques placeholder */}
      <SectionHeader title="NEARBY MOSQUES" />
      <Card>
        <View style={styles.mosquePlaceholder}>
          <Ionicons name="search" size={24} color={C.textMuted} />
          <Text style={styles.mosquePlaceholderText}>Location-based mosque search coming soon</Text>
        </View>
      </Card>
    </ScrollView>
  );
}

// ─── Settings Screen ─────────────────────────────────────────
function SettingsScreen({
  settings,
  onUpdate,
}: {
  settings: AppSettings;
  onUpdate: (partial: Partial<AppSettings>) => void;
}) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    hasNotificationPermission().then(setNotificationsEnabled);
  }, []);

  const METHOD_LABELS: Record<string, string> = {
    muslim_world_league: 'Islamic Society (MWL)',
    isna: 'ISNA',
    egyptian: 'Egyptian',
    umm_al_qura: 'Umm Al-Qura',
    karachi: 'Karachi (University)',
  };

  const handleToggle = async (key: keyof AppSettings, value: boolean) => {
    if (key === 'notificationsEnabled' && value) {
      const granted = await hasNotificationPermission();
      if (!granted) {
        Alert.alert('Permission Required', 'Enable notifications in your device settings.');
        return;
      }
    }
    onUpdate({ [key]: value });
  };

  const handleFajrAlarmToggle = async (value: boolean) => {
    if (value) {
      const granted = await hasNotificationPermission();
      if (!granted) {
        Alert.alert('Permission Required', 'Enable notifications to use Fajr alarm.');
        return;
      }
    }
    onUpdate({ fajrAlarmEnabled: value });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenPadding} showsVerticalScrollIndicator={false}>
      {/* Location */}
      <Text style={styles.settingsSectionTitle}>LOCATION</Text>
      <Card>
        <View style={styles.srow}>
          <View style={[styles.srowIcon, { backgroundColor: 'rgba(7,26,53,0.07)' }]}>
            <Ionicons name="location-outline" size={16} color={C.navy} />
          </View>
          <View style={styles.srowLeft}>
            <Text style={styles.srowLabel}>Current Location</Text>
            <Text style={styles.srowSub}>{settings.location?.name || 'Not set'}</Text>
          </View>
        </View>
      </Card>

      {/* Notifications */}
      <Text style={styles.settingsSectionTitle}>NOTIFICATIONS</Text>
      <Card>
        <View style={styles.srow}>
          <View style={[styles.srowIcon, { backgroundColor: 'rgba(7,26,53,0.07)' }]}>
            <Ionicons name="notifications-outline" size={16} color={C.navy} />
          </View>
          <Text style={styles.srowLabel}>Prayer Alerts</Text>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={v => handleToggle('notificationsEnabled', v)}
            trackColor={{ false: 'rgba(7,26,53,0.12)', true: C.emeraldPale }}
            thumbColor={settings.notificationsEnabled ? C.emerald : '#fff'}
          />
        </View>
        <View style={[styles.srow, styles.srowBorder]}>
          <View style={[styles.srowIcon, { backgroundColor: C.goldPale }]}>
            <Ionicons name="alarm-outline" size={16} color={C.gold} />
          </View>
          <Text style={styles.srowLabel}>Fajr Auto-Alarm</Text>
          <Switch
            value={settings.fajrAlarmEnabled}
            onValueChange={handleFajrAlarmToggle}
            trackColor={{ false: 'rgba(7,26,53,0.12)', true: C.emeraldPale }}
            thumbColor={settings.fajrAlarmEnabled ? C.emerald : '#fff'}
          />
        </View>
        <View style={[styles.srow, styles.srowBorder]}>
          <View style={[styles.srowIcon, { backgroundColor: C.emeraldPale }]}>
            <Ionicons name="checkmark-circle-outline" size={16} color={C.emerald} />
          </View>
          <Text style={styles.srowLabel}>Iqama Countdown</Text>
          <Switch
            value={settings.iqamaCountdownEnabled}
            onValueChange={v => handleToggle('iqamaCountdownEnabled', v)}
            trackColor={{ false: 'rgba(7,26,53,0.12)', true: C.emeraldPale }}
            thumbColor={settings.iqamaCountdownEnabled ? C.emerald : '#fff'}
          />
        </View>
      </Card>

      {/* Calculation */}
      <Text style={styles.settingsSectionTitle}>CALCULATION</Text>
      <Card>
        <TouchableOpacity
          style={[styles.srow, styles.srowBorder]}
          onPress={() => {
            const methods = Object.keys(METHOD_LABELS);
            const current = methods.indexOf(settings.calculationMethod);
            Alert.alert(
              'Calculation Method',
              'Select your preferred calculation method',
              methods.map((m, i) => ({
                text: i === current ? `✓ ${METHOD_LABELS[m]}` : METHOD_LABELS[m],
                onPress: () => onUpdate({ calculationMethod: m as any }),
              }))
            );
          }}
        >
          <View style={[styles.srowIcon, { backgroundColor: 'rgba(7,26,53,0.07)' }]}>
            <Ionicons name="globe-outline" size={16} color={C.navy} />
          </View>
          <Text style={styles.srowLabel}>Method</Text>
          <Text style={styles.srowValue}>{METHOD_LABELS[settings.calculationMethod]}</Text>
          <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.srow, styles.srowBorder]}
          onPress={() => {
            Alert.alert('Madhab', 'Select your school of jurisprudence', [
              { text: 'Shafi ✓', onPress: () => onUpdate({ madhab: 'shafi' }) },
              { text: 'Hanafi', onPress: () => onUpdate({ madhab: 'hanafi' }) },
            ]);
          }}
        >
          <View style={[styles.srowIcon, { backgroundColor: 'rgba(7,26,53,0.07)' }]}>
            <Ionicons name="book-outline" size={16} color={C.navy} />
          </View>
          <Text style={styles.srowLabel}>Madhab</Text>
          <Text style={styles.srowValue}>{settings.madhab === 'shafi' ? 'Shafi' : 'Hanafi'}</Text>
          <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
        </TouchableOpacity>
      </Card>

      {/* About */}
      <Text style={styles.settingsSectionTitle}>ABOUT</Text>
      <Card>
        <View style={styles.srow}>
          <Text style={styles.srowLabel}>Nur Minimal</Text>
          <Text style={styles.srowValue}>v1.0.0</Text>
        </View>
      </Card>
    </ScrollView>
  );
}

// ─── Main App ────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [loading, setLoading] = useState(true);

  // Initialize
  useEffect(() => {
    const init = async () => {
      // Set Android nav bar
      if (Platform.OS === 'android') {
        await NavigationBar.setBackgroundColorAsync(C.bgBase);
        await NavigationBar.setButtonStyleAsync('dark');
      }

      // Load settings
      const saved = await loadSettings();
      setSettings(saved);

      // Get location
      const loc = await getCurrentLocation();
      if (loc) {
        setLocation(loc);
        const newSettings = { ...saved, location: loc };
        setSettings(newSettings);
        await saveSettings(newSettings);
      } else if (saved.location) {
        setLocation(saved.location);
      }

      setLoading(false);
    };
    init();
  }, []);

  // Update prayer times when settings or location changes
  useEffect(() => {
    if (loading) return;
    updatePrayerTimes();
  }, [settings.calculationMethod, settings.madhab, location, loading]);

  // Tick every minute
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(updatePrayerTimes, 60000);
    return () => clearInterval(interval);
  }, [settings.calculationMethod, settings.madhab, location, loading]);

  const updatePrayerTimes = useCallback(() => {
    const times = getPrayerTimesObject(
      new Date(),
      location.latitude,
      location.longitude,
      settings.calculationMethod,
      settings.madhab
    );
    setPrayerTimes(times);
    const next = getNextPrayer(times, minutesFromMidnight());
    setNextPrayer(next);

    // Schedule notifications if enabled
    if (settings.notificationsEnabled) {
      times.forEach(p => {
        if (p.id === 'sunrise') return;
        const { hour, minute } = getHourMinute(p.minutes);
        schedulePrayerNotification(p.id, p.name, hour, minute, false);
      });
    }
  }, [settings, location, loading]);

  const handleMarkPrayer = useCallback(async (prayerId: PrayerId, status: 'prayed' | 'qaza') => {
    const todayKey = getDateKey(new Date());
    await markPrayer(todayKey, prayerId, status);
    // Refresh stats on Journey
  }, []);

  const handleSettingsUpdate = useCallback(async (partial: Partial<AppSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    await saveSettings(updated);
  }, [settings]);

  if (loading) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bgBase} />
        <View style={{ height: 47 }} />
        <View style={[styles.screen, styles.centered]}>
          <Ionicons name="moon-outline" size={48} color={C.gold} />
          <Text style={styles.loadingText}>Nur Minimal</Text>
          <Text style={styles.loadingSubText}>Loading...</Text>
        </View>
        <View style={styles.tabBar} />
      </View>
    );
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':      return <HomeScreen prayerTimes={prayerTimes} nextPrayer={nextPrayer} settings={settings} onMarkPrayer={handleMarkPrayer} />;
      case 'countdown': return <CountdownScreen prayerTimes={prayerTimes} nextPrayer={nextPrayer} />;
      case 'calendar':  return <CalendarScreen prayerTimes={prayerTimes} />;
      case 'journey':   return <JourneyScreen />;
      case 'qibla':     return <QiblaScreen location={location} />;
      case 'settings':  return <SettingsScreen settings={settings} onUpdate={handleSettingsUpdate} />;
      default:          return <HomeScreen prayerTimes={prayerTimes} nextPrayer={nextPrayer} settings={settings} onMarkPrayer={handleMarkPrayer} />;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bgBase} />
      <View style={{ height: 47, backgroundColor: C.bgBase }} />
      <View style={styles.screenWrapper}>{renderScreen()}</View>
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
  root: { flex: 1, backgroundColor: C.bgBase },
  screenWrapper: { flex: 1 },
  screen: { flex: 1, backgroundColor: C.bgBase },
  screenPadding: { paddingHorizontal: 20, paddingBottom: 16 },
  centered: { alignItems: 'center', justifyContent: 'center' },

  card: {
    backgroundColor: C.bgSurface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 8,
    ...Platform.select({
      ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.09, shadowRadius: 16 },
      android: { elevation: 4 },
    }),
  },

  // Loading
  loadingText: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 24, fontWeight: '600', color: C.navy, marginTop: 16 },
  loadingSubText: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 14, color: C.textMuted, marginTop: 4 },

  // Hero
  heroCard: { flexDirection: 'row', alignItems: 'center' },
  heroLeft: { flex: 1 },
  heroLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: C.gold, marginBottom: 4 },
  heroTimeRow: { flexDirection: 'row', alignItems: 'flex-end' },
  heroTime: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 52, fontWeight: '600', color: C.navy, lineHeight: 54 },
  heroAmPm: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 22, fontWeight: '400', color: C.navySoft, marginLeft: 4, marginBottom: 6 },
  heroNextRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.gold, marginRight: 6 },
  heroNextText: { fontSize: 12, fontWeight: '500', color: C.textSecondary },
  heroRight: { marginLeft: 16 },
  progressRing: { width: 100, height: 100, borderRadius: 50, backgroundColor: C.goldPale, borderWidth: 6, borderColor: 'rgba(184,137,47,0.12)', alignItems: 'center', justifyContent: 'center' },
  progressPct: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 24, fontWeight: '600', color: C.gold },
  progressDay: { fontSize: 9, fontWeight: '500', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Section Header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  sectionTitle: { fontSize: 10, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: C.textMuted },
  sectionLink: { fontSize: 12, fontWeight: '500', color: C.gold },
  hintText: { fontSize: 11, color: C.textMuted, textAlign: 'center', marginTop: 8, marginBottom: 16 },

  // Prayer Row
  prayerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgSurface, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 6, ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 }, android: { elevation: 2 } }) },
  prayerRowBorder: {},
  prayerRowActive: { backgroundColor: C.goldPale, borderWidth: 1, borderColor: 'rgba(184,137,47,0.2)' },
  prayerIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(7,26,53,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  prayerIconActive: { backgroundColor: 'rgba(184,137,47,0.15)' },
  prayerInfo: { flex: 1 },
  prayerName: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 17, fontWeight: '500', color: C.navy },
  prayerNameActive: { color: C.navy },
  prayerArabic: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  prayerTime: { fontSize: 13, fontWeight: '500', color: C.textMuted, marginRight: 10 },
  prayerTimeActive: { color: C.gold, fontWeight: '600' },
  statusBadgeDone: { backgroundColor: C.emeraldPale, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusTextDone: { fontSize: 11, fontWeight: '600', color: C.emerald },
  statusBadgeNow: { backgroundColor: C.goldPale, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusTextNow: { fontSize: 11, fontWeight: '600', color: C.gold },
  statusBadgeQaza: { backgroundColor: 'rgba(107,114,128,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusTextQaza: { fontSize: 11, fontWeight: '600', color: C.textMuted },

  // Countdown
  cdHero: { alignItems: 'center', paddingVertical: 32 },
  cdLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: C.textMuted, marginBottom: 16 },
  cdTime: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 72, fontWeight: '300', color: C.navy, lineHeight: 74, letterSpacing: -2 },
  cdPrayer: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 24, fontWeight: '400', color: C.gold, marginTop: 6, marginBottom: 32 },
  cdDivider: { width: 40, height: 1, backgroundColor: C.borderStrong },
  cdCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgSurface, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 18, marginBottom: 8, ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 }, android: { elevation: 3 } }) },
  cdCardTime: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 26, fontWeight: '500', color: C.navy, marginRight: 12, minWidth: 90 },
  cdCardName: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 16, fontWeight: '500', color: C.textSecondary, flex: 1 },
  cdCardElapsed: { backgroundColor: 'rgba(107,114,128,0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  cdCardElapsedText: { fontSize: 11, fontWeight: '600', color: C.textMuted },

  // Calendar
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  calMonth: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 22, fontWeight: '600', color: C.navy },
  calHijri: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 14, color: C.gold, marginTop: 4 },
  calNav: { flexDirection: 'row', gap: 8 },
  calNavBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 }, android: { elevation: 2 } }) },
  calWeekdays: { flexDirection: 'row', marginBottom: 8 },
  calWeekday: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: C.textMuted, letterSpacing: 0.5 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDay: { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  calDayOther: { opacity: 0.3 },
  calDayToday: { backgroundColor: C.goldPale },
  calDaySelected: { backgroundColor: 'rgba(184,137,47,0.15)', borderWidth: 2, borderColor: C.gold },
  calDayNum: { fontSize: 14, fontWeight: '500', color: C.textPrimary },
  calDayNumToday: { color: C.gold, fontWeight: '700' },
  calDayNumOther: { color: C.textMuted },
  calDayHijri: { fontSize: 9, color: C.textMuted, marginTop: 2 },
  calDayHijriPrayed: { color: C.emerald },
  calPrayedDot: { position: 'absolute', bottom: 6, width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.emerald },
  calDetail: { backgroundColor: C.bgSurface, borderRadius: 16, padding: 16, marginTop: 8, ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 }, android: { elevation: 3 } }) },
  calDetailDate: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 17, fontWeight: '600', color: C.navy },
  calDetailHijri: { fontSize: 13, color: C.gold, marginTop: 2, marginBottom: 12 },
  calDetailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.border },
  calDetailPrayer: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 15, color: C.navy, flex: 1 },
  calDetailTime: { fontSize: 13, color: C.textMuted, marginRight: 8 },
  calDetailDone: { fontSize: 14, color: C.emerald, fontWeight: '700' },
  calDetailQaza: { fontSize: 12, color: C.textMuted, fontWeight: '600' },

  // Journey
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statValue: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 28, fontWeight: '600', color: C.navy, lineHeight: 30 },
  statLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', color: C.textMuted, marginTop: 4, textAlign: 'center' },
  heatmapCard: { padding: 18 },
  heatmapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  heatmapTitle: { fontSize: 13, fontWeight: '600', color: C.navy },
  heatmapLegend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heatmapLegendText: { fontSize: 10, color: C.textMuted },
  heatCell: { width: 14, height: 14, borderRadius: 3, backgroundColor: 'rgba(7,26,53,0.06)' },
  heatCellL1: { backgroundColor: C.goldPale },
  heatCellL2: { backgroundColor: 'rgba(184,137,47,0.35)' },
  heatCellL3: { backgroundColor: 'rgba(184,137,47,0.60)' },
  heatWeekdays: { flexDirection: 'row', marginBottom: 6 },
  heatDayLabel: { flex: 1, textAlign: 'center', fontSize: 9, color: C.textMuted },
  heatRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  heatCellBase: { flex: 1, aspectRatio: 1, borderRadius: 3, backgroundColor: 'rgba(7,26,53,0.04)' },
  weeklyCard: { padding: 18 },
  weeklyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  weeklyTitle: { fontSize: 13, fontWeight: '600', color: C.navy },
  weeklyTrend: { backgroundColor: C.emeraldPale, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  weeklyTrendText: { fontSize: 11, fontWeight: '600', color: C.emerald },
  weeklyBars: { flexDirection: 'row', gap: 8, height: 80 },
  wbarWrap: { flex: 1, alignItems: 'center' },
  wbarTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  wbar: { width: '100%', borderRadius: 4, backgroundColor: 'rgba(7,26,53,0.06)', minHeight: 4 },
  wbarFilled: { backgroundColor: C.gold },
  wbarLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted, marginTop: 6 },

  // Qibla
  qiblaWrap: { alignItems: 'center', paddingVertical: 32 },
  compassRing: { width: 220, height: 220, borderRadius: 110, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bgSurface, ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.11, shadowRadius: 24 }, android: { elevation: 5 } }) },
  compassMarker: { position: 'absolute', alignItems: 'center' },
  compassMarkerText: { fontSize: 12, fontWeight: '700', color: C.textMuted },
  compassInner: { width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bgSurface },
  compassDeg: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 32, fontWeight: '600', color: C.navy, lineHeight: 34 },
  compassBearing: { fontSize: 11, fontWeight: '600', color: C.textMuted, letterSpacing: 1, marginTop: 4 },
  qiblaCity: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 20, fontWeight: '500', color: C.navy, marginTop: 24 },
  qiblaDist: { fontSize: 13, color: C.textSecondary, marginTop: 4 },
  qiblaLocation: { fontSize: 12, color: C.textMuted, marginTop: 8 },
  qiblaInfoCard: { padding: 16 },
  qiblaInfoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  qiblaInfoText: { flex: 1, fontSize: 13, color: C.textSecondary, lineHeight: 20 },
  mosquePlaceholder: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  mosquePlaceholderText: { fontSize: 13, color: C.textMuted, textAlign: 'center' },

  // Settings
  settingsSectionTitle: { fontSize: 10, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: C.textMuted, paddingVertical: 12 },
  srow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 18 },
  srowBorder: { borderTopWidth: 1, borderTopColor: C.border },
  srowLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  srowIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  srowLabel: { fontSize: 15, fontWeight: '500', color: C.textPrimary },
  srowSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  srowValue: { fontSize: 13, color: C.textMuted, marginRight: 8 },

  // Tab Bar
  tabBar: {
    flexDirection: 'row', height: 80, backgroundColor: 'rgba(255,255,255,0.92)', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10,
    ...Platform.select({ ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12 }, android: { elevation: 8 } }),
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 4 },
  tabLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted },
  tabLabelActive: { color: C.gold },
});