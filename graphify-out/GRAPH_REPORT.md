# Graph Report - PrayerTimeAppExpo  (2026-06-06)

## Corpus Check
- 33 files · ~29,496 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 559 nodes · 786 edges · 24 communities (23 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0d1eee0e`
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
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 30|Community 30]]

## God Nodes (most connected - your core abstractions)
1. `C` - 17 edges
2. `What You Must Do When Invoked` - 16 edges
3. `/graphify` - 15 edges
4. `expo` - 14 edges
5. `/graphify` - 14 edges
6. `What You Must Do When Invoked` - 14 edges
7. `loadPrayerLog()` - 10 edges
8. `calculatePrayerTimes()` - 10 edges
9. `scripts` - 8 edges
10. `PrayerId` - 8 edges

## Surprising Connections (you probably didn't know these)
- `HomeScreen()` --calls--> `minutesToTimeString()`  [EXTRACTED]
  App.tsx → src/services/PrayerService.ts
- `HomeScreen()` --calls--> `getTimeUntilNext()`  [EXTRACTED]
  App.tsx → src/services/PrayerService.ts
- `QiblaScreen()` --calls--> `calculateQiblaDirection()`  [EXTRACTED]
  App.tsx → src/services/PrayerService.ts
- `QiblaScreen()` --calls--> `bearingToCompassDirection()`  [EXTRACTED]
  App.tsx → src/services/PrayerService.ts
- `MoreScreen()` --calls--> `usePrayerApp()`  [EXTRACTED]
  src/navigation/MoreScreen.tsx → src/context/PrayerAppContext.tsx

## Communities (24 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (41): PrayerAppContext, PrayerAppProvider(), PrayerAppState, CalendarScreen(), CountdownScreen(), formatCountdown(), getDateKey(), HomeScreen() (+33 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (38): code:block1 (/graphify                                             # full), code:bash (if [ ! -f graphify-out/.graphify_python ]; then), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash (if [ ! -f graphify-out/.graphify_extract.json ]; then), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat graphify-out/.graphify_python) -c ") (+30 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (36): code:bash (mkdir -p graphify-out), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash (LOCAL_PATH=$(graphify clone <github-url> [--branch <branch>]), code:bash (graphify export obsidian), code:bash (graphify export html  # auto-aggregates to community view if), code:bash (graphify export wiki), code:bash (graphify export neo4j), code:bash (graphify export neo4j --push bolt://localhost:7687 --user ne) (+28 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (34): code:block1 (/graphify                                             # full), code:bash ($(cat .graphify_python) -c "), code:bash ($(cat .graphify_python) -c "), code:bash (if [ ! -f graphify-out/.graphify_extract.json ]; then), code:bash ($(cat .graphify_python) -c "), code:bash ($(cat .graphify_python) -c "), code:bash ($(cat .graphify_python) -c "), code:bash ($(cat .graphify_python) -c ") (+26 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (43): code:block10 (You are a graphify extraction subagent. Read the files liste), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat .graphify_python) -c "), code:bash ($(cat .graphify_python) -c "), code:bash ($(cat .graphify_python) -c "), code:bash (mkdir -p graphify-out), code:bash ($(cat .graphify_python) -c "), code:bash ($(cat .graphify_python) -c ") (+35 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (29): backgroundColor, foregroundImage, adaptiveIcon, package, permissions, projectId, expo, android (+21 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (33): dependencies, expo, expo-asset, expo-constants, expo-font, @expo-google-fonts/bodoni-moda, @expo-google-fonts/inter, @expo-google-fonts/jost (+25 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (18): description, devDependencies, @babel/core, puppeteer, @types/react, typescript, main, name (+10 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (8): getMonthGrid(), gregorianToHijri(), gregorianToJulianDay(), HIJRI_MONTHS_AR, HIJRI_MONTHS_EN, HijriDate, HijriService, julianDayToHijri()

### Community 10 - "Community 10"
Cohesion: 0.13
Nodes (12): catStyles, counterStyles, DUAS, duaStyles, styles, { width }, getFavoriteDuas(), isFavoriteDua() (+4 more)

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (13): code:bash ($(cat graphify-out/.graphify_python) -c "), code:block11 ([Agent tool call 1: files 1-15, subagent_type="general-purpo), code:bash (PROJECT_ROOT=$(cat graphify-out/.graphify_root)), code:block13 (You are a graphify extraction subagent. Read the files liste), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat graphify-out/.graphify_python) -c ") (+5 more)

### Community 12 - "Community 12"
Cohesion: 0.18
Nodes (10): compilerOptions, esModuleInterop, jsx, moduleResolution, noEmit, skipLibCheck, strict, exclude (+2 more)

### Community 13 - "Community 13"
Cohesion: 0.14
Nodes (15): usePrayerApp(), MoreScreen(), formatTime(), getIqamaTime(), getTimeUntil(), Prayer, PrayerRow(), PRAYERS (+7 more)

### Community 17 - "Community 17"
Cohesion: 0.40
Nodes (3): { chromium }, fs, path

### Community 18 - "Community 18"
Cohesion: 0.16
Nodes (13): accStyles, bearingToDirection(), calculateQibla(), calStyles, COMPASS_SIZE, Coordinate, haversine(), QiblaScreen() (+5 more)

### Community 19 - "Community 19"
Cohesion: 0.05
Nodes (52): getEventsForHijriDate(), ISLAMIC_EVENTS, CalendarScreen(), EVENT_COLORS, EVENT_ICONS, getDateKey(), styles, chartStyles (+44 more)

### Community 20 - "Community 20"
Cohesion: 0.23
Nodes (11): getDailyHadith(), getHadithByCategory(), getHadithCategories(), HADITHS, HadithScreen(), styles, getFavoriteHadiths(), getLastHadithIndex() (+3 more)

### Community 21 - "Community 21"
Cohesion: 0.05
Nodes (39): MORE_MENU, MoreItemId, styles, { width: SCREEN_WIDTH }, Tab, FRIDAY_CHECKLIST, KAHF_SECTIONS, styles (+31 more)

### Community 22 - "Community 22"
Cohesion: 0.29
Nodes (6): Always Do, CLI, GitNexus — Code Intelligence, graphify, Never Do, Resources

### Community 24 - "Community 24"
Cohesion: 0.29
Nodes (6): Always Do, CLI, GitNexus — Code Intelligence, graphify, Never Do, Resources

### Community 26 - "Community 26"
Cohesion: 0.21
Nodes (5): cancelPrayerNotification(), hasNotificationPermission(), requestNotificationPermission(), scheduleFajrAlarm(), schedulePrayerNotification()

### Community 30 - "Community 30"
Cohesion: 0.33
Nodes (5): { chromium }, OUTPUT, path, screens, VIEWPORT

## Knowledge Gaps
- **273 isolated node(s):** `styles`, `name`, `slug`, `version`, `orientation` (+268 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `C` connect `Community 21` to `Community 0`, `Community 10`, `Community 13`, `Community 18`, `Community 19`, `Community 20`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `What You Must Do When Invoked` connect `Community 2` to `Community 1`, `Community 11`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `/graphify` connect `Community 1` to `Community 2`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `styles`, `name`, `slug` to the rest of the system?**
  _273 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05901639344262295 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._