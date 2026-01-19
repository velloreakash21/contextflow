# ContextFlow Core Architecture

> Model-agnostic context management for any LLM.

## Design Principles

1. **Adapter Pattern**: Core never talks to models directly
2. **Event-Driven**: All context changes emit trackable events
3. **Immutable Boundaries**: Agent contexts are isolated by design
4. **Zero Dependencies**: Core has no external runtime dependencies

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Application                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ContextFlow Core                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Context   │  │    Agent    │  │      Skill Loader       │ │
│  │   Manager   │  │ Orchestrator│  │  (Progressive Disclosure)│ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Event     │  │   Budget    │  │      Benchmark          │ │
│  │   Emitter   │  │   Tracker   │  │      Collector          │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Adapter Interface                          │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────┐   │
│  │  Claude   │ │  OpenAI   │ │  Gemini   │ │    Ollama     │   │
│  │  Adapter  │ │  Adapter  │ │  Adapter  │ │    Adapter    │   │
│  └───────────┘ └───────────┘ └───────────┘ └───────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│               LLM APIs (Claude, GPT-4, Gemini, etc.)            │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Context Manager

Tracks all context state across the session.

```typescript
interface ContextManager {
  // Current state
  getCurrentUsage(): ContextUsage;
  getCapacity(): number;
  getRemaining(): number;

  // Operations
  allocate(request: AllocationRequest): AllocationResult;
  release(allocationId: string): void;
  checkpoint(): ContextCheckpoint;
  restore(checkpoint: ContextCheckpoint): void;

  // Events
  on(event: 'allocated' | 'released' | 'overflow', handler: EventHandler): void;
}

interface ContextUsage {
  totalTokens: number;
  allocations: Allocation[];
  peakUsage: number;
  efficiency: number;
}

interface Allocation {
  id: string;
  source: 'system' | 'user' | 'agent' | 'skill' | 'file';
  tokens: number;
  timestamp: number;
  metadata: Record<string, unknown>;
}
```

### 2. Agent Orchestrator

Manages subagent lifecycle with isolated contexts.

```typescript
interface AgentOrchestrator {
  // Agent management
  register(agent: AgentDefinition): void;
  spawn(agentId: string, task: Task): AgentHandle;
  terminate(handle: AgentHandle): AgentResult;

  // Isolation
  createIsolatedContext(parentCheckpoint?: ContextCheckpoint): IsolatedContext;
  mergeResults(results: AgentResult[], targetContext: ContextManager): void;

  // Parallel execution
  spawnParallel(agents: Array<{id: string; task: Task}>): Promise<AgentResult[]>;
}

interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  tools: string[];
  model: ModelPreference;
  skills: string[];
  maxContextBudget?: number;
}

interface AgentHandle {
  id: string;
  agentId: string;
  status: 'running' | 'completed' | 'failed';
  contextUsage: ContextUsage;
  startedAt: number;
}

interface AgentResult {
  handle: AgentHandle;
  output: unknown;
  tokensUsed: number;
  duration: number;
}
```

### 3. Skill Loader (Progressive Disclosure)

Loads skills only when needed.

```typescript
interface SkillLoader {
  // Discovery
  discover(): SkillManifest[];

  // Loading
  load(skillId: string): SkillContent;
  unload(skillId: string): void;
  isLoaded(skillId: string): boolean;

  // Progressive
  preload(skillIds: string[], priority: 'high' | 'low'): void;
  getLoadedTokens(): number;
}

interface SkillManifest {
  id: string;
  name: string;
  description: string;
  estimatedTokens: number;
  dependencies: string[];
  triggers: SkillTrigger[];
}

interface SkillTrigger {
  type: 'keyword' | 'file_pattern' | 'task_type' | 'manual';
  pattern: string;
}
```

### 4. Event Emitter

Central event bus for monitoring and benchmarking.

```typescript
interface ContextEventEmitter {
  emit(event: ContextEvent): void;
  on(eventType: ContextEventType, handler: EventHandler): Unsubscribe;
  getHistory(): ContextEvent[];
  exportTimeline(): TimelineExport;
}

type ContextEventType =
  | 'context.allocated'
  | 'context.released'
  | 'context.overflow'
  | 'agent.started'
  | 'agent.completed'
  | 'agent.failed'
  | 'skill.loaded'
  | 'skill.unloaded'
  | 'checkpoint.created'
  | 'checkpoint.restored';

interface ContextEvent {
  type: ContextEventType;
  timestamp: number;
  data: unknown;
  contextSnapshot: {
    used: number;
    capacity: number;
    efficiency: number;
  };
}
```

