# 🚀 Universal Agentic Project Framework

> One command to initialize any project with tickets, subagents, skills, and execution prompts.

[![Compatible with Claude Code](https://img.shields.io/badge/Claude%20Code-Compatible-blue)]()
[![Compatible with Codex CLI](https://img.shields.io/badge/Codex%20CLI-Compatible-green)]()
[![Agent Skills Standard](https://img.shields.io/badge/Agent%20Skills-v1.0-purple)](https://agentskills.io)

## What This Does

1. **Interviews you** to understand your project, goals, and constraints
2. **Analyzes your codebase** to understand structure and tech stack
3. **Generates tickets** with dependencies and effort estimates
4. **Creates subagents** for ticket execution, code review, and exploration
5. **Sets up skills** for code standards and testing
6. **Produces execution prompts** ready to copy-paste

## Quick Start

### Method 1: Copy the Init Command

```bash
# Navigate to your project
cd /path/to/your/project

# Open Claude Code
claude

# Type:
/init-project
```

### Method 2: Install as Plugin (Coming Soon)

```bash
# In Claude Code:
/plugin marketplace add stanza-soft/agentic-init
/plugin install agentic-init-full@agentic-init
```

### Method 3: Manual Installation

```bash
# Clone this repo
git clone https://github.com/stanza-soft/agentic-init.git

# Copy to your project
cp -r agentic-init/.claude /path/to/your/project/

# Or install globally
cp -r agentic-init/.claude/* ~/.claude/
```

## What Gets Created

```
your-project/
├── .claude/
│   ├── agents/
│   │   ├── ticket-executor.md    # Implements tickets
│   │   ├── code-reviewer.md      # Reviews changes
│   │   └── codebase-explorer.md  # Research (read-only)
│   ├── skills/
│   │   ├── code-standards/       # Coding conventions
│   │   │   └── SKILL.md
│   │   └── testing/              # Test best practices
│   │       └── SKILL.md
│   └── commands/
│       ├── init-project.md       # /init-project
│       └── execute-ticket.md     # /execute-ticket T-001
├── tickets/
│   ├── T-001-setup.md
│   ├── T-002-feature.md
│   └── ...
├── prompts/
│   ├── execute-T-001.md
│   └── ...
├── planning/
│   ├── PROJECT_CONTEXT.md
│   ├── DEPENDENCY_GRAPH.md
│   └── PROGRESS.md
└── CLAUDE.md
```

## Commands

| Command | Description |
|---------|-------------|
| `/init-project` | Run full initialization workflow |
| `/execute-ticket T-001` | Execute a specific ticket |
| `/review-changes` | Review recent code changes |

## Subagents

| Agent | Purpose | Tools |
|-------|---------|-------|
| `ticket-executor` | Implements tickets | Read, Write, Edit, Bash |
| `code-reviewer` | Reviews code quality | Read, Grep, Glob |
| `codebase-explorer` | Research questions | Read, Grep, Find |

## Skills

| Skill | When Activated |
|-------|----------------|
| `code-standards` | Writing or reviewing code |
| `testing` | Writing tests or debugging failures |

## Ticket Format

```markdown
# tickets/T-001-example.md

---
id: T-001
title: "Clear action title"
type: feature
priority: high
estimated_effort: M
dependencies: []
blocks: [T-002]
---

## Summary
Brief description

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Technical Scope
**Files to touch:** [list]
**Files to NOT touch:** [list]

## Testing Requirements
- [ ] Unit tests
- [ ] Integration tests
```

## Context Window Management

This framework is designed to preserve your 200k context window:

1. **Subagents run in isolated contexts** - Heavy work happens in subagent, only results return
2. **Skills use progressive disclosure** - Loaded only when needed
3. **Tickets are processed one at a time** - No bulk loading
4. **CLAUDE.md stays lean** - Only essential project context

## Customization

### Add Your Own Subagent

```yaml
# .claude/agents/my-agent.md
---
name: my-agent
description: "When to use this agent"
tools: Read, Write, Bash
model: haiku
---

# Agent Instructions
Your custom instructions here...
```

### Add Your Own Skill

```yaml
# .claude/skills/my-skill/SKILL.md
---
name: my-skill
description: "What this skill provides"
---

# My Skill
Instructions loaded when skill is activated...
```

## Compatibility

Works with any tool supporting the [Agent Skills Specification](https://agentskills.io):

- ✅ Claude Code (Anthropic)
- ✅ Codex CLI (OpenAI)
- ✅ Cursor
- ✅ VS Code Copilot
- ✅ Windsurf
- ✅ Any SKILL.md-compatible tool

## Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - Use freely, attribution appreciated.

## Credits

Built by [Stanza Soft](https://stanzasoft.com)

Inspired by:
- [SkillsMP](https://skillsmp.com) - 71,000+ community skills
- [Agent Skills Spec](https://agentskills.io) - Open standard
- [Awesome Claude Code](https://github.com/hesreallyhim/awesome-claude-code) - Community resources

---

## Support

- 📖 [Documentation](./AGENTIC_INIT.md)
- 🐛 [Issues](https://github.com/stanza-soft/agentic-init/issues)
- 💬 [Discussions](https://github.com/stanza-soft/agentic-init/discussions)
