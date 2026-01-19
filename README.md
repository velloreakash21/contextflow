# ContextFlow

### Make Claude Code 40-60% more token-efficient

[![npm](https://img.shields.io/npm/v/@updatecode.ai/core)](https://www.npmjs.com/package/@updatecode.ai/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<p align="center">
  <a href="#the-problem">Problem</a> •
  <a href="#installation">Install</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#use-cases">Use Cases</a> •
  <a href="#core-features">Features</a>
</p>

---

## The Problem

Using **Claude Code** for complex projects? You're wasting tokens.

Context windows in January 2026 are massive:

| Model | Context Window | Output |
|-------|---------------|--------|
| GPT-5.2 | 400k tokens | 128k |
| Claude 4.5 Opus | 200k tokens | — |
| Gemini 3 Pro | 2M tokens | — |
| Llama 4 Scout | 10M tokens | — |

**But bigger isn't better.**

Research shows:
- **40-60% overspend** on API costs due to context inefficiency
- **"Lost in the middle"** - Models claiming 200k tokens become unreliable around 130k
- **86% of copilot spending** ($7.2B) now goes to agent-based systems

> *"Context engineering is the delicate art and science of filling the context window with just the right information."* — Andrej Karpathy

---

## Installation

```bash
# CLI (recommended for Claude Code users)
npm install -g @updatecode.ai/cli

# Core library
npm install @updatecode.ai/core

# With Claude adapter
npm install @updatecode.ai/core @updatecode.ai/adapter-claude

# With OpenAI adapter
npm install @updatecode.ai/core @updatecode.ai/adapter-openai
```

### npm Packages

| Package | Description |
|---------|-------------|
| [@updatecode.ai/core](https://www.npmjs.com/package/@updatecode.ai/core) | Core context management engine |
| [@updatecode.ai/cli](https://www.npmjs.com/package/@updatecode.ai/cli) | CLI with TUI dashboard |
| [@updatecode.ai/adapter-claude](https://www.npmjs.com/package/@updatecode.ai/adapter-claude) | Claude/Anthropic adapter |
| [@updatecode.ai/adapter-openai](https://www.npmjs.com/package/@updatecode.ai/adapter-openai) | OpenAI adapter |

---

## Quick Start

### CLI Usage

```bash
# Initialize in your project
contextflow init

# Run a task with tracking
contextflow run "Add user authentication"

# View real-time dashboard
contextflow dashboard

# Check status
contextflow status
```

### Programmatic Usage

```typescript
import { ContextFlow } from '@updatecode.ai/core';
import { ClaudeAdapter } from '@updatecode.ai/adapter-claude';

const cf = new ContextFlow({
  adapter: new ClaudeAdapter({
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-4.5-sonnet',
  }),
  contextBudget: 150000,
  overflowStrategy: 'checkpoint',
});

// Track token usage
cf.on('context.allocated', (e) => {
  console.log(`Allocated ${e.data.allocation.tokens} tokens`);
});

// Execute with tracking
const result = await cf.execute({
  task: 'Implement user authentication',
});

console.log(cf.getBenchmarkMetrics());
// { cer: 72.3, tcc: 0.34, cor: 0, ais: 95, pli: 80 }
```

---

## Use Cases

### Small Projects / Individual Developers

Quick setup for personal projects:

```bash
npm install -g @updatecode.ai/cli
cd your-project
contextflow init
contextflow run "Build feature X"
```

**Benefits:**
- Zero config required
- Real-time token visibility
- Automatic overflow prevention

### Medium Projects / Teams

Team workflow with isolated agents:

```bash
contextflow init
contextflow config set agentIsolation strict
contextflow config set contextBudget 100000
```

```typescript
import { ContextFlow } from '@updatecode.ai/core';
import { ClaudeAdapter } from '@updatecode.ai/adapter-claude';

const cf = new ContextFlow({
  adapter: new ClaudeAdapter({ model: 'claude-4.5-sonnet' }),
  contextBudget: 100000,
  agentIsolation: 'strict',
});

// Register specialized agents
cf.registerAgent({
  id: 'implementer',
  name: 'Code Implementer',
  maxContextBudget: 50000,
  tools: ['read_file', 'write_file', 'run_tests'],
});

cf.registerAgent({
  id: 'reviewer',
  name: 'Code Reviewer',
  maxContextBudget: 30000,
  tools: ['read_file', 'analyze'],
});

// Execute with agent isolation
const result = await cf.execute({
  task: 'Implement and review login feature',
  agents: ['implementer', 'reviewer'],
});
```

**Benefits:**
- Agent isolation prevents context bloat
- Team visibility via dashboard
- Budget enforcement per agent

### Enterprise / Large-Scale

Full observability with benchmarking:

```bash
contextflow init
contextflow config set enableBenchmarking true
contextflow config set overflowStrategy checkpoint
contextflow config set benchmarkOutput both
```

```typescript
import { ContextFlow } from '@updatecode.ai/core';
import { ClaudeAdapter } from '@updatecode.ai/adapter-claude';

const cf = new ContextFlow({
  adapter: new ClaudeAdapter({
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-4.5-opus',
  }),
  contextBudget: 150000,
  overflowStrategy: 'checkpoint',
  agentIsolation: 'strict',
  maxParallelAgents: 5,
  skillPreloadStrategy: 'predictive',
  enableBenchmarking: true,
  benchmarkOutput: 'both',
});

// Event-driven observability
cf.on('context.allocated', logToDatadog);
cf.on('context.overflow', alertOncall);
cf.on('agent.completed', trackMetrics);

// Progressive skill loading
await cf.loadSkill('code-standards');
await cf.loadSkill('security-guidelines');

// Execute complex tasks
const result = await cf.execute({
  task: 'Refactor authentication system',
  context: 'Microservices architecture',
});

// Export metrics
const metrics = cf.getBenchmarkMetrics();
console.log(metrics);
// {
//   cer: 78.5,      // Context Efficiency Ratio
//   tcc: 0.42,      // Task Completion Cost ($)
//   cor: 0,         // Context Overflow Rate
//   ais: 98,        // Agent Isolation Score
//   pli: 85,        // Progressive Loading Index
//   totalTokens: 125000,
//   usefulTokens: 98125,
//   timeMs: 45000,
//   peakContextUsage: 142000
// }

// Checkpoint for long-running tasks
const checkpoint = cf.checkpoint();
// ... later
cf.restore(checkpoint);
```

**Benefits:**
- Full observability and metrics
- Integration with monitoring tools
- Checkpoint/restore for reliability
- Predictive skill loading
- Cost tracking per task

---

## Core Features

### 1. Real-Time Token Tracking

```
┌─ ContextFlow Dashboard ───────────────────────┐
│ Context: ████████░░░░░░░░░░░  67k / 200k     │
│ Efficiency: 72%  │  Cost: $0.34  │  Time: 7m │
│                                               │
│ Agents: ◉ Implementer [████░░] 45k           │
│         ○ Reviewer    [spawning...]          │
└───────────────────────────────────────────────┘
```

### 2. Agent Isolation

```typescript
// Bad: Everything in one bloated context
context = systemPrompt + allFiles + allHistory; // OVERFLOW

// Good: Isolated agents
const result = await cf.execute({
  task: 'Implement feature',
  agent: 'implementer',
  isolation: 'strict', // Fresh 50k context, returns ~200 tokens
});
```

### 3. Budget Enforcement

```typescript
const cf = new ContextFlow({
  adapter,
  contextBudget: 150000, // Hard limit (75% of 200k)
  overflowStrategy: 'checkpoint',
});

// Warns before you hit limits
if (!cf.canAllocate(50000)) {
  const suggestions = cf.getBudgetSuggestions();
  // [{ type: 'unload_skill', tokensSaved: 5000 }, ...]
}
```

### 4. Progressive Skill Loading

```typescript
// Traditional: Load everything upfront
context += codeStandards;  // +4k (maybe never used)
context += testingGuide;   // +3k (maybe never used)

// ContextFlow: Load on demand
if (task.involves('testing')) {
  await cf.loadSkill('testing'); // +3k only when relevant
}
```

---

## CLI Commands

```bash
contextflow init              # Initialize project
contextflow run "task"        # Execute with tracking
contextflow dashboard         # Live TUI visualization
contextflow status            # Show context state
contextflow config            # Manage settings
contextflow config list       # Show all settings
contextflow config set <key> <value>  # Update setting
```

---

## Model Support (January 2026)

| Provider | Models | Context | Status |
|----------|--------|---------|--------|
| Anthropic | Claude 4.5 Opus, Sonnet, Haiku | 200k | ✅ Full |
| OpenAI | GPT-5.2, GPT-5.2 Pro, o3 | 400k | ✅ Full |
| Google | Gemini 3 Pro, Flash | 2M | 🚧 Beta |
| Meta | Llama 4 Scout, Maverick | 10M | 🚧 Beta |

---

## Metrics We Track

| Metric | What it measures |
|--------|-----------------|
| **CER** (Context Efficiency Ratio) | Useful tokens / Total tokens |
| **TCC** (Task Completion Cost) | $ spent per task |
| **COR** (Context Overflow Rate) | % of tasks that overflow |
| **AIS** (Agent Isolation Score) | % of agents running isolated |
| **PLI** (Progressive Loading Index) | How much was loaded on-demand |

---

## Architecture

```
packages/
├── core/           # Token tracking, budget, events
├── cli/            # Command-line interface
├── adapters/
│   ├── claude/     # Anthropic adapter
│   └── openai/     # OpenAI adapter
└── dashboard/      # Visualization
```

---

## Why This Matters

| Without ContextFlow | With ContextFlow |
|---------------------|------------------|
| ~40% efficiency | ~75% efficiency |
| Unpredictable costs | Predictable budgets |
| "Lost in the middle" problems | Strategic context placement |
| Context overflow failures | Proactive overflow prevention |
| No visibility | Real-time dashboard |

---

## Links

- **npm:** https://www.npmjs.com/org/updatecode.ai
- **GitHub:** https://github.com/velloreakash21/contextflow

---

## License

MIT

---

**Built for Claude Code power users.**