### 5. Budget Tracker

Enforces context budgets and predicts overflow.

```typescript
interface BudgetTracker {
  // Budget management
  setGlobalBudget(tokens: number): void;
  setAgentBudget(agentId: string, tokens: number): void;

  // Queries
  canAllocate(request: AllocationRequest): boolean;
  predictOverflow(plannedOperations: Operation[]): OverflowPrediction;
  getSuggestions(): BudgetSuggestion[];

  // Enforcement
  setEnforcementMode(mode: 'strict' | 'warn' | 'none'): void;
}

interface OverflowPrediction {
  willOverflow: boolean;
  atOperation: number;
  suggestedActions: string[];
}

interface BudgetSuggestion {
  type: 'unload_skill' | 'spawn_agent' | 'checkpoint';
  description: string;
  tokensSaved: number;
}
```

## Adapter Interface

All model adapters implement this interface:

```typescript
interface ModelAdapter {
  // Identity
  readonly providerId: string;
  readonly modelId: string;
  readonly contextWindow: number;

  // Token counting
  countTokens(content: string | Message[]): number;
  estimateTokens(content: string): number;

  // Execution
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
  stream(request: ExecutionRequest): AsyncIterable<StreamChunk>;

  // Capabilities
  supportsTools(): boolean;
  supportsVision(): boolean;
  maxOutputTokens(): number;
}

interface ExecutionRequest {
  messages: Message[];
  tools?: ToolDefinition[];
  maxTokens?: number;
  temperature?: number;
  metadata?: Record<string, unknown>;
}

interface ExecutionResult {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  stopReason: 'end' | 'max_tokens' | 'tool_use';
  toolCalls?: ToolCall[];
}
```

## Universal Message Format

Cross-model message format:

```typescript
interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: Content | Content[];
}

type Content =
  | { type: 'text'; text: string }
  | { type: 'image'; source: ImageSource }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | { type: 'tool_result'; tool_use_id: string; content: string };
```

## Configuration

```typescript
interface ContextFlowConfig {
  // Model selection
  defaultModel: {
    provider: 'claude' | 'openai' | 'gemini' | 'ollama';
    model: string;
  };

  // Context management
  contextBudget: number | 'auto';
  overflowStrategy: 'error' | 'summarize' | 'checkpoint';

  // Agent settings
  agentIsolation: 'strict' | 'shared';
  maxParallelAgents: number;

  // Progressive loading
  skillPreloadStrategy: 'none' | 'on-demand' | 'predictive';

  // Benchmarking
  enableBenchmarking: boolean;
  benchmarkOutput: 'console' | 'file' | 'both';

  // Adapters
  adapters: Record<string, AdapterConfig>;
}
```

## File Structure

```
packages/core/
├── src/
│   ├── index.ts                 # Public API exports
│   ├── context-manager.ts       # Context tracking
│   ├── agent-orchestrator.ts    # Agent lifecycle
│   ├── skill-loader.ts          # Progressive disclosure
│   ├── event-emitter.ts         # Event system
│   ├── budget-tracker.ts        # Budget enforcement
│   ├── types.ts                 # Type definitions
│   └── utils/
│       ├── token-estimator.ts   # Quick token estimation
│       └── checkpoint.ts        # Context checkpointing
├── tests/
│   ├── context-manager.test.ts
│   ├── agent-orchestrator.test.ts
│   └── integration.test.ts
├── package.json
└── tsconfig.json
```

## Usage Example

```typescript
import { ContextFlow } from '@contextflow/core';
import { ClaudeAdapter } from '@contextflow/adapter-claude';

// Initialize
const cf = new ContextFlow({
  adapter: new ClaudeAdapter({ apiKey: process.env.ANTHROPIC_API_KEY }),
  contextBudget: 180000, // Leave 20k buffer
  enableBenchmarking: true,
});

// Register agents
cf.registerAgent({
  id: 'implementer',
  name: 'Code Implementer',
  tools: ['read', 'write', 'bash'],
  model: 'sonnet',
  maxContextBudget: 50000,
});

// Execute with isolation
const result = await cf.execute({
  task: 'Add user authentication',
  agent: 'implementer',
  isolation: 'strict',
});

// Get benchmark data
const metrics = cf.getBenchmarkMetrics();
console.log(`Context Efficiency: ${metrics.cer}%`);
console.log(`Total Cost: $${metrics.tcc}`);
```
