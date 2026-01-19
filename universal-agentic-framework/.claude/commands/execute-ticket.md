---
description: "Execute a specific ticket using the ticket-executor subagent"
argument-hint: "[ticket-id, e.g., T-001]"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

# Execute Ticket: $ARGUMENTS

## Pre-flight Checks

1. **Load the ticket**:
   ```bash
   cat tickets/$ARGUMENTS*.md 2>/dev/null || echo "Ticket not found"
   ```

2. **Check dependencies in PROGRESS.md**:
   ```bash
   cat planning/PROGRESS.md 2>/dev/null
   ```

3. **Verify all dependencies are ✅ Complete** before proceeding.
   - If dependencies are not complete, report which are blocking and STOP.

---

## Execution Protocol

### Step 1: Parse Ticket

Extract from the ticket:
- `title`: What we're building
- `acceptance_criteria`: Definition of done
- `technical_scope.files_to_touch`: Files we CAN modify
- `technical_scope.files_to_not_touch`: Files we CANNOT modify
- `implementation_notes`: Technical guidance
- `testing_requirements`: Tests to write/run

### Step 2: Create Implementation Plan

Before writing any code, create a brief plan (max 5 steps):
```
📋 Implementation Plan for $ARGUMENTS
1. [First step]
2. [Second step]
3. [Third step]
4. [Fourth step]
5. [Fifth step]
```

### Step 3: Implement

Execute each step of the plan:
- **ONLY modify files listed in scope**
- Follow code standards from `.claude/skills/code-standards/SKILL.md`
- Add appropriate tests
- Handle errors gracefully

### Step 4: Verify

Run verification:
```bash
# Run tests (adapt to project)
npm test 2>/dev/null || yarn test 2>/dev/null || pytest 2>/dev/null || php artisan test 2>/dev/null || go test ./... 2>/dev/null || echo "No test runner detected"

# Run linter (adapt to project)
npm run lint 2>/dev/null || yarn lint 2>/dev/null || echo "No linter configured"
```

### Step 5: Update Progress

Update `planning/PROGRESS.md`:
- Change ticket status from ⬜ Todo to ✅ Complete
- Add completion timestamp
- Log files changed

---

## Output Report

Generate this report after completion:

```markdown
## ✅ Ticket $ARGUMENTS Complete

### Summary
[1-2 sentence description of what was done]

### Files Changed
| File | Action | Lines Changed |
|------|--------|---------------|
| path/to/file | Created/Modified | +X, -Y |

### Tests
- Tests run: X
- Tests passed: X
- New tests added: Y

### Acceptance Criteria
- [x] Criterion 1
- [x] Criterion 2
- [x] Criterion 3

### Notes
[Any observations, warnings, or follow-ups]

### Next Tickets Unblocked
- T-XXX: [title] - now ready to execute
```

---

## Error Handling

If implementation fails:

```markdown
## ❌ Ticket $ARGUMENTS Failed

### Blocker
[Description of what's preventing completion]

### Attempted
[What was tried]

### Needs
[What's required to unblock - human action, dependency, clarification]

### Recommendation
[Suggested next step]
```

Update PROGRESS.md to show ❌ Failed status.

---

## Rules

1. **NEVER modify files outside ticket scope**
2. **ALWAYS run tests before marking complete**
3. **If blocked, STOP and report - don't guess**
4. **Preserve existing code style**
5. **Minimal changes only - no scope creep**
