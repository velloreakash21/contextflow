/**
 * ContextFlow - Main entry point
 *
 * Orchestrates context management, agents, skills, and benchmarking
 * in a unified, enterprise-ready interface.
 */

import { ContextManager } from './context-manager';
import { AgentOrchestrator } from './agent-orchestrator';
import { EventBus } from './event-bus';
import { BudgetTracker } from './budget-tracker';
import { SkillLoader } from './skill-loader';
import type {
  ContextFlowConfig,
  ModelAdapter,
  AgentDefinition,
  Task,
  AgentResult,
  ContextCheckpoint,
  ContextUsage,
  BenchmarkMetrics,
  ContextEvent,
} from './types';

const DEFAULT_CONFIG: ContextFlowConfig = {
  defaultModel: { provider: 'claude', model: 'claude-sonnet-4-20250514' },
  contextBudget: 'auto',
  overflowStrategy: 'checkpoint',
  agentIsolation: 'strict',
  maxParallelAgents: 4,
  skillPreloadStrategy: 'on-demand',
  enableBenchmarking: true,
  benchmarkOutput: 'console',
};

export class ContextFlow {
  private readonly config: ContextFlowConfig;
  private readonly adapter: ModelAdapter;
  private readonly contextManager: ContextManager;
  private readonly agentOrchestrator: AgentOrchestrator;
  private readonly eventBus: EventBus;
  private readonly budgetTracker: BudgetTracker;
  private readonly skillLoader: SkillLoader;
  private readonly startTime: number;

  constructor(options: { adapter: ModelAdapter } & Partial<ContextFlowConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...options };
    this.adapter = options.adapter;
    this.startTime = Date.now();

    // Determine context budget
    const budget = this.config.contextBudget === 'auto'
      ? Math.floor(this.adapter.contextWindow * 0.9) // 90% of max
      : this.config.contextBudget;

    // Initialize components
    this.eventBus = new EventBus();
    this.budgetTracker = new BudgetTracker(budget, this.eventBus);
    this.contextManager = new ContextManager(this.adapter, this.budgetTracker, this.eventBus);
    this.skillLoader = new SkillLoader(this.contextManager, this.eventBus, this.config.skillsPath);
    this.agentOrchestrator = new AgentOrchestrator(
      this.adapter,
      this.contextManager,
      this.skillLoader,
      this.eventBus,
      this.config
    );

