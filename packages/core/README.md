# @updatecode.ai/core

Core context management engine for ContextFlow - make AI tools 40-60% more token-efficient.

## Installation

```bash
npm install @updatecode.ai/core
```

## Quick Start

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
  context: 'Node.js Express application',
});

console.log(cf.getBenchmarkMetrics());
// { cer: 72.3, tcc: 0.34, cor: 0, ... }
```

## Core Components

| Component | Purpose |
|-----------|---------|
| `ContextManager` | Tracks all token allocations |
| `AgentOrchestrator` | Manages isolated agent execution |
| `BudgetTracker` | Enforces context limits |
| `SkillLoader` | Progressive knowledge loading |
| `EventBus` | Real-time observability |

## API Reference

### ContextFlow

```typescript
const cf = new ContextFlow({
  adapter: ModelAdapter,        // Required: Claude, OpenAI, etc.
  contextBudget: number,        // Max tokens (default: auto)
  overflowStrategy: 'error' | 'summarize' | 'checkpoint',
  agentIsolation: 'strict' | 'shared',
  maxParallelAgents: number,
});

// Methods
cf.execute(task)              // Execute task with tracking
cf.loadSkill(skillId)         // Load knowledge on-demand
cf.checkpoint()               // Save context state
cf.restore(checkpoint)        // Restore context state
cf.getBenchmarkMetrics()      // Get efficiency metrics
cf.on(event, handler)         // Subscribe to events
```

### Events

```typescript
cf.on('context.allocated', handler)   // Token allocated
cf.on('context.released', handler)    // Token released
cf.on('context.overflow', handler)    // Budget exceeded
cf.on('agent.started', handler)       // Agent spawned
cf.on('agent.completed', handler)     // Agent finished
cf.on('skill.loaded', handler)        // Skill loaded
```

## Metrics

| Metric | Description |
|--------|-------------|
| **CER** | Context Efficiency Ratio - useful tokens / total |
| **TCC** | Task Completion Cost - $ per task |
| **COR** | Context Overflow Rate - % overflow |
| **AIS** | Agent Isolation Score - % isolated |
| **PLI** | Progressive Loading Index - on-demand % |

## Links

- [GitHub](https://github.com/velloreakash21/contextflow)
- [npm Organization](https://www.npmjs.com/org/updatecode.ai)
- [Documentation](https://github.com/velloreakash21/contextflow#readme)

## License

MIT
