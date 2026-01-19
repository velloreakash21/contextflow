#!/bin/bash

# AGENTIC INIT - Universal Project Framework Installer
# Run: curl -sSL https://raw.githubusercontent.com/stanza-soft/agentic-init/main/install.sh | bash

set -e

echo ""
echo "🚀 AGENTIC INIT - Installing Framework..."
echo ""

# Create directories
mkdir -p .claude/agents .claude/skills/code-standards .claude/skills/testing .claude/commands
mkdir -p tickets prompts planning

# Create ticket-executor agent
cat > .claude/agents/ticket-executor.md << 'EOF'
---
name: ticket-executor
description: "Executes tickets. Use when implementing features from tickets/*.md"
tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
skills: code-standards, testing
---
# Ticket Executor
Execute ONE ticket at a time. Load ticket, verify dependencies, implement within scope, run tests, update PROGRESS.md.
EOF

# Create code-reviewer agent
cat > .claude/agents/code-reviewer.md << 'EOF'
---
name: code-reviewer
description: "Reviews code for quality and security. Use when reviewing PRs or changes."
tools: Read, Grep, Glob
model: haiku
---
# Code Reviewer
Check: Security (secrets, injection), Bugs (errors, edge cases), Quality (DRY, naming).
EOF

# Create codebase-explorer agent
cat > .claude/agents/codebase-explorer.md << 'EOF'
---
name: codebase-explorer
description: "Read-only exploration. Use for research and understanding architecture."
tools: Read, Grep, Glob, Bash(find:*), Bash(git:*)
model: haiku
---
# Codebase Explorer
Answer questions about code. Provide file:line evidence. State confidence level.
EOF

# Create code-standards skill
cat > .claude/skills/code-standards/SKILL.md << 'EOF'
---
name: code-standards
description: "Coding standards. Auto-activated when writing/reviewing code."
---
# Standards
- camelCase vars, PascalCase classes
- Max 20 line functions
- No hardcoded secrets
- Parameterized queries
- Git: type(scope): message
EOF

# Create testing skill
cat > .claude/skills/testing/SKILL.md << 'EOF'
---
name: testing
description: "Testing practices. Auto-activated when writing tests."
---
# Testing
- AAA pattern: Arrange, Act, Assert
- Test behavior, not implementation
- Mock external services only
- Cover: logic, edges, errors
EOF

# Create init-project command
cat > .claude/commands/init-project.md << 'EOF'
---
description: "🚀 Initialize project with full agentic workflow"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---
Interview user (one question at a time), analyze codebase, generate tickets with dependencies, create CLAUDE.md, set up progress tracking.
EOF

# Create execute-ticket command
cat > .claude/commands/execute-ticket.md << 'EOF'
---
description: "Execute a ticket"
argument-hint: "[ticket-id]"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---
Load ticket from tickets/$ARGUMENTS*.md, check deps in PROGRESS.md, use ticket-executor, run tests, update progress.
EOF

# Create PROGRESS.md
cat > planning/PROGRESS.md << 'EOF'
# Progress
| ID | Title | Status | Notes |
|----|-------|--------|-------|
| - | Run /init-project | ⬜ | - |
EOF

# Create CLAUDE.md
cat > CLAUDE.md << 'EOF'
# Project Context

> Run `/init-project` to set up this project

## Commands
- `/init-project` - Full initialization
- `/execute-ticket T-001` - Run a ticket

## Agents
- `ticket-executor` - Implements tickets
- `code-reviewer` - Reviews code
- `codebase-explorer` - Research
EOF

echo "✅ Framework installed!"
echo ""
echo "Next steps:"
echo "  1. Run: claude"
echo "  2. Type: /init-project"
echo ""
