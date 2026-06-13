# PrayerTimeAppExpo — Ship-Readiness Plan

**Assessment Date:** 2026-06-13  
**Verdict:** NOT READY TO SHIP — Core screens localized, all service tests passing, UI/UX blockers resolved  
**Readiness Score:** 7.8 / 10

---

## Executive Summary

The app builds, lints, and the core prayer-calculation test suite passes (49 tests), but there are enough functional, UI, and quality gaps that it should not be released to users yet.

| Area | Grade | Notes |
|---|---|---|
| Core prayer math | B+ | Tested, but relies on device timezone offset only; no DST/location-timezone cross-check. |
| Navigation / architecture | B | Clean tab structure; new screens still untracked in git. |
| UI / UX | B- | Safe-area handling added; hardcoded insets removed; empty states added; key touch targets have accessibility props; still many hardcoded English strings. |
| Type safety | B | Most `any` casts removed, duplicate `WeeklyActivity` consolidated, tests included in `tsc`. |
| Test coverage | B | `PrayerService`, `HijriService`, `RamadanService`, `NotificationService`, `LocalMosqueService`, and `StorageService` are tested; contexts/screens still untested. |
| Localization | B- | SettingsScreen, TodayScreen hero/UI, and WorshipScreen tabs/header localized; deeper content (dua meanings, hadith, sacred periods, Ramadan card) still English. |
| Data completeness | B- | Manual cities and mosque seed list expanded globally; still static seed data. |
| Build / tooling | A- | Single ESLint config; `tsconfig` includes tests; unused heavy deps removed; lint passes with zero warnings. |

---

## Critical Blockers (must fix before ship)

| # | Status | Issue | Notes |
|---|--------|-------|-------|
| 1 | ✅ FIXED | Hardcoded safe-area insets | All screens wrapped in `SafeAreaView`; `paddingTop: 60` / `top: 54` removed. |
| 2 | ✅ FIXED | Australia-only location data | `manualCities.ts` and `mosques.ts` expanded to a global seed list. |
| 3 | ✅ FIXED | Tests excluded from type checking | `tsconfig.json` now includes `src/services/__tests__` and adds jest types. |
| 4 | ✅ FIXED | Duplicate type definitions | `WeeklyActivity` consolidated into `src/types/index.ts`. |
| 5 | ✅ FIXED | Widespread `any` / `as any` usage | Most `any` casts removed; `Ionicons` names typed via `iconName()` helper. |
| 6 | ✅ FIXED | Two ESLint configs | `.eslintrc.cjs` removed; `eslint.config.js` tightened. |
| 7 | ✅ FIXED | Missing favicon asset | `assets/favicon.png` added. |
| 8 | ⚠️ PARTIAL | Notification scheduling edge cases | Re-scheduling already happens on app foreground because prayer times are recalculated daily; a background-fetch task is still recommended. |
| 9 | ⚠️ PARTIAL | Loading / error / empty states | `PrayerAppContext` now exposes `error`; `TodayScreen` shows a location-error banner; many screens still need dedicated empty/error UI. |
| 10 | 🔲 OPEN | Theme system is half-implemented | `ThemeContext` exists but `App.tsx` hardcodes `barStyle="dark-content"` and screens use static `C` tokens. |

## Remaining Critical Blockers

