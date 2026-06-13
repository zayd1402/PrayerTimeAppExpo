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

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **PrayerTimeAppExpo** (1250 symbols, 2000 relationships, 77 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/PrayerTimeAppExpo/context` | Codebase overview, check index freshness |
| `gitnexus://repo/PrayerTimeAppExpo/clusters` | All functional areas |
| `gitnexus://repo/PrayerTimeAppExpo/processes` | All execution flows |
| `gitnexus://repo/PrayerTimeAppExpo/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
