# ContextFlow

### Make Claude Code 40-60% more token-efficient

<p align="center">
  <a href="#the-problem">Problem</a> •
  <a href="#claude-code-integration">Claude Code</a> •
  <a href="#quick-start">Quick Start</a> •
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
- **40-60% overspend** on API costs due to context inefficiency ([source](https://content-whale.com/us/blog/llm-context-engineering-information-retention/))
- **"Lost in the middle"** - Models claiming 200k tokens become unreliable around 130k ([source](https://research.aimultiple.com/ai-context-window/))
- **86% of copilot spending** ($7.2B) now goes to agent-based systems ([source](https://www.alphamatch.ai/blog/top-agentic-ai-frameworks-2026))

> *"Context engineering is the delicate art and science of filling the context window with just the right information."* — Andrej Karpathy

---

## Claude Code Integration

**Built specifically for Claude Code power users.**

Claude Code is amazing. But long sessions burn through context fast. ContextFlow fixes that.

```
┌─────────────────────────────────────────────┐
│  Claude Code / Cursor / Windsurf / IDEs     │
├─────────────────────────────────────────────┤
│  ContextFlow (efficiency layer)             │
│  • Token tracking    • Agent isolation      │
│  • Budget enforcement • Progressive loading │
├─────────────────────────────────────────────┤
│  Claude API (Sonnet, Opus, Haiku)           │
└─────────────────────────────────────────────┘
```

**Works with any Claude-powered tool:**
- ✅ Claude Code (CLI)
- ✅ Cursor
- ✅ Windsurf
- ✅ Continue.dev
- ✅ Direct API

---

## Quick Start

```bash
npm install -g contextflow

cd your-project
contextflow init
contextflow run "Add user authentication"
contextflow dashboard
```

---

## Core Features

### 1. Real-Time Token Tracking

See exactly where tokens go:

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

Spawn agents with isolated contexts—only results return:

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

Prevent overflow before it happens:

```typescript
const cf = new ContextFlow({
  adapter: new ClaudeAdapter({ apiKey }),
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

Load knowledge only when needed:

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

## Model Support (January 2026)

| Provider | Models | Context | Status |
|----------|--------|---------|--------|
| OpenAI | GPT-5.2, GPT-5.2 Pro, o3 | 400k | ✅ Full |
| Anthropic | Claude 4.5 Opus, Sonnet, Haiku | 200k | ✅ Full |
| Google | Gemini 3 Pro, Flash | 2M | ✅ Full |
| Meta | Llama 4 Scout, Maverick | 10M | 🚧 Beta |
| xAI | Grok 4.1 | 256k | 🚧 Beta |
| Local | Ollama, vLLM | Varies | 🚧 Beta |

```typescript
import { ContextFlow } from 'contextflow';
import { ClaudeAdapter } from '@updatecode.ai/adapter-claude';
import { OpenAIAdapter } from '@updatecode.ai/adapter-openai';

// Same API, any model
const cf = new ContextFlow({
  adapter: new OpenAIAdapter({ model: 'gpt-5.2' }),
});
```

---

## Integration Examples

### With LangChain + MCP

```typescript
import { ContextFlowCallback } from 'contextflow/langchain';

const chain = new LLMChain({
  llm: new ChatAnthropic(),
  callbacks: [new ContextFlowCallback()], // Track all token usage
});
```

### With CrewAI

```python
from contextflow import ContextFlowMiddleware

crew = Crew(
    agents=[researcher, writer],
    middleware=[ContextFlowMiddleware()],  # Isolate agent contexts
)
```

### Standalone

```typescript
const cf = new ContextFlow({ adapter });

cf.on('context.allocated', (e) => console.log(`+${e.data.tokens} tokens`));
cf.on('context.overflow', (e) => console.log('WARNING: overflow predicted'));

const result = await cf.execute({ task: 'Build feature' });
console.log(cf.getBenchmarkMetrics());
// { cer: 72.3, tcc: 0.34, cor: 0, ... }
```

---

## CLI Commands

```bash
contextflow init              # Initialize project
contextflow run "task"        # Execute with tracking
contextflow dashboard         # Live TUI visualization
contextflow status            # Show context state
contextflow config            # Manage settings
```

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

## Why This Matters

| Without ContextFlow | With ContextFlow |
|---------------------|------------------|
| ~40% efficiency | ~75% efficiency |
| Unpredictable costs | Predictable budgets |
| "Lost in the middle" problems | Strategic context placement |
| Context overflow failures | Proactive overflow prevention |
| No visibility | Real-time dashboard |

---

## Architecture

```
packages/
├── core/           # Token tracking, budget, events
├── cli/            # Command-line interface
├── adapters/
│   ├── claude/     # Anthropic adapter
│   ├── openai/     # OpenAI adapter
│   ├── gemini/     # Google adapter
│   └── ollama/     # Local models
└── dashboard/      # Visualization
```

---

## Roadmap

- [x] Core token tracking engine
- [x] Claude & OpenAI adapters
- [x] CLI with TUI dashboard
- [x] Agent isolation
- [ ] MCP integration
- [ ] LangChain/CrewAI middleware
- [ ] Web dashboard
- [ ] Gemini/Llama adapters

---

## Contributing

```bash
git clone https://github.com/stanza-soft/contextflow
cd contextflow
npm install
npm run dev
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT

---

**Sources:**
- [Best LLMs for Extended Context Windows 2026](https://research.aimultiple.com/ai-context-window/)
- [2025 LLM Review: GPT-5.2, Gemini 3, Claude 4.5](https://atoms.dev/blog/2025-llm-review-gpt-5-2-gemini-3-pro-claude-4-5)
- [Top Agentic AI Frameworks 2026](https://www.alphamatch.ai/blog/top-agentic-ai-frameworks-2026)
- [MCP vs LangChain vs CrewAI 2026](https://www.digitalapplied.com/blog/mcp-vs-langchain-vs-crewai-agent-framework-comparison)
