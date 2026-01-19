/**
 * ContextFlow Core Type Definitions
 *
 * Universal types for model-agnostic context management.
 */

// ============================================================================
// Message Types (Universal Format)
// ============================================================================

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface TextContent {
  type: 'text';
  text: string;
}

export interface ImageContent {
  type: 'image';
  source: {
    type: 'base64' | 'url';
    mediaType?: string;
    data?: string;
    url?: string;
  };
}

export interface ToolUseContent {
  type: 'tool_use';
  id: string;
  name: string;
  input: unknown;
}

export interface ToolResultContent {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextContent | ImageContent | ToolUseContent | ToolResultContent;

export interface Message {
  role: MessageRole;
  content: string | ContentBlock[];
}

// ============================================================================
// Tool Definitions
// ============================================================================

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface ToolCall {
  id: string;
  name: string;
  input: unknown;
}

// ============================================================================
// Execution Types
// ============================================================================

export interface ExecutionRequest {
  messages: Message[];
  tools?: ToolDefinition[];
  maxTokens?: number;
  temperature?: number;
  metadata?: Record<string, unknown>;
}

export interface ExecutionResult {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  stopReason: 'end' | 'max_tokens' | 'tool_use';
  toolCalls?: ToolCall[];
}

// ============================================================================
// Model Adapter Interface
// ============================================================================

export interface ModelAdapter {
  // Identity
  readonly providerId: string;
  readonly modelId: string;
  readonly contextWindow: number;

  // Token counting
  countTokens(content: string | Message[]): number;
  estimateTokens(content: string): number;

  // Execution
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
  stream(request: ExecutionRequest): AsyncIterable<{ type: 'text' | 'tool_use'; content: string }>;

  // Capabilities
  supportsTools(): boolean;
  supportsVision(): boolean;
  maxOutputTokens(): number;
}

// ============================================================================
// Context Management Types
// ============================================================================

export interface Allocation {
  id: string;
  source: 'system' | 'user' | 'agent' | 'skill' | 'file' | 'tool';
  tokens: number;
  timestamp: number;
  label?: string;
  metadata?: Record<string, unknown>;
}

export interface ContextUsage {
  totalTokens: number;
  allocations: Allocation[];
  peakUsage: number;
  efficiency: number;
}

export interface AllocationRequest {
  source: Allocation['source'];
  content: string | Message[];
  label?: string;
  metadata?: Record<string, unknown>;
}

export interface AllocationResult {
  id: string;
  tokens: number;
  success: boolean;
  reason?: string;
}

export interface ContextCheckpoint {
  id: string;
  timestamp: number;
  usage: ContextUsage;
  state: unknown;
}

// ============================================================================
// Agent Types
// ============================================================================

export type ModelPreference = 'fast' | 'balanced' | 'powerful' | string;

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  tools: string[];
  model: ModelPreference;
  skills: string[];
  maxContextBudget?: number;
  systemPrompt?: string;
}

export interface AgentHandle {
  id: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  contextUsage: ContextUsage;
  startedAt: number;
  completedAt?: number;
}

export interface AgentResult {
  handle: AgentHandle;
  output: unknown;
  tokensUsed: number;
  duration: number;
  error?: Error;
}

export interface Task {
  description: string;
  context?: string;
  files?: string[];
  expectedOutput?: string;
}

// ============================================================================
// Skill Types
// ============================================================================

export interface SkillManifest {
  id: string;
  name: string;
  description: string;
  estimatedTokens: number;
  dependencies: string[];
  triggers: SkillTrigger[];
  path: string;
}

export interface SkillTrigger {
  type: 'keyword' | 'file_pattern' | 'task_type' | 'manual';
  pattern: string;
}

export interface SkillContent {
  manifest: SkillManifest;
  content: string;
  tokens: number;
}

// ============================================================================
// Event Types
// ============================================================================

export type ContextEventType =
  | 'context.allocated'
  | 'context.released'
  | 'context.overflow'
  | 'context.checkpoint'
  | 'context.restored'
  | 'agent.started'
  | 'agent.completed'
  | 'agent.failed'
  | 'skill.loaded'
  | 'skill.unloaded'
  | 'execution.started'
  | 'execution.completed';

export interface ContextEvent {
  type: ContextEventType;
  timestamp: number;
  data: unknown;
  contextSnapshot: {
    used: number;
    capacity: number;
    efficiency: number;
  };
}

export type EventHandler = (event: ContextEvent) => void;
export type Unsubscribe = () => void;

// ============================================================================
// Benchmark Types
// ============================================================================

export interface BenchmarkMetrics {
  // Context Efficiency Ratio
  cer: number;
  // Task Completion Cost
  tcc: number;
  // Context Overflow Rate
  cor: number;
  // Agent Isolation Score
  ais: number;
  // Progressive Loading Index
  pli: number;
  // Raw numbers
  totalTokens: number;
  usefulTokens: number;
  timeMs: number;
  peakContextUsage: number;
}

export interface BenchmarkResult {
  name: string;
  metrics: BenchmarkMetrics;
  timeline: ContextEvent[];
  comparison?: {
    baseline: BenchmarkMetrics;
    improvement: Record<string, number>;
  };
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface ContextFlowConfig {
  // Model selection
  defaultModel: {
    provider: 'claude' | 'openai' | 'gemini' | 'ollama' | string;
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
  benchmarkOutput: 'console' | 'file' | 'both' | 'none';

  // Paths
  skillsPath?: string;
  agentsPath?: string;
  outputPath?: string;
}