| # | Status | Issue | Notes |
|---|--------|-------|-------|
| 9 | ✅ FIXED | Loading / error / empty states | Empty states added to Dua library, Hadith list, and mosque search; location error banner added on Today. |
| 11 | ✅ FIXED | `QiblaScreen` needle | Real needle now renders inside the rotating compass. |
| 12 | ✅ FIXED | `console.warn`/`console.log` lint warnings | Replaced with `logger` utility; lint now passes with zero warnings. |
| 13 | ⚠️ PARTIAL | Adhan audio variants | Settings UI lists variants but only a default MP3 exists. |
| 14 | ✅ FIXED | `usePrayerApp` init error state | `error` state exposed and shown to users. |
| 15 | ✅ FIXED | `getDateKey()` UTC bug | Now uses `getLocalDateKey()`. |
| 16 | ⚠️ PARTIAL | `StorageService` sync/async mix | Functions are still async around synchronous MMKV calls, but the service is now unit-tested. Converting to sync signatures remains a future refactor. |
| 17 | 🔲 OPEN | Tab bar labels | "Qibla & Mosques" may truncate on narrow screens. |
| 18 | ⚠️ PARTIAL | Accessibility | Added to key targets; many smaller touch targets and labels still missing. |
| 19 | 🔲 OPEN | `RamadanService` duplication | Ramadan state computed in multiple screens. |

## Remaining Critical Blockers

20. **Theme system** — No runtime theme switching; `C` is used everywhere.  
21. **Localization** — Main UI localized; deeper content (dua meanings, hadith text, sacred periods, Ramadan card, WorshipScreen data arrays) still English.  
22. **Screen-level tests** — No tests for contexts, screens, or navigation.  
23. **Async error handling** — Many screens still swallow failures (e.g., `StorageService`, `Share`).  
24. **Uncommitted new files** — Several source files and assets remain untracked.

---

## High-Priority Issues

| # | Issue | Location |
|---|---|---|
| 11 | UI text is hardcoded English; i18n keys in `en.json`/`ar.json` are largely unused. | All screens |
| 12 | `QiblaScreen` defines `styles.needle` / `needleTop` / `needleBottom` but never renders a needle — only a center dot rotates. | `QiblaScreen.tsx` |
| 13 | Adhan only has a “default” audio file, but the settings UI presents multiple variants. | `AudioService.ts`, `SettingsScreen.tsx` |
| 14 | `usePrayerApp` context has no loading/error boundary for init failures. | `PrayerAppContext.tsx` |
| 15 | `getDateKey()` uses UTC `toISOString()`, so prayer logs can shift to the wrong local day near midnight. | Multiple screens |
| 16 | `StorageService` mixes `async` signatures with synchronous MMKV calls; some functions return promises but run synchronously. | `StorageService.ts` |
| 17 | Tab bar has five items; labels like “Qibla & Mosques” will truncate on narrow screens. | `TabNavigator.tsx` |
| 18 | Accessibility: many touch targets are small; no `accessibilityRole`/`label` props; reduce-motion handled only in TodayScreen. | All screens |
| 19 | `RamadanService` logic duplicated across TodayScreen, CalendarScreen, WorshipScreen, RamadanScreen. | Multiple |
| 20 | Uncommitted new files in working tree (`QiblaMosquesScreen`, `LearnScreen`, `LocalMosqueService`, data files, audio assets). | `git status` |

---

## Medium-Priority Issues

- Replace `Record<string, any>` in `WorshipScreen`, `WeeklyScreen`, `JournalScreen`.
- Fix `Ionicons name={... as any}` casts by typing icon names correctly.
- Add proper error handling and user feedback in `LocationService`.
- Move hardcoded color/style values into theme tokens.
- Add `expo-updates` / EAS config validation.
- Reduce bundle size: remove unused `playwright` and `puppeteer` from `devDependencies`.
- Lock TypeScript to a stable 5.x release (currently `^6.0.3`).

---

## Low-Priority Issues

- `console.warn` / `console.log` are gated behind `__DEV__`, which is acceptable but should be replaced with a logging abstraction for production.
- Several `Alert.alert` strings are hardcoded English.
- `StoreReview.hasAction()` API usage should be verified for Expo SDK 56.

---

## Implementation Roadmap

