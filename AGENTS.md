# AGENTS.md — Project Agent Guide

This file is generated from the universal-coding-harness. Do not edit this section directly.

<!-- PROJECT-HARNESS:MANUAL-START -->
Add human-maintained project notes here.
<!-- PROJECT-HARNESS:MANUAL-END -->

## Project: PrayerTimeAppExpo

- **Language:** JavaScript/TypeScript
- **Framework:** Expo
- **Package Manager:** npm
- **Test Framework:** jest

## Engineering Principles

1. **Smallest safe change** — Make the minimal change.
2. **Inspect before editing** — Read files first.
3. **No unrelated refactors** — Focus on the task.
4. **No fake integrations** — No invisible stubs.
5. **No production placeholders** — No TODO stubs.
6. **Preserve architecture** — Follow existing patterns.
7. **Verify before claiming completion** — Evidence required.
8. **Report honestly** — State risks clearly.
9. **No "done" without evidence** — Show test output.

## Definition of Done

- [ ] Files inspected.
- [ ] Acceptance criteria met.
- [ ] Minimum change scoped.
- [ ] Tests added/updated for behavior changes.
- [ ] Lint passes.
- [ ] Type check passes.
- [ ] Tests pass.
- [ ] Build succeeds.
- [ ] Diff reviewed.
- [ ] Risks documented.

## Workflow

1. **Explore** → 2. **Architect** → 3. **Plan** → 4. **Build Safe** → 5. **Verify** → 6. **Review** → 7. **Fix Review** → 8. **PR Ready**

## Commands

- `npm start` — `expo start`
- `npm lint` — `eslint .`
- `npm test` — `jest`

## Safety Rules

- Do not run: git push, rm -rf, sudo, chmod -R 777
- Use --dry-run before destructive operations.
