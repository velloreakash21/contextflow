# @updatecode.ai/cli

CLI for ContextFlow - real-time context tracking and visualization.

## Installation

```bash
npm install -g @updatecode.ai/cli
```

## Quick Start

```bash
# Initialize in your project
contextflow init

# Run a task with tracking
contextflow run "Add user authentication"

# View real-time dashboard
contextflow dashboard

# Check context status
contextflow status
```

## Commands

### `contextflow init`

Initialize ContextFlow in your project:

```bash
contextflow init
# Creates contextflow.config.json with default settings
```

### `contextflow run <task>`

Execute a task with full context tracking:

```bash
contextflow run "Implement login feature"
contextflow run "Fix bug in payment processing" --model claude-4.5-opus
contextflow run "Refactor database layer" --budget 100000
```

Options:
- `--model <model>` - Model to use (default: claude-4.5-sonnet)
- `--budget <tokens>` - Context budget (default: auto)
- `--verbose` - Show detailed output

### `contextflow dashboard`

Launch real-time TUI dashboard:

```
┌─ ContextFlow Dashboard ───────────────────────┐
│ Context: ████████░░░░░░░░░░░  67k / 200k     │
│ Efficiency: 72%  │  Cost: $0.34  │  Time: 7m │
│                                               │
│ Agents: ◉ Implementer [████░░] 45k           │
│         ○ Reviewer    [spawning...]          │
└───────────────────────────────────────────────┘
```

### `contextflow status`

Show current context state:

```bash
contextflow status
# Context Usage: 45,000 / 200,000 tokens (22.5%)
# Efficiency: 78%
# Active Agents: 2
# Loaded Skills: 3
```

### `contextflow config`

Manage configuration:

```bash
contextflow config list              # Show all settings
contextflow config set budget 150000 # Set context budget
contextflow config set model claude-4.5-opus
```

## Configuration File

`contextflow.config.json`:

```json
{
  "defaultModel": {
    "provider": "claude",
    "model": "claude-4.5-sonnet"
  },
  "contextBudget": 150000,
  "overflowStrategy": "checkpoint",
  "agentIsolation": "strict",
  "enableBenchmarking": true
}
```

## Use Cases

### Small Projects
```bash
npm install -g @updatecode.ai/cli
contextflow init
contextflow run "Build feature X"
```

### Medium Projects
```bash
contextflow init
contextflow config set agentIsolation strict
contextflow run "Implement module" --budget 100000
contextflow dashboard
```

### Enterprise
```bash
contextflow init
contextflow config set enableBenchmarking true
contextflow config set overflowStrategy checkpoint
contextflow run "Complex refactoring task"
contextflow status --json > metrics.json
```

## Links

- [GitHub](https://github.com/velloreakash21/contextflow)
- [Core Package](https://www.npmjs.com/package/@updatecode.ai/core)

## License

MIT