    // Emit initialization event
    this.eventBus.emit({
      type: 'context.allocated',
      timestamp: Date.now(),
      data: { source: 'initialization', config: this.config },
      contextSnapshot: this.getContextSnapshot(),
    });
  }

  /**
   * Register an agent for later use
   */
  registerAgent(definition: AgentDefinition): void {
    this.agentOrchestrator.register(definition);
  }

  /**
   * Execute a task using specified or default agent
   */
  async execute(options: {
    task: string | Task;
    agent?: string;
    isolation?: 'strict' | 'shared';
  }): Promise<AgentResult> {
    const task: Task = typeof options.task === 'string'
      ? { description: options.task }
      : options.task;

    const agentId = options.agent || 'default';
    const isolation = options.isolation || this.config.agentIsolation;

    this.eventBus.emit({
      type: 'execution.started',
      timestamp: Date.now(),
      data: { task, agentId, isolation },
      contextSnapshot: this.getContextSnapshot(),
    });

    try {
      const result = await this.agentOrchestrator.execute(agentId, task, isolation);

      this.eventBus.emit({
        type: 'execution.completed',
        timestamp: Date.now(),
        data: { task, agentId, result },
        contextSnapshot: this.getContextSnapshot(),
      });

      return result;
    } catch (error) {
      this.eventBus.emit({
        type: 'agent.failed',
        timestamp: Date.now(),
        data: { task, agentId, error },
        contextSnapshot: this.getContextSnapshot(),
      });
      throw error;
    }
  }

  /**
   * Execute multiple tasks in parallel with isolated contexts
   */
  async executeParallel(tasks: Array<{
    task: string | Task;
    agent?: string;
  }>): Promise<AgentResult[]> {
    const maxParallel = this.config.maxParallelAgents;
    const results: AgentResult[] = [];

    // Process in batches
    for (let i = 0; i < tasks.length; i += maxParallel) {
      const batch = tasks.slice(i, i + maxParallel);
      const batchResults = await Promise.all(
        batch.map(t => this.execute({ ...t, isolation: 'strict' }))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Load a skill into context
   */
  async loadSkill(skillId: string): Promise<void> {
    await this.skillLoader.load(skillId);
  }

  /**
   * Unload a skill from context
   */
  unloadSkill(skillId: string): void {
    this.skillLoader.unload(skillId);
  }

  /**
   * Create a checkpoint of current context state
   */
  checkpoint(): ContextCheckpoint {
    return this.contextManager.checkpoint();
  }

  /**
   * Restore context to a previous checkpoint
   */
  restore(checkpoint: ContextCheckpoint): void {
    this.contextManager.restore(checkpoint);
  }

  /**
   * Get current context usage statistics
   */
  getUsage(): ContextUsage {
    return this.contextManager.getCurrentUsage();
  }

  /**
   * Get benchmark metrics for current session
   */
  getBenchmarkMetrics(): BenchmarkMetrics {
    const usage = this.contextManager.getCurrentUsage();
    const timeline = this.eventBus.getHistory();
    const elapsed = Date.now() - this.startTime;

    // Calculate useful tokens (tokens that contributed to output)
    const outputEvents = timeline.filter(e =>
      e.type === 'execution.completed' || e.type === 'agent.completed'
    );
    const usefulTokens = outputEvents.reduce((sum, e) => {
      const data = e.data as { result?: { tokensUsed?: number } };
      return sum + (data.result?.tokensUsed || 0);
    }, 0);

    // Context Efficiency Ratio
    const cer = usage.totalTokens > 0
      ? (usefulTokens / usage.totalTokens) * 100
      : 0;

    // Task Completion Cost (approximate)
    const costPerToken = 0.000003; // Adjust per model
    const tcc = usage.totalTokens * costPerToken;

    // Context Overflow Rate
    const overflowEvents = timeline.filter(e => e.type === 'context.overflow');
    const totalTasks = outputEvents.length || 1;
    const cor = (overflowEvents.length / totalTasks) * 100;

    // Agent Isolation Score
    const agentStarts = timeline.filter(e => e.type === 'agent.started').length;
    const isolatedAgents = timeline.filter(e =>
      e.type === 'agent.started' && (e.data as { isolation?: string })?.isolation === 'strict'
    ).length;
    const ais = agentStarts > 0 ? (isolatedAgents / agentStarts) * 100 : 100;

    // Progressive Loading Index
    const initialLoad = timeline.find(e => e.type === 'context.allocated')
      ?.contextSnapshot.used || 0;
    const pli = usage.peakUsage > 0
      ? 1 - (initialLoad / usage.peakUsage)
      : 1;

    return {
      cer: Math.round(cer * 100) / 100,
      tcc: Math.round(tcc * 1000) / 1000,
      cor: Math.round(cor * 100) / 100,
      ais: Math.round(ais * 100) / 100,
      pli: Math.round(pli * 1000) / 1000,
      totalTokens: usage.totalTokens,
      usefulTokens,
      timeMs: elapsed,
      peakContextUsage: usage.peakUsage,
    };
  }

  /**
   * Get event timeline for visualization
   */
  getTimeline(): ContextEvent[] {
    return this.eventBus.getHistory();
  }

  /**
   * Subscribe to context events
   */
  on(eventType: string, handler: (event: ContextEvent) => void): () => void {
    return this.eventBus.on(eventType as ContextEvent['type'], handler);
  }

  /**
   * Get remaining context capacity
   */
  getRemainingCapacity(): number {
    return this.contextManager.getRemaining();
  }

  /**
   * Check if an allocation would fit
   */
  canAllocate(tokens: number): boolean {
    return this.budgetTracker.canAllocate({ source: 'user', content: '', tokens });
  }

  private getContextSnapshot() {
    const usage = this.contextManager.getCurrentUsage();
    return {
      used: usage.totalTokens,
      capacity: this.budgetTracker.getGlobalBudget(),
      efficiency: usage.efficiency,
    };
  }
}
