/**
 * ContextManager - Core context tracking engine
 *
 * Manages all context allocations, tracks usage, and provides
 * checkpoint/restore capabilities for context state.
 */

import type {
  ModelAdapter,
  Allocation,
  AllocationRequest,
  AllocationResult,
  ContextUsage,
  ContextCheckpoint,
  Message,
} from './types';
import type { BudgetTracker } from './budget-tracker';
import type { EventBus } from './event-bus';

export class ContextManager {
  private readonly adapter: ModelAdapter;
  private readonly budgetTracker: BudgetTracker;
  private readonly eventBus: EventBus;
  private allocations: Map<string, Allocation> = new Map();
  private peakUsage: number = 0;
  private allocationCounter: number = 0;

  constructor(adapter: ModelAdapter, budgetTracker: BudgetTracker, eventBus: EventBus) {
    this.adapter = adapter;
    this.budgetTracker = budgetTracker;
    this.eventBus = eventBus;
  }

  /**
   * Allocate context for content
   */
  allocate(request: AllocationRequest): AllocationResult {
    const id = this.generateId();
    const tokens = this.countTokens(request.content);

    // Check budget
    if (!this.budgetTracker.canAllocate({ ...request, tokens })) {
      this.eventBus.emit({
        type: 'context.overflow',
        timestamp: Date.now(),
        data: { request, tokens, available: this.getRemaining() },
        contextSnapshot: this.getSnapshot(),
      });

      return {
        id,
        tokens,
        success: false,
        reason: `Insufficient context: need ${tokens}, have ${this.getRemaining()}`,
      };
    }

    // Create allocation
    const allocation: Allocation = {
      id,
      source: request.source,
      tokens,
      timestamp: Date.now(),
      label: request.label,
      metadata: request.metadata,
    };

    this.allocations.set(id, allocation);
    this.updatePeak();

    this.eventBus.emit({
      type: 'context.allocated',
      timestamp: Date.now(),
      data: { allocation },
      contextSnapshot: this.getSnapshot(),
    });

    return { id, tokens, success: true };
  }

  /**
   * Release an allocation
   */
  release(allocationId: string): boolean {
    const allocation = this.allocations.get(allocationId);
    if (!allocation) return false;

    this.allocations.delete(allocationId);

    this.eventBus.emit({
      type: 'context.released',
      timestamp: Date.now(),
      data: { allocation },
      contextSnapshot: this.getSnapshot(),
    });

    return true;
  }

  /**
   * Release all allocations from a source
   */
  releaseBySource(source: Allocation['source']): number {
    let released = 0;
    for (const [id, allocation] of this.allocations) {
      if (allocation.source === source) {
        this.allocations.delete(id);
        released++;
      }
    }

    if (released > 0) {
      this.eventBus.emit({
        type: 'context.released',
        timestamp: Date.now(),
        data: { source, count: released },
        contextSnapshot: this.getSnapshot(),
      });
    }

    return released;
  }

  /**
   * Get current usage statistics
   */
  getCurrentUsage(): ContextUsage {
    const allocations = Array.from(this.allocations.values());
    const totalTokens = allocations.reduce((sum, a) => sum + a.tokens, 0);
    const capacity = this.budgetTracker.getGlobalBudget();

    return {
      totalTokens,
      allocations,
      peakUsage: this.peakUsage,
      efficiency: this.calculateEfficiency(allocations),
    };
  }

  /**
   * Get remaining capacity
   */
  getRemaining(): number {
    const used = this.getTotalTokens();
    return this.budgetTracker.getGlobalBudget() - used;
  }

  /**
   * Get total allocated tokens
   */
  getTotalTokens(): number {
    return Array.from(this.allocations.values())
      .reduce((sum, a) => sum + a.tokens, 0);
  }

  /**
   * Create a checkpoint of current state
   */
  checkpoint(): ContextCheckpoint {
    const id = `checkpoint-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const checkpoint: ContextCheckpoint = {
      id,
      timestamp: Date.now(),
      usage: this.getCurrentUsage(),
      state: {
        allocations: new Map(this.allocations),
        peakUsage: this.peakUsage,
        counter: this.allocationCounter,
      },
    };

    this.eventBus.emit({
      type: 'context.checkpoint',
      timestamp: Date.now(),
      data: { checkpointId: id },
      contextSnapshot: this.getSnapshot(),
    });

    return checkpoint;
  }

  /**
   * Restore state from checkpoint
   */
  restore(checkpoint: ContextCheckpoint): void {
    const state = checkpoint.state as {
      allocations: Map<string, Allocation>;
      peakUsage: number;
      counter: number;
    };

    this.allocations = new Map(state.allocations);
    this.peakUsage = state.peakUsage;
    this.allocationCounter = state.counter;

    this.eventBus.emit({
      type: 'context.restored',
      timestamp: Date.now(),
      data: { checkpointId: checkpoint.id },
      contextSnapshot: this.getSnapshot(),
    });
  }

  /**
   * Count tokens in content
   */
  countTokens(content: string | Message[]): number {
    return this.adapter.countTokens(content);
  }

  /**
   * Get allocations grouped by source
   */
  getAllocationsBySource(): Record<string, { count: number; tokens: number }> {
    const result: Record<string, { count: number; tokens: number }> = {};

    for (const allocation of this.allocations.values()) {
      if (!result[allocation.source]) {
        result[allocation.source] = { count: 0, tokens: 0 };
      }
      result[allocation.source].count++;
      result[allocation.source].tokens += allocation.tokens;
    }

    return result;
  }

  private generateId(): string {
    return `alloc-${++this.allocationCounter}-${Date.now().toString(36)}`;
  }

  private updatePeak(): void {
    const current = this.getTotalTokens();
    if (current > this.peakUsage) {
      this.peakUsage = current;
    }
  }

  private calculateEfficiency(allocations: Allocation[]): number {
    if (allocations.length === 0) return 100;

    // Efficiency = useful allocations / total allocations
    // Useful = agent, user, tool (actual work)
    // Overhead = system, skill (supporting context)
    const useful = allocations
      .filter(a => ['agent', 'user', 'tool'].includes(a.source))
      .reduce((sum, a) => sum + a.tokens, 0);

    const total = allocations.reduce((sum, a) => sum + a.tokens, 0);

    return total > 0 ? (useful / total) * 100 : 100;
  }

  private getSnapshot() {
    const usage = this.getCurrentUsage();
    return {
      used: usage.totalTokens,
      capacity: this.budgetTracker.getGlobalBudget(),
      efficiency: usage.efficiency,
    };
  }
}
