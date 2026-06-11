# Graph Report - PrayerTimeAppExpo  (2026-06-11)

## Corpus Check
- 56 files · ~45,746 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 926 nodes · 1365 edges · 33 communities (30 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4f5b36e1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 45|Community 45]]

## God Nodes (most connected - your core abstractions)
1. `load()` - 33 edges
2. `C` - 26 edges
3. `save()` - 20 edges
4. `What You Must Do When Invoked` - 16 edges
5. `/graphify` - 15 edges
6. `expo` - 14 edges
7. `compilerOptions` - 14 edges
8. `/graphify` - 14 edges
9. `What You Must Do When Invoked` - 14 edges
10. `loadPrayerLog()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `HomeScreen()` --calls--> `minutesToTimeString()`  [EXTRACTED]
  App.tsx → src/services/PrayerService.ts
- `HomeScreen()` --calls--> `getTimeUntilNext()`  [EXTRACTED]
  App.tsx → src/services/PrayerService.ts
- `QiblaScreen()` --calls--> `calculateQiblaDirection()`  [EXTRACTED]
  App.tsx → src/services/PrayerService.ts
- `QiblaScreen()` --calls--> `bearingToCompassDirection()`  [EXTRACTED]
  App.tsx → src/services/PrayerService.ts
- `Props` --references--> `PrayerId`  [EXTRACTED]
  src/components/KhushuModal.tsx → src/types/index.ts

## Communities (33 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (33): QiblaScreen(), accStyles, bearingToDirection(), calculateQibla(), calStyles, COMPASS_SIZE, Coordinate, haversine() (+25 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (38): code:block1 (/graphify                                             # full), code:bash (if [ ! -f graphify-out/.graphify_python ]; then), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash (if [ ! -f graphify-out/.graphify_extract.json ]; then), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat graphify-out/.graphify_python) -c ") (+30 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (49): code:bash ($(cat graphify-out/.graphify_python) -c "), code:block11 ([Agent tool call 1: files 1-15, subagent_type="general-purpo), code:bash (PROJECT_ROOT=$(cat graphify-out/.graphify_root)), code:block13 (You are a graphify extraction subagent. Read the files liste), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat graphify-out/.graphify_python) -c ") (+41 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (34): code:block1 (/graphify                                             # full), code:bash ($(cat .graphify_python) -c "), code:bash ($(cat .graphify_python) -c "), code:bash (if [ ! -f graphify-out/.graphify_extract.json ]; then), code:bash ($(cat .graphify_python) -c "), code:bash ($(cat .graphify_python) -c "), code:bash ($(cat .graphify_python) -c "), code:bash ($(cat .graphify_python) -c ") (+26 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (43): code:block10 (You are a graphify extraction subagent. Read the files liste), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat .graphify_python) -c "), code:bash ($(cat .graphify_python) -c "), code:bash ($(cat .graphify_python) -c "), code:bash (mkdir -p graphify-out), code:bash ($(cat .graphify_python) -c "), code:bash ($(cat .graphify_python) -c ") (+35 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (33): backgroundColor, foregroundImage, adaptiveIcon, package, permissions, projectId, expo, android (+25 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (43): dependencies, babel-preset-expo, expo, expo-asset, expo-av, expo-background-fetch, expo-constants, expo-font (+35 more)

### Community 7 - "Community 7"
Cohesion: 0.02
Nodes (90): app.name, app.tagline, calendar.dayStreak, calendar.islamicEvents, calendar.noEvents, calendar.noPrayers, calendar.ofCompleted, calendar.onTime (+82 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (27): description, devDependencies, @babel/core, eslint, playwright, puppeteer, @types/react, typescript (+19 more)

### Community 10 - "Community 10"
Cohesion: 0.15
Nodes (8): catStyles, counterStyles, DUAS, duaStyles, styles, { width }, DUA_CATEGORIES, DuaCategory

### Community 11 - "Community 11"
Cohesion: 0.02
Nodes (90): app.name, app.tagline, calendar.dayStreak, calendar.islamicEvents, calendar.noEvents, calendar.noPrayers, calendar.ofCompleted, calendar.onTime (+82 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, customConditions, esModuleInterop, jsx, lib, module, moduleDetection (+10 more)

### Community 13 - "Community 13"
Cohesion: 0.05
Nodes (41): ALL_LESSONS, getLessonForDate(), KnowledgeLesson, TOPIC_ORDER, getTargets(), RamadanDayLog, RamadanScreen(), RamadanTargets (+33 more)

### Community 14 - "Community 14"
Cohesion: 0.06
Nodes (35): ErrorBoundary, Props, State, styles, darkC, ThemeContext, ThemeContextValue, ThemeMode (+27 more)

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (19): DISTRACTIONS, LEVELS, Props, styles, DUAS, addKhushuEntry(), DEFAULT_PRAYER_NOTIFICATIONS, DhikrSession (+11 more)

### Community 16 - "Community 16"
Cohesion: 0.21
Nodes (8): SUNNAH_ROUTINE, SunnahItem, CATEGORIES, Category, getDateKey(), styles, SunnahRoutineScreen(), { width }

### Community 17 - "Community 17"
Cohesion: 0.40
Nodes (3): { chromium }, fs, path

### Community 19 - "Community 19"
Cohesion: 0.06
Nodes (58): FRIDAY_CHECKLIST, KAHF_SECTIONS, styles, chartStyles, dhikrStyles, DUAS, FASTING_TYPES, styles (+50 more)

### Community 20 - "Community 20"
Cohesion: 0.27
Nodes (9): getDailyHadith(), getHadithByCategory(), getHadithCategories(), HADITHS, HadithScreen(), styles, getLastHadithIndex(), setLastHadithIndex() (+1 more)

### Community 22 - "Community 22"
Cohesion: 0.29
Nodes (6): Always Do, CLI, GitNexus — Code Intelligence, graphify, Never Do, Resources

### Community 24 - "Community 24"
Cohesion: 0.29
Nodes (6): Always Do, CLI, GitNexus — Code Intelligence, graphify, Never Do, Resources

### Community 25 - "Community 25"
Cohesion: 0.20
Nodes (8): MORE_MENU, MoreItemId, styles, { width: SCREEN_WIDTH }, HajjTab, styles, TABS, C

### Community 26 - "Community 26"
Cohesion: 0.05
Nodes (48): getHourMinute(), getScheduleKey(), minutesFromMidnight(), PrayerAppContext, PrayerAppProvider(), PrayerAppState, scheduleEnabledNotifications(), MANUAL_CITIES (+40 more)

### Community 28 - "Community 28"
Cohesion: 0.18
Nodes (11): LOCAL_MOSQUES, LocalMosque, Coordinate, Mosque, MosquesScreenProps, styles, getNearbyMosques(), getNearestMosque() (+3 more)

### Community 29 - "Community 29"
Cohesion: 0.25
Nodes (6): DAY_NAMES, DAY_SHORT, styles, SUNNAH_REVIVAL, WEEKLY_ACTIVITIES, WeeklyActivity

### Community 30 - "Community 30"
Cohesion: 0.33
Nodes (5): { chromium }, OUTPUT, path, screens, VIEWPORT

### Community 33 - "Community 33"
Cohesion: 0.17
Nodes (10): HifdhSession, styles, SURAH_NAMES, DEATH_REMINDERS, getDateKey(), HEART_CHECKS, styles, TazkiyahEntry (+2 more)

### Community 34 - "Community 34"
Cohesion: 0.15
Nodes (11): usePrayerApp(), MoreScreen(), styles, Tab, TABS, LEARN_ITEMS, LearnScreen(), LearnSection (+3 more)

### Community 38 - "Community 38"
Cohesion: 0.29
Nodes (5): MOODS, PRAYER_NAMES, styles, getKhushuAverage(), PRAYER_IDS

## Knowledge Gaps
- **526 isolated node(s):** `styles`, `name`, `slug`, `version`, `orientation` (+521 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `C` connect `Community 25` to `Community 0`, `Community 33`, `Community 34`, `Community 38`, `Community 10`, `Community 13`, `Community 14`, `Community 15`, `Community 16`, `Community 19`, `Community 20`, `Community 26`, `Community 28`, `Community 29`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `What You Must Do When Invoked` connect `Community 2` to `Community 1`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `/graphify` connect `Community 1` to `Community 2`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `styles`, `name`, `slug` to the rest of the system?**
  _526 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07317073170731707 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.04081632653061224 - nodes in this community are weakly interconnected._