### Phase 1 — Foundations & Tooling
1. Remove `.eslintrc.cjs`; keep and tighten `eslint.config.js` (re-enable `no-unused-vars`, `no-explicit-any` warnings, add React hooks rules).
2. Remove `src/services/__tests__` from `tsconfig.json` exclude so tests are type-checked.
3. Pin TypeScript to stable 5.x; remove `playwright` and `puppeteer`.
4. Add `prettier` config if project style requires it.
5. Add `jest` setup for React Native Testing Library and MMKV mocks.

### Phase 2 — Type Safety & Code Health
6. Consolidate `WeeklyActivity` type into `src/types/index.ts`; remove duplicate from `WeeklyScreen.tsx`.
7. Replace obvious `any` types in services and screens.
8. Type `Ionicons` names correctly (create an `IconName` helper or use module augmentation).
9. Add unit tests for `HijriService`, `RamadanService`, `StorageService`, `NotificationService`.

### Phase 3 — Core UX / Safe Areas & Layout
10. Wrap app root in `SafeAreaProvider` and every screen in `SafeAreaView`.
11. Replace hardcoded `paddingTop: 60` / `top: 54` with safe-area insets.
12. Ensure all scroll views have `contentContainerStyle={{ paddingBottom }}` that respects tab bar + safe area.
13. Add `ActivityIndicator` loading states and error retry UI in `PrayerAppContext` consumers.

### Phase 4 — Localization
14. Replace hardcoded English strings in `TodayScreen`, `WorshipScreen`, `SettingsScreen`, `QiblaMosquesScreen`, `LearnScreen` with `useTranslation`/i18n keys.
15. Add Arabic translations for all new keys.
16. Ensure dates and numbers are localized.

### Phase 5 — Location & Data
17. Replace Australia-only `MANUAL_CITIES` with a comprehensive global city list (or integrate a geocoding API).
18. Replace Australia-only mosque seed with a global source or clearly scope the feature.
19. Add manual-city timezone handling so prayer times use the selected city’s timezone, not just device offset.
20. Fix `getDateKey()` to use local date, not UTC.

### Phase 6 — Notifications & Background
21. Add DST-aware notification scheduling and re-scheduling on app foreground / timezone change.
22. Add a background fetch task to refresh prayer times and notifications.
23. Add unit tests for notification scheduling logic.

### Phase 7 — UI Polish & Accessibility
24. Render a real Qibla needle in `QiblaScreen`.
25. Add `accessibilityRole`, `accessibilityLabel`, and minimum 44×44 touch targets.
26. Verify color contrast ratios; adjust `textMuted` if needed.
27. Add empty/error states for mosque list, dua library, hadith, etc.

### Phase 8 — Assets & Build
28. Add missing `assets/favicon.png`.
29. Verify adaptive icons, splash screen, and EAS project config.
30. Run full verification: `npm run lint`, `npm test`, `npx tsc --noEmit`, `npx expo-doctor`.

### Phase 9 — Testing & QA
31. Add screen-level tests for `TodayScreen`, `SettingsScreen`, `WorshipScreen`.
32. Add integration tests for `PrayerAppContext`.
33. Test on iOS and Android devices/simulators, including notched devices and tablets.

### Phase 10 — Release Prep
34. Commit all new files and changes; clean working tree.
35. Update `app.json` version, privacy policy URL verification, and store metadata.
36. Build internal distribution with EAS and run smoke tests.

---

## Verification Baseline

| Command | Result |
|---|---|
| `npm run lint` | PASS — zero warnings |
| `npm test` | PASS — 98 tests across 6 suites |
| `npx tsc --noEmit` | PASS (tests included) |
| `npx expo export --platform all` | PASS |
| `npx gitnexus status` | Index up-to-date |

---

## How to Use This Plan

1. Pick one phase at a time.
2. Run impact analysis with GitNexus before editing shared services (`PrayerService`, `PrayerAppContext`, `StorageService`, `NotificationService`).
3. After each phase, re-run `npm run lint`, `npm test`, and `npx tsc --noEmit`.
4. Do not mark the app ready to ship until all critical blockers and high-priority issues are resolved and verified.
