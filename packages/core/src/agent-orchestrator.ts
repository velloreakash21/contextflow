/**
 * AgentOrchestrator - Multi-agent lifecycle management
 *
 * Manages agent registration, spawning, execution with isolated
 * contexts, and result aggregation.
 */

import type {
  ModelAdapter,
  AgentDefinition,
  AgentHandle,
  AgentResult,
  Task,
  ContextFlowConfig,
  Message,
  ExecutionRequest,
} from './types';
import type { ContextManager } from './context-manager';
import type { SkillLoader } from './skill-loader';
import type { EventBus } from './event-bus';

const DEFAULT_AGENT: AgentDefinition = {
  id: 'default',
  name: 'Default Agent',
  description: 'General-purpose agent for task execution',
  tools: ['read', 'write', 'bash'],
  model: 'balanced',
  skills: [],
  maxContextBudget: 50000,
};

export class AgentOrchestrator {
  private readonly adapter: ModelAdapter;
  private readonly contextManager: ContextManager;
  private readonly skillLoader: SkillLoader;
  private readonly eventBus: EventBus;
  private readonly config: ContextFlowConfig;
  private readonly agents: Map<string, AgentDefinition> = new Map();
  private readonly activeHandles: Map<string, AgentHandle> = new Map();
  private handleCounter: number = 0;

  constructor(
    adapter: ModelAdapter,
    contextManager: ContextManager,
    skillLoader: SkillLoader,
    eventBus: EventBus,
    config: ContextFlowConfig
  ) {
    this.adapter = adapter;
    this.contextManager = contextManager;
    this.skillLoader = skillLoader;
    this.eventBus = eventBus;
    this.config = config;

    // Register default agent
    this.register(DEFAULT_AGENT);
  }

  /**
   * Register an agent definition
   */
  register(definition: AgentDefinition): void {
    this.agents.set(definition.id, definition);
  }

  /**
   * Get agent definition by ID
   */
  getAgent(agentId: string): AgentDefinition | undefined {
    return this.agents.get(agentId);
  }

  /**
   * List all registered agents
   */
  listAgents(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  /**
   * Execute a task with an agent
   */
  async execute(
    agentId: string,
    task: Task,
    isolation: 'strict' | 'shared'
  ): Promise<AgentResult> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // Create handle
    const handle = this.createHandle(agent);
    this.activeHandles.set(handle.id, handle);

    this.eventBus.emit({
      type: 'agent.started',
      timestamp: Date.now(),
      data: { handle, task, isolation },
      contextSnapshot: this.getSnapshot(),
    });

    try {
      // Load required skills
      for (const skillId of agent.skills) {
        await this.skillLoader.load(skillId);
      }

      // Build execution context
      const messages = this.buildMessages(agent, task);

      // Execute with adapter
      const startTime = Date.now();
      const response = await this.adapter.execute({
        messages,
        maxTokens: this.getMaxTokens(agent),
        temperature: 0.7,
      });

      // Calculate result
      const duration = Date.now() - startTime;
      const result: AgentResult = {
        handle: {
          ...handle,
          status: 'completed',
          completedAt: Date.now(),
        },
        output: response.content,
        tokensUsed: response.tokensUsed.total,
        duration,
      };

      // Update handle
      this.activeHandles.set(handle.id, result.handle);

      // Allocate output tokens
      this.contextManager.allocate({
        source: 'agent',
        content: response.content,
        label: `${agent.name} output`,
        metadata: { agentId, taskDescription: task.description },
      });

      this.eventBus.emit({
        type: 'agent.completed',
        timestamp: Date.now(),
        data: { handle: result.handle, tokensUsed: response.tokensUsed },
        contextSnapshot: this.getSnapshot(),
      });

      // Cleanup if isolated
      if (isolation === 'strict') {
        this.skillLoader.unloadAll();
      }

      return result;
    } catch (error) {
      const failedHandle: AgentHandle = {
        ...handle,
        status: 'failed',
        completedAt: Date.now(),
      };

      this.activeHandles.set(handle.id, failedHandle);

      this.eventBus.emit({
        type: 'agent.failed',
        timestamp: Date.now(),
        data: { handle: failedHandle, error },
        contextSnapshot: this.getSnapshot(),
      });

      return {
        handle: failedHandle,
        output: null,
        tokensUsed: 0,
        duration: Date.now() - handle.startedAt,
        error: error as Error,
      };
    }
  }

  /**
   * Execute multiple tasks in parallel with strict isolation
   */
  async executeParallel(
    tasks: Array<{ agentId: string; task: Task }>
  ): Promise<AgentResult[]> {
    const promises = tasks.map(({ agentId, task }) =>
      this.execute(agentId, task, 'strict')
    );

    return Promise.all(promises);
  }

  /**
   * Get active handles
   */
  getActiveHandles(): AgentHandle[] {
    return Array.from(this.activeHandles.values())
      .filter(h => h.status === 'running');
  }

  /**
   * Terminate an agent
   */
  terminate(handleId: string): boolean {
    const handle = this.activeHandles.get(handleId);
    if (!handle || handle.status !== 'running') return false;

    handle.status = 'failed';
    handle.completedAt = Date.now();

    this.eventBus.emit({
      type: 'agent.failed',
      timestamp: Date.now(),
      data: { handle, reason: 'terminated' },
      contextSnapshot: this.getSnapshot(),
    });

    return true;
  }

  private createHandle(agent: AgentDefinition): AgentHandle {
    return {
      id: `handle-${++this.handleCounter}-${Date.now().toString(36)}`,
      agentId: agent.id,
      status: 'running',
      contextUsage: this.contextManager.getCurrentUsage(),
      startedAt: Date.now(),
    };
  }

  private buildMessages(agent: AgentDefinition, task: Task): Message[] {
    const messages: Message[] = [];

    // System prompt
    const systemPrompt = this.buildSystemPrompt(agent);
    messages.push({ role: 'system', content: systemPrompt });

    // Task context if provided
    if (task.context) {
      messages.push({ role: 'user', content: `Context:\n${task.context}` });
    }

    // Main task
    messages.push({ role: 'user', content: task.description });

    return messages;
  }

  private buildSystemPrompt(agent: AgentDefinition): string {
    const parts: string[] = [
      `You are ${agent.name}.`,
      agent.description,
      '',
      'Guidelines:',
      '- Focus on the specific task given',
      '- Use minimal context for maximum efficiency',
      '- Return structured, concise responses',
      '- Report blockers immediately rather than guessing',
    ];

    // Add loaded skills content
    const loadedSkills = this.skillLoader.getLoadedSkills();
    if (loadedSkills.length > 0) {
      parts.push('', 'Loaded Skills:');
      for (const skill of loadedSkills) {
        parts.push(`- ${skill.name}: ${skill.description}`);
      }
    }

    return parts.join('\n');
  }

  private getMaxTokens(agent: AgentDefinition): number {
    const adapterMax = this.adapter.maxOutputTokens();
    const agentMax = agent.maxContextBudget || 50000;
    return Math.min(adapterMax, agentMax, 8192);
  }

  private getSnapshot() {
    const usage = this.contextManager.getCurrentUsage();
    return {
      used: usage.totalTokens,
      capacity: this.adapter.contextWindow,
      efficiency: usage.efficiency,
    };
  }
}
