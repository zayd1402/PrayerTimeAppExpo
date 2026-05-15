# Deployment Plan

This app is locally release-ready after the current stabilization pass, but store publication requires account credentials and store records that are not present on this machine.

## Current Local Release State

- Expo SDK 55 dependencies are aligned.
- Clean install, lint, typecheck, tests, Expo Doctor, production audit, iOS export, Android export, and EAS metadata lint pass.
- EAS CLI is available.
- EAS CLI is not logged in on this machine.
- Local Android native builds are blocked because Java/Android SDK are not configured.
- Local iOS native builds are blocked because CocoaPods is not installed.

## Required External Setup

1. Log in to Expo/EAS:
   ```bash
   npx eas-cli@latest login
   ```

2. Initialize or link the EAS project:
   ```bash
   npx eas-cli@latest init
   ```

3. Create store app records:
   - App Store Connect app for `com.prayertime.app`
   - Google Play Console app for `com.prayertime.app`

4. Replace placeholder URLs/contact values before metadata push:
   - `store.config.json` privacy policy URL
   - `store.config.json` support URL
   - App Review contact name, email, and phone

5. Configure credentials:
   ```bash
   npx eas-cli@latest credentials -p ios
   npx eas-cli@latest credentials -p android
   ```

6. Build beta binaries:
   ```bash
   npx eas-cli@latest build -p ios --profile production
   npx eas-cli@latest build -p android --profile production
   ```

7. Submit to beta tracks first:
   ```bash
   npx eas-cli@latest submit -p ios --latest
   npx eas-cli@latest submit -p android --latest --profile internal
   ```

8. Promote after real-device beta sign-off:
   - iOS: TestFlight to App Store review
   - Android: internal testing to production draft/staged rollout

## Approval Gate

Before running any credential setup, store metadata push, EAS build, or submit command, confirm the target Expo account, Apple team, Google Play app, privacy/support URLs, and whether the first release should go to beta only or production review.
