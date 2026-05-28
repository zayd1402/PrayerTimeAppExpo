# Graph Report - PrayerTimeAppExpo  (2026-05-28)

## Corpus Check
- 23 files · ~26,475 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 390 nodes · 449 edges · 25 communities (20 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ab2e0b14`
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
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]

## God Nodes (most connected - your core abstractions)
1. `What You Must Do When Invoked` - 16 edges
2. `/graphify` - 15 edges
3. `expo` - 14 edges
4. `/graphify` - 14 edges
5. `What You Must Do When Invoked` - 14 edges
6. `calculatePrayerTimes()` - 9 edges
7. `scripts` - 8 edges
8. `loadPrayerLog()` - 8 edges
9. `Part B - Semantic extraction (parallel subagents)` - 8 edges
10. `Part B - Semantic extraction (parallel subagents)` - 8 edges

## Surprising Connections (you probably didn't know these)
- `HomeScreen()` --calls--> `getTimeUntilNext()`  [EXTRACTED]
  App.tsx → src/services/PrayerService.ts
- `HomeScreen()` --calls--> `minutesToTimeString()`  [EXTRACTED]
  App.tsx → src/services/PrayerService.ts
- `QiblaScreen()` --calls--> `bearingToCompassDirection()`  [EXTRACTED]
  App.tsx → src/services/PrayerService.ts
- `QiblaScreen()` --calls--> `calculateQiblaDirection()`  [EXTRACTED]
  App.tsx → src/services/PrayerService.ts

## Communities (25 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (39): CalendarScreen(), CountdownScreen(), formatCountdown(), getDateKey(), HomeScreen(), JourneyScreen(), minutesFromMidnight(), styles (+31 more)

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
Cohesion: 0.07
Nodes (30): code:bash (mkdir -p graphify-out), code:bash ($(cat .graphify_python) -c "), code:bash ($(cat .graphify_python) -c "), code:bash ($(cat .graphify_python) -c "), code:bash ($(cat .graphify_python) -c "), code:bash (# Detect the correct Python interpreter (handles pipx, venv,), code:bash ($(cat .graphify_python) -c "), code:bash ($(cat .graphify_python) -c ") (+22 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (29): backgroundColor, foregroundImage, adaptiveIcon, package, permissions, projectId, expo, android (+21 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (22): dependencies, expo, expo-asset, expo-constants, expo-font, expo-linking, expo-location, @expo/metro-config (+14 more)

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (16): QiblaScreen(), bearingToCompassDirection(), calculatePrayerTimes(), calculateQiblaDirection(), computeAsrTime(), computeMaghrib(), computeTime(), getEquationOfTime() (+8 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (18): description, devDependencies, @babel/core, puppeteer, @types/react, typescript, main, name (+10 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (8): getMonthGrid(), gregorianToHijri(), gregorianToJulianDay(), HIJRI_MONTHS_AR, HIJRI_MONTHS_EN, HijriDate, HijriService, julianDayToHijri()

### Community 10 - "Community 10"
Cohesion: 0.15
Nodes (13): code:block10 (You are a graphify extraction subagent. Read the files liste), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat .graphify_python) -c "), code:bash ($(cat .graphify_python) -c "), code:bash ($(cat .graphify_python) -c "), code:bash ($(cat .graphify_python) -c "), code:bash ($(cat .graphify_python) -c "), code:block8 (spawn_agent(agent_type="worker", message="Your task is to pe) (+5 more)

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (13): code:bash ($(cat graphify-out/.graphify_python) -c "), code:block11 ([Agent tool call 1: files 1-15, subagent_type="general-purpo), code:bash (PROJECT_ROOT=$(cat graphify-out/.graphify_root)), code:block13 (You are a graphify extraction subagent. Read the files liste), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat graphify-out/.graphify_python) -c ") (+5 more)

### Community 12 - "Community 12"
Cohesion: 0.18
Nodes (10): compilerOptions, esModuleInterop, jsx, moduleResolution, noEmit, skipLibCheck, strict, exclude (+2 more)

### Community 13 - "Community 13"
Cohesion: 0.25
Nodes (8): formatTime(), Prayer, PRAYERS, PrayerTimes, styles, TodayScreen(), TodayScreenProps, TRACKABLE

### Community 14 - "Community 14"
Cohesion: 0.25
Nodes (6): CalculationMethod, Madhhab, METHODS, Settings, SettingsScreenProps, styles

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (4): Coordinate, Mosque, MosquesScreenProps, styles

### Community 16 - "Community 16"
Cohesion: 0.40
Nodes (4): DEFAULT_LOCATION, getCurrentLocation(), LocationResult, requestLocationPermission()

### Community 17 - "Community 17"
Cohesion: 0.40
Nodes (3): { chromium }, fs, path

### Community 18 - "Community 18"
Cohesion: 0.40
Nodes (3): Coordinate, QiblaScreenProps, styles

### Community 19 - "Community 19"
Cohesion: 0.40
Nodes (3): DUAS, styles, SUNNAH_TRACKER

## Knowledge Gaps
- **211 isolated node(s):** `styles`, `name`, `slug`, `version`, `orientation` (+206 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `What You Must Do When Invoked` connect `Community 2` to `Community 1`, `Community 11`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `/graphify` connect `Community 1` to `Community 2`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `What You Must Do When Invoked` connect `Community 4` to `Community 10`, `Community 3`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `styles`, `name`, `slug` to the rest of the system?**
  _211 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07215686274509804 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._