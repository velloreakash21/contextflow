/**
 * EventBus - Central event system for observability
 *
 * Provides pub/sub for all context events, enabling real-time
 * monitoring, benchmarking, and visualization.
 */

import type { ContextEvent, ContextEventType } from './types';

type EventHandler = (event: ContextEvent) => void;
type Unsubscribe = () => void;

interface Subscription {
  id: string;
  type: ContextEventType | '*';
  handler: EventHandler;
}

export class EventBus {
  private readonly subscriptions: Map<string, Subscription> = new Map();
  private readonly history: ContextEvent[] = [];
  private readonly maxHistorySize: number;
  private subscriptionCounter: number = 0;

  constructor(options: { maxHistorySize?: number } = {}) {
    this.maxHistorySize = options.maxHistorySize || 10000;
  }

  /**
   * Emit an event to all subscribers
   */
  emit(event: ContextEvent): void {
    // Add to history
    this.history.push(event);

    // Trim history if needed
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Notify subscribers
    for (const subscription of this.subscriptions.values()) {
      if (subscription.type === '*' || subscription.type === event.type) {
        try {
          subscription.handler(event);
        } catch (error) {
          console.error(`Event handler error for ${event.type}:`, error);
        }
      }
    }
  }

  /**
   * Subscribe to events
   */
  on(type: ContextEventType | '*', handler: EventHandler): Unsubscribe {
    const id = `sub-${++this.subscriptionCounter}`;

    this.subscriptions.set(id, { id, type, handler });

    return () => {
      this.subscriptions.delete(id);
    };
  }

  /**
   * Subscribe to a single event occurrence
   */
  once(type: ContextEventType, handler: EventHandler): Unsubscribe {
    const unsubscribe = this.on(type, (event) => {
      unsubscribe();
      handler(event);
    });
    return unsubscribe;
  }

  /**
   * Get event history
   */
  getHistory(): ContextEvent[] {
    return [...this.history];
  }

  /**
   * Get history filtered by type
   */
  getHistoryByType(type: ContextEventType): ContextEvent[] {
    return this.history.filter(e => e.type === type);
  }

  /**
   * Get history in a time range
   */
  getHistoryInRange(startTime: number, endTime: number): ContextEvent[] {
    return this.history.filter(e =>
      e.timestamp >= startTime && e.timestamp <= endTime
    );
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.history.length = 0;
  }

  /**
   * Export timeline for visualization
   */
  exportTimeline(): {
    events: ContextEvent[];
    summary: {
      totalEvents: number;
      byType: Record<string, number>;
      duration: number;
      startTime: number;
      endTime: number;
    };
  } {
    const events = this.getHistory();
    const byType: Record<string, number> = {};

    for (const event of events) {
      byType[event.type] = (byType[event.type] || 0) + 1;
    }

    const startTime = events[0]?.timestamp || 0;
    const endTime = events[events.length - 1]?.timestamp || 0;

    return {
      events,
      summary: {
        totalEvents: events.length,
        byType,
        duration: endTime - startTime,
        startTime,
        endTime,
      },
    };
  }

  /**
   * Get count of active subscriptions
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Remove all subscriptions
   */
  removeAllSubscriptions(): void {
    this.subscriptions.clear();
  }
}
