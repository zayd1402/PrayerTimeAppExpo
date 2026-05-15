# Release Checklist

## Local Gates

- [x] `npm ci`
- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] `npx expo-doctor`
- [x] `npm audit --omit=dev`
- [x] `npx expo export --platform ios --output-dir .expo-export-smoke`
- [x] `npx expo export --platform android --output-dir .expo-export-smoke`

## Store Prerequisites

- [ ] Confirm final app name and bundle/package IDs.
- [ ] Create Expo/EAS project and replace local app ownership/project metadata if needed.
- [ ] Create App Store Connect app for `com.prayertime.app`.
- [ ] Create Google Play Console app for `com.prayertime.app`.
- [ ] Host privacy policy and support pages on production URLs.
- [ ] Add App Store Connect app ID to `ASC_APP_ID` in the release environment.
- [ ] Configure Apple credentials through EAS.
- [ ] Configure Google Play service account through EAS Secrets or local secure file path.
- [ ] Upload screenshots for required iPhone, iPad, Android phone, and Android tablet sizes.
- [ ] Complete Apple privacy nutrition labels.
- [ ] Complete Google Play Data Safety, content rating, and target audience declarations.

## Beta Release

- [ ] Build iOS production binary with `npx eas-cli@latest build -p ios --profile production`.
- [ ] Build Android production AAB with `npx eas-cli@latest build -p android --profile production`.
- [ ] Submit iOS to TestFlight first.
- [ ] Submit Android to Play internal testing first.
- [ ] Test install, first launch, location denial, location approval, prayer alerts, Qibla screen, settings, and prayer tracking on real devices.

## Production Release

- [ ] Promote iOS from TestFlight to App Store review after real-device sign-off.
- [ ] Promote Android from internal testing to production draft, then staged rollout.
- [ ] Monitor crash reports and store review feedback during the first 48 hours.
