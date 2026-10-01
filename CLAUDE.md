@AGENTS.md

# CLAUDE.md — rj-barber-salon

RJ Barber Salon POS terminal: a cashless-first (DuitNow QR + cash) point-of-sale where staff confirm payments, light theme, runs on the shop PC with SQLite.

## Session continuity & documentation
**At session start:** read `PROJECT_STATUS.md` in this folder first to restore where we left off, what's done, and what's next. Treat it as the source of truth for project state.

**Document big tasks without being asked.** When a milestone/feature/decision/multi-step task completes:
- Append a dated entry to `docs/CHANGELOG.md` (what was done, why, key decisions).
- Move the item to ✅ Done in `PROJECT_STATUS.md` and add a Session-log line.
A "big task" = something worth remembering in a month; skip routine edits and intermediate steps.

**When starting new work** add it under 🔄 In progress in `PROJECT_STATUS.md`. **When wrapping up**, refresh 📍 Where I left off and bump Last updated. Keep edits surgical.
