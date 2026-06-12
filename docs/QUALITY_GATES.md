# Quality Gates

## Meaning of Done

A task is only complete when:

- acceptance criteria are satisfied,
- relevant files were inspected,
- implementation scope was respected,
- changed files are listed,
- git diff was reviewed,
- relevant verification commands were run,
- skipped verification is explained,
- remaining risks are disclosed.

## Project Verification Commands

| Gate | Command | Required? | Notes |
|---|---:|---:|---:|
| Typecheck | `npx tsc --noEmit` | Yes (TS changes) | TypeScript strict mode |
| Lint | `npx eslint .` | Yes (non-trivial changes) | Two config files loaded |
| Test | No test framework | Skipped | No tests exist |
| Build | `npx expo export --platform web` | Optional | Lightweight build check |
| Native Build | `npx expo run:android/ios` | No | Expensive, requires SDK/Xcode |
| Prebuild | `npx expo prebuild` | No | Only for native config changes |

## Task-Level Gates

- **Plan first**: Use `/plan` before any non-trivial change.
- **Impact analysis**: Run `gitnexus_impact` before editing any symbol.
- **Verify after**: Run typecheck + lint after every change.
- **Detect changes**: Run `gitnexus_detect_changes` before committing.

## Review Gates

- `/review` — Implementation quality, overengineering, coupling
- `/review-tests` — Test quality (N/A until tests exist)
- `/review-security` — When touching permissions, notifications, location
- `/review-product` — Acceptance criteria satisfaction
- `/review-architecture` — When touching service or context architecture

## Merge Gates

- Typecheck passes
- Lint passes
- Git diff reviewed
- Acceptance criteria met
- No placeholder implementations
- No forced integrations

## Missing Gates

- **Test framework**: No jest, vitest, or any test runner configured
- **CI pipeline**: No .github/workflows or CI config
- **Smoke tests**: No end-to-end or smoke test scripts
- **Secret scanning**: No secret scanner configured
- **Dependency audit**: No `npm audit` or similar in CI
- **Bundle size check**: Not configured
- **E2E tests**: Playwright is listed as a devDependency but no tests exist

## Recommended Future CI

- **Lint** (`npx eslint .`) — Quick, catches code quality issues
- **Typecheck** (`npx tsc --noEmit`) — Catches type errors
- **Build check** (`npx expo export --platform web`) — Ensures bundling works
- **Dependency audit** (`npm audit`) — Security vulnerability scanning
- **Secret scanning** — Prevents accidental credential commits

## Manual Project Notes

<!-- PROJECT-HARNESS:MANUAL-START -->
Add human-maintained project notes here.
<!-- PROJECT-HARNESS:MANUAL-END -->
