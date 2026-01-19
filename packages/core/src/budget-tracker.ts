/**
 * BudgetTracker - Context budget enforcement
 *
 * Manages global and per-agent budgets, predicts overflow,
 * and provides suggestions for staying within limits.
 */

import type { AllocationRequest, ContextEvent } from './types';
import type { EventBus } from './event-bus';

interface AgentBudget {
  agentId: string;
  budget: number;
  used: number;
}

export interface BudgetSuggestion {
  type: 'unload_skill' | 'checkpoint' | 'reduce_context' | 'spawn_agent';
  description: string;
  tokensSaved: number;
  priority: 'high' | 'medium' | 'low';
}

export interface OverflowPrediction {
  willOverflow: boolean;
  remainingAfter: number;
  suggestedActions: BudgetSuggestion[];
}

type EnforcementMode = 'strict' | 'warn' | 'none';

export class BudgetTracker {
  private globalBudget: number;
  private readonly eventBus: EventBus;
  private readonly agentBudgets: Map<string, AgentBudget> = new Map();
  private currentUsage: number = 0;
  private enforcementMode: EnforcementMode = 'strict';

  constructor(globalBudget: number, eventBus: EventBus) {
    this.globalBudget = globalBudget;
    this.eventBus = eventBus;
  }

  /**
   * Set the global context budget
   */
  setGlobalBudget(tokens: number): void {
    this.globalBudget = tokens;
  }

  /**
   * Get the global context budget
   */
  getGlobalBudget(): number {
    return this.globalBudget;
  }

  /**
   * Set budget for a specific agent
   */
  setAgentBudget(agentId: string, tokens: number): void {
    const existing = this.agentBudgets.get(agentId);
    this.agentBudgets.set(agentId, {
      agentId,
      budget: tokens,
      used: existing?.used || 0,
    });
  }

  /**
   * Get budget info for an agent
   */
  getAgentBudget(agentId: string): AgentBudget | undefined {
    return this.agentBudgets.get(agentId);
  }

  /**
   * Check if allocation would fit
   */
  canAllocate(request: AllocationRequest & { tokens: number }): boolean {
    const wouldUse = this.currentUsage + request.tokens;

    if (this.enforcementMode === 'none') {
      return true;
    }

    if (wouldUse > this.globalBudget) {
      if (this.enforcementMode === 'warn') {
        console.warn(
          `Budget warning: allocation of ${request.tokens} tokens would exceed budget. ` +
          `Current: ${this.currentUsage}, Budget: ${this.globalBudget}`
        );
        return true;
      }
      return false;
    }

    return true;
  }

  /**
   * Record an allocation
   */
  recordAllocation(tokens: number, agentId?: string): void {
    this.currentUsage += tokens;

    if (agentId) {
      const agentBudget = this.agentBudgets.get(agentId);
      if (agentBudget) {
        agentBudget.used += tokens;
      }
    }
  }

  /**
   * Record a release
   */
  recordRelease(tokens: number, agentId?: string): void {
    this.currentUsage = Math.max(0, this.currentUsage - tokens);

    if (agentId) {
      const agentBudget = this.agentBudgets.get(agentId);
      if (agentBudget) {
        agentBudget.used = Math.max(0, agentBudget.used - tokens);
      }
    }
  }

  /**
   * Predict if operations would cause overflow
   */
  predictOverflow(operations: Array<{ tokens: number }>): OverflowPrediction {
    let projected = this.currentUsage;

    for (const op of operations) {
      projected += op.tokens;
    }

    const willOverflow = projected > this.globalBudget;
    const remainingAfter = this.globalBudget - projected;

    const suggestions = this.generateSuggestions(projected);

    return {
      willOverflow,
      remainingAfter,
      suggestedActions: willOverflow ? suggestions : [],
    };
  }

  /**
   * Get optimization suggestions
   */
  getSuggestions(): BudgetSuggestion[] {
    return this.generateSuggestions(this.currentUsage);
  }

  /**
   * Set enforcement mode
   */
  setEnforcementMode(mode: EnforcementMode): void {
    this.enforcementMode = mode;
  }

  /**
   * Get current enforcement mode
   */
  getEnforcementMode(): EnforcementMode {
    return this.enforcementMode;
  }

  /**
   * Get usage percentage
   */
  getUsagePercentage(): number {
    return (this.currentUsage / this.globalBudget) * 100;
  }

  /**
   * Get remaining budget
   */
  getRemaining(): number {
    return this.globalBudget - this.currentUsage;
  }

  /**
   * Reset all tracking
   */
  reset(): void {
    this.currentUsage = 0;
    for (const budget of this.agentBudgets.values()) {
      budget.used = 0;
    }
  }

  private generateSuggestions(projectedUsage: number): BudgetSuggestion[] {
    const suggestions: BudgetSuggestion[] = [];
    const overage = projectedUsage - this.globalBudget;

    if (overage <= 0) return suggestions;

    // Suggestion: Unload skills
    suggestions.push({
      type: 'unload_skill',
      description: 'Unload unused skills to free context',
      tokensSaved: Math.min(overage, 5000),
      priority: 'high',
    });

    // Suggestion: Create checkpoint
    suggestions.push({
      type: 'checkpoint',
      description: 'Create checkpoint and clear intermediate context',
      tokensSaved: Math.min(overage, 20000),
      priority: 'medium',
    });

    // Suggestion: Spawn isolated agent
    suggestions.push({
      type: 'spawn_agent',
      description: 'Move work to isolated agent context',
      tokensSaved: Math.min(overage, 50000),
      priority: 'high',
    });

    // Suggestion: Reduce context
    suggestions.push({
      type: 'reduce_context',
      description: 'Summarize or truncate older messages',
      tokensSaved: Math.min(overage, 30000),
      priority: 'low',
    });

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return suggestions;
  }
}
