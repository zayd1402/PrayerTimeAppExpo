# QUALITY_GATES.md — Quality Gates

This file is generated from the universal-coding-harness.

<!-- PROJECT-HARNESS:MANUAL-START -->
Add human-maintained project notes here.
<!-- PROJECT-HARNESS:MANUAL-END -->

## Required Gates

| Gate | Required | Tool |
|---|---|---|
| Lint | Yes | ESLint |
| Type Check | Yes | TypeScript |
| Unit Tests | Yes | Unknown |
| Build | Yes | tsc / webpack |
| Smoke Check | Yes | Manual or scripted |
| Security Review | For security changes | Manual |

## Gate Failure Policy

- Lint/type failures: must fix before commit.
- Test failures: must fix before merge.
- Build failures: must fix before merge.
- Security findings: must resolve before merge.
