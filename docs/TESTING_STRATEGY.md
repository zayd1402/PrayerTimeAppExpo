# Testing Strategy

## Current Test Setup

**No test framework is currently configured.** There are no test files, no jest/vitest config, and no test scripts in `package.json`. Playwright is listed as a devDependency but has no associated tests or configuration.

TypeScript strict mode (`tsconfig.json` with `strict: true`) and ESLint serve as the primary quality gates.

## How to Run Tests

| Purpose | Command | Notes |
|---|---:|---:|
| Typecheck | `npx tsc --noEmit` | Substitute for unit tests — catches type errors |
| Lint | `npx eslint .` | Substitute for style/code quality checks |
| Manual | N/A | No test runner available |

## When Agents Must Add Tests

Agents must add or update tests when:
- behavior changes,
- bugs are fixed,
- validation logic changes,
- API behavior changes,
- risky edge cases are added.

**However**, since no test framework exists, agents should:
1. First discuss adding a test framework with the user before writing tests.
2. If approved, choose a framework suitable for React Native + Expo (jest + @testing-library/react-native is standard).
3. Add tests for the changed behavior.

## What to Do If Tests Are Missing

Since no test framework exists:
- Do not invent one without approval.
- Use `npx tsc --noEmit` and `npx eslint .` as partial verification.
- Document untested risk in the completion report.
- Recommend adding a test framework in the next update.

**Recommended test framework** (for discussion): Jest + React Native Testing Library for unit/component tests. Consider adding integration tests for critical paths (prayer time calculation, notification scheduling).

## Manual Project Notes

<!-- PROJECT-HARNESS:MANUAL-START -->
Add human-maintained project notes here.
<!-- PROJECT-HARNESS:MANUAL-END -->
