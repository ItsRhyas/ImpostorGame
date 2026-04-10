# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| When writing Go tests, using teatest, or adding test coverage | go-testing | /home/itsrhyas/.config/opencode/skills/go-testing/SKILL.md |
| When creating new AI skills | skill-creator | /home/itsrhyas/.config/opencode/skills/skill-creator/SKILL.md |
| When creating a GitHub issue or reporting a bug | issue-creation | /home/itsrhyas/.config/opencode/skills/issue-creation/SKILL.md |
| PR creation workflow for Agent Teams Lite | branch-pr | /home/itsrhyas/.config/opencode/skills/branch-pr/SKILL.md |
| Parallel adversarial review protocol (judgment-day) | judgment-day | /home/itsrhyas/.config/opencode/skills/judgment-day/SKILL.md |

## Compact Rules

### go-testing
- Use table-driven tests for pure functions; prefer subtests with t.Run
- Test Bubbletea/TUI models by calling Model.Update() directly
- Use teatest for interactive TUI flows and golden files for visual snapshots
- Run `go test ./...` and `go test -cover ./...` for coverage; use -short to skip integration
- Keep tests fast; integration/golden tests can be gated behind flags

### skill-creator
- Produce SKILL.md frontmatter with name, description, triggers, license, metadata
- Provide clear compact rules (5-15 lines) for use by delegators — actionable only
- Include examples sparingly; compact rules are what sub-agents consume
- Avoid environment-specific install steps in compact rules

### issue-creation
- When creating issues, follow issue-first enforcement: provide reproducible steps, expected vs actual, and a minimal repro
- Include labels and a concise title; prefer templates if project has them
- Suggest minimal reproduction and files to inspect

### branch-pr
- Create PRs tied to issues; include summary, changes, and tests to run
- Avoid force-pushing main; include branch naming convention guidance
- Use gh CLI for creating PRs when automating

### judgment-day
- Run two independent blind reviewers and compare reports
- Apply fixes from synthesis, re-run reviewers; escalate after 2 iterations
- Use when high-assurance review is required (security/critical bugs)

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| None discovered | — | No project-level convention files (agents.md, CLAUDE.md, .cursorrules) found in repository root |

*Registry generated automatically by sdd-init. Project-level skills not found; user-level skills were used.*
