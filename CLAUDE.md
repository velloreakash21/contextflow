# ContextFlow - AI Context Efficiency Layer

> **Mission**: Become the efficiency layer that makes LangChain, CrewAI, AutoGen, and all AI tools 40-60% more token-efficient.

## Project Identity

**Name**: ContextFlow
**Tagline**: "Your AI wastes 40-60% of tokens. We fix that."
**Category**: Developer Tools / AI Infrastructure / Context Engineering

## What We're Building

A **model-agnostic framework** that:
1. Measures and visualizes AI context usage in real-time
2. Orchestrates multi-agent workflows with isolated context boundaries
3. Provides benchmarkable proof of context efficiency gains
4. Works across Claude, GPT-4, Gemini, Llama, and any future LLM

## Core Value Proposition

| Without ContextFlow | With ContextFlow |
|---------------------|------------------|
| Context fills up unpredictably | Predictable, measured usage |
| Single monolithic agent | Isolated subagents with boundaries |
| No visibility into token spend | Real-time dashboard |
| Repeated context loading | Cached, progressive disclosure |
| Model-specific workarounds | Universal abstraction layer |

## Tech Stack

- **Core**: TypeScript (ES2022, strict mode)
- **CLI**: Node.js + Commander.js + Chalk + Ora
- **Visualization**: TUI (current), React + D3.js (planned)
- **Model Adapters**: Plugin architecture
- **Package**: npm workspaces monorepo
- **Build**: Turbo + tsc

## January 2026 Model Support

| Provider | Models | Context Window |
|----------|--------|----------------|
| OpenAI | GPT-5.2, GPT-5.2 Pro, o3 | 400k tokens |
| Anthropic | Claude 4.5 Opus/Sonnet/Haiku | 200k tokens |
| Google | Gemini 3 Pro/Flash | 2M tokens |
| Meta | Llama 4 Scout/Maverick | 10M tokens |
| xAI | Grok 4.1 | 256k tokens |

**Key insight**: Models claiming 200k become unreliable ~130k ("lost in the middle")

## Competitive Position

We're NOT competing with LangChain/CrewAI/AutoGen/MCP. We make them better.
- **LangChain**: Chains and tools → Add ContextFlow for efficiency
- **CrewAI**: Role-based agents (20k+ stars) → Add ContextFlow for isolation
- **AutoGen**: Multi-agent chat → Add ContextFlow for budget control
- **MCP**: Linux Foundation standard ("USB-C for AI") → Add ContextFlow for tracking

**Market**: $7.63B in 2025, 86% of copilot spend goes to agents

## Architecture Overview

```
contextflow/
├── packages/
│   ├── core/              # Framework core (model-agnostic)
│   ├── cli/               # Command-line interface
│   ├── dashboard/         # Real-time visualization
│   ├── benchmark/         # Benchmark suite
│   └── adapters/          # Model-specific adapters
│       ├── claude/
│       ├── openai/
│       ├── gemini/
│       └── ollama/
├── examples/              # Demo projects with benchmarks
├── docs/                  # Documentation site
└── website/               # Marketing/landing page
```

## Quick Commands

```bash
# Development
npm install                 # Install all dependencies
npm run dev                 # Start development mode
npm run build               # Build all packages
npm test                    # Run test suite

# Benchmark
npm run benchmark           # Run full benchmark suite
npm run benchmark:compare   # Compare with/without framework

# Dashboard
npm run dashboard           # Start visualization server
```

## Current Sprint Focus

See `planning/ROADMAP.md` for full roadmap.

**Phase 1 (Current)**: Foundation
- [ ] Core context tracking engine
- [ ] Claude adapter (primary)
- [ ] Basic CLI
- [ ] Proof-of-concept benchmark

## Key Design Decisions

1. **Model-Agnostic First**: Every feature must work across models
2. **Measure Everything**: No claims without benchmark data
3. **Progressive Disclosure**: Load only what's needed
4. **Isolated Agents**: Subagents get fresh context, return minimal results

## Do NOT

- Make model-specific optimizations in core (use adapters)
- Add features without corresponding benchmarks
- Exceed 200 lines in any single module
- Skip tests for new functionality

## Available Subagents

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| `ticket-executor` | Implements tickets | Executing planned work |
| `code-reviewer` | Reviews changes | Before merging |
| `codebase-explorer` | Answers questions | Research/exploration |
| `benchmark-runner` | Runs benchmarks | Measuring performance |

## Success Metrics

1. **Adoption**: 1,000 GitHub stars in 90 days
2. **Proof**: Documented 50%+ context savings on 5+ real projects
3. **Integrations**: Official adapters for top 4 LLMs
4. **Community**: Active Discord with 500+ members
