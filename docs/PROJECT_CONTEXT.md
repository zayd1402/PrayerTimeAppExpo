# Project Context

## What This Project Is

A cross-platform (iOS/Android) Muslim prayer time app built with Expo SDK 56 + React Native. Calculates prayer times, Qibla direction, displays Islamic calendar, provides duas/hadiths, tracks worship, and plays Adhan.

## What Matters Most

1. **Prayer time accuracy** — Complex astronomical calculations in `PrayerService.ts` must remain correct
2. **Notification reliability** — Prayer alarms must fire on time across iOS/Android
3. **Location permissions** — The app requires GPS for prayer time calculation
4. **Design consistency** — The warm amber/gold design system in `DESIGN.md` must be respected
5. **Bidirectional i18n** — English and Arabic must stay in sync

## Current Engineering State

- **Active development** — Multiple untracked files indicate work in progress
- **No tests** — Quality depends on TypeScript strict mode and linting
- **No CI** — All verification is manual
- **Generated native code** — `ios/` and `android/` are gitignored and regenerated
- **Knowledge graph** — GitNexus index exists with 1108 symbols and 1792 relationships

## Current Missing Infrastructure

- Test framework (jest/vitest)
- CI pipeline (GitHub Actions)
- E2E tests (Playwright is installed but unused)
- Dependency auditing
- Secret scanning

## Best First Verification Command

```
npx tsc --noEmit
```

## Best Full Verification Sequence

```
npx tsc --noEmit && npx eslint .
```

## Manual Project Notes

<!-- PROJECT-HARNESS:MANUAL-START -->
Add human-maintained project notes here.
<!-- PROJECT-HARNESS:MANUAL-END -->
