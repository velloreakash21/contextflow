# ContextFlow Benchmark Specification

> Proving context efficiency with reproducible, comparable metrics.

## The Benchmark Problem

AI development tools make vague claims: "better context management", "smarter agents".
Nobody can verify these claims. ContextFlow changes that with **quantifiable proof**.

## Core Metrics

### 1. Context Efficiency Ratio (CER)

```
CER = (Useful Tokens / Total Tokens Used) × 100
```

- **Useful Tokens**: Tokens directly contributing to task completion
- **Total Tokens**: All tokens sent to the model
- **Goal**: CER > 70% (most tools achieve < 30%)

### 2. Task Completion Cost (TCC)

```
TCC = Total Tokens × (Model Cost per 1K Tokens)
```

Measures actual dollar cost to complete a standardized task.

### 3. Context Overflow Rate (COR)

```
COR = (Failed Tasks Due to Context Limit / Total Tasks) × 100
```

- **Goal**: COR = 0% (tasks should never fail due to context limits)

### 4. Agent Isolation Score (AIS)

```
AIS = (Independent Agent Contexts / Total Agent Invocations) × 100
```

Measures how well the framework isolates agent contexts.

### 5. Progressive Loading Index (PLI)

```
PLI = 1 - (Initial Context Load / Maximum Needed Context)
```

Higher = better progressive disclosure (loads less upfront).

## Benchmark Suite

### Suite 1: Small Project (< 10 files)

**Task**: Add user authentication to a simple Express.js API

| Metric | Baseline (No Framework) | ContextFlow Target |
|--------|-------------------------|-------------------|
| CER | ~25% | > 70% |
| TCC | $0.45 | < $0.20 |
| COR | 0% | 0% |
| Time | ~3 min | < 2 min |

### Suite 2: Medium Project (50-100 files)

**Task**: Refactor a React app from class components to hooks

| Metric | Baseline | ContextFlow Target |
|--------|----------|-------------------|
| CER | ~15% | > 60% |
| TCC | $2.80 | < $1.00 |
| COR | ~10% | 0% |
| Time | ~15 min | < 8 min |

### Suite 3: Large Project (500+ files)

**Task**: Add comprehensive test coverage to an existing codebase

| Metric | Baseline | ContextFlow Target |
|--------|----------|-------------------|
| CER | ~8% | > 50% |
| TCC | $12.00 | < $4.00 |
| COR | ~40% | < 5% |
| Time | ~45 min | < 20 min |

### Suite 4: Multi-Agent Orchestration

**Task**: Build a feature requiring research, implementation, testing, and review

| Metric | Baseline | ContextFlow Target |
|--------|----------|-------------------|
| AIS | ~20% | > 90% |
| CER | ~12% | > 65% |
| Context Reloads | 8+ | < 2 |

## Benchmark Runner Architecture

```typescript
interface BenchmarkConfig {
  name: string;
  projectPath: string;
  task: TaskDefinition;
  models: ModelConfig[];
  iterations: number;
  warmupRuns: number;
}

interface BenchmarkResult {
  config: BenchmarkConfig;
  metrics: {
    cer: number;
    tcc: number;
    cor: number;
    ais: number;
    pli: number;
    totalTokens: number;
    usefulTokens: number;
    timeMs: number;
    peakContextUsage: number;
  };
  timeline: ContextEvent[];
  comparison?: {
    baseline: BenchmarkResult;
    improvement: Record<string, number>;
  };
}

interface ContextEvent {
  timestamp: number;
  type: 'load' | 'unload' | 'agent_start' | 'agent_end';
  tokenDelta: number;
  currentTotal: number;
  source: string;
}
```

## Running Benchmarks

### Quick Benchmark
```bash
npx contextflow benchmark --quick
# Runs Suite 1 only, ~5 minutes
```

### Full Benchmark
```bash
npx contextflow benchmark --full
# Runs all suites, ~2 hours
```

### Comparison Mode
```bash
npx contextflow benchmark --compare
# Runs with and without framework, generates comparison report
```

### Custom Benchmark
```bash
npx contextflow benchmark \
  --project ./my-project \
  --task "Add user authentication" \
  --model claude-sonnet \
  --iterations 3
```

## Output Formats

### Console Summary
```
╔══════════════════════════════════════════════════════════════╗
║                  ContextFlow Benchmark Results               ║
╠══════════════════════════════════════════════════════════════╣
║ Suite: Medium Project (React Refactor)                       ║
║ Model: Claude 3.5 Sonnet                                     ║
║ Iterations: 3                                                ║
╠══════════════════════════════════════════════════════════════╣
║ Metric              │ Baseline │ ContextFlow │ Improvement   ║
╠═════════════════════╪══════════╪═════════════╪═══════════════╣
║ Context Efficiency  │   15.2%  │    67.8%    │    +346%      ║
║ Task Cost           │   $2.82  │    $0.94    │    -67%       ║
║ Overflow Rate       │   12.0%  │     0.0%    │   -100%       ║
║ Completion Time     │  14m 23s │   7m 41s    │    -46%       ║
╚══════════════════════════════════════════════════════════════╝
```

### JSON Export
```bash
npx contextflow benchmark --output results.json
```

### Markdown Report
```bash
npx contextflow benchmark --output report.md
```

### Badge Generation
```bash
npx contextflow benchmark --badge
# Generates: benchmark-badge.svg
# "Context Efficiency: 67.8% | ContextFlow"
```

## Reproducibility Requirements

1. **Seed Control**: All benchmarks use deterministic seeds
2. **Model Versioning**: Exact model version recorded
3. **Environment Capture**: OS, Node version, dependencies logged
4. **Prompt Hashing**: Hash of all prompts for verification
5. **Public Dataset**: Benchmark projects are open source

## Leaderboard Integration

Results can be submitted to the public leaderboard:

```bash
npx contextflow benchmark --submit
# Uploads anonymized results to contextflow.dev/leaderboard
```

Leaderboard tracks:
- Best CER by project size
- Most efficient model configurations
- Community improvements over time

## Anti-Gaming Measures

1. **Standardized Tasks**: Can't cherry-pick favorable tasks
2. **Hidden Test Cases**: Some benchmark cases not public
3. **Statistical Validation**: Outliers flagged automatically
4. **Community Review**: Suspicious results reviewed
