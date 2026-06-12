# Architecture

## High-Level Architecture

React Native Expo mobile app with a flat component hierarchy and React Context for global state. The app uses a bottom tab navigator with five tabs, each loading its own screen component. Services are standalone TypeScript modules with no dependency injection — they're imported directly by context providers and screens.

**Stack:** React 19 (UI) → React Navigation 7 (routing) → React Context (state) → Services (logic) → Expo APIs (native)

## Main Modules

| Module | Location | Responsibility |
|---|---|---|
| TabNavigator | `src/navigation/TabNavigator.tsx` | Bottom tab routing (5 tabs) |
| PrayerAppContext | `src/context/PrayerAppContext.tsx` | Global app state, prayer times, logging |
| ThemeContext | `src/context/ThemeContext.tsx` | Light/dark/system theme switching |
| PrayerService | `src/services/PrayerService.ts` | Astronomical prayer time calculation |
| LocationService | `src/services/LocationService.ts` | Device GPS location |
| NotificationService | `src/services/NotificationService.ts` | Prayer notifications, alarms |
| StorageService | `src/services/StorageService.ts` | MMKV key-value persistence |
| AudioService | `src/services/AudioService.ts` | Adhan audio playback |
| HijriService | `src/services/HijriService.ts` | Islamic date conversion |
| TimezoneService | `src/services/TimezoneService.ts` | Timezone offset calculation |
| TodayScreen | `src/screens/TodayScreen.tsx` | Main screen — next prayer, countdown, hadith |
| WorshipScreen | `src/screens/WorshipScreen.tsx` | Prayer logging, worship tracking |
| SettingsScreen | `src/screens/SettingsScreen.tsx` | App configuration |

## Data Flow

```
User interaction → Screen component → Context (PrayerAppContext)
  → Service layer (PrayerService, LocationService, etc.)
  → Expo native API → OS
  ← State update via Context
  ← Re-render
```

State flows unidirectionally: services produce data → context holds state → screens consume via hooks. No Redux, no Zustand — just React Context + useState/useCallback.

## Integration Points

- **expo-location**: GPS coordinate fetching with foreground/background permissions
- **expo-notifications**: Local notification scheduling for prayer times
- **expo-av**: Adhan audio playback
- **expo-background-fetch** + **expo-task-manager**: Background prayer time checks
- **react-native-mmkv**: Persistent key-value storage
- **react-native-reanimated**: Animations (preferred over Animated API)

## Dependency Boundaries

- Screens import from services, context, data, and types only
- Context imports from services, data, and types
- Services import from types and other services (minimal cross-service coupling)
- Data files are static — no service imports
- Navigation imports screens but screens don't import navigation

## Architecture Rules for Agents

- Follow existing patterns (Context + hooks + service modules).
- Do not introduce new architecture layers without approval (no Redux, no DI framework, no inversion of control).
- Keep changes close to the affected feature.
- Avoid cross-cutting refactors unless explicitly requested.
- Do not add new npm packages without confirming necessity.

## Unknowns

- Exact background task behavior across iOS/Android (known to be fragile)
- Whether the app handles edge cases in prayer time calculation for extreme latitudes
- Full test coverage state (none exists)

## Manual Project Notes

<!-- PROJECT-HARNESS:MANUAL-START -->
Add human-maintained project notes here.
<!-- PROJECT-HARNESS:MANUAL-END -->
