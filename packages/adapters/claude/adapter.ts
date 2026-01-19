/**
 * Claude Adapter for ContextFlow
 *
 * Implements the ModelAdapter interface for Anthropic's Claude models.
 */

import type { ModelAdapter, ExecutionRequest, ExecutionResult, Message } from '@contextflow/core';

export interface ClaudeAdapterConfig {
  apiKey: string;
  model?: 'claude-sonnet-4-20250514' | 'claude-opus-4-20250514' | 'claude-haiku-3-20240307' | string;
  baseUrl?: string;
  maxRetries?: number;
}

// Token estimation constants (Claude uses ~4 chars per token on average)
const CHARS_PER_TOKEN = 4;

// Context windows by model (January 2026)
const CONTEXT_WINDOWS: Record<string, number> = {
  // Claude 4.5 series (2026) - 200k with <5% degradation
  'claude-4.5-opus': 200000,
  'claude-4.5-sonnet': 200000,
  'claude-4.5-haiku': 200000,
  // Claude 4 series
  'claude-4-opus': 200000,
  'claude-4-sonnet': 200000,
  // Legacy Claude 3.5
  'claude-3-5-sonnet-20241022': 200000,
  'claude-3-5-haiku-20241022': 200000,
};

export class ClaudeAdapter implements ModelAdapter {
  readonly providerId = 'anthropic';
  readonly modelId: string;
  readonly contextWindow: number;

  private apiKey: string;
  private baseUrl: string;
  private maxRetries: number;

  constructor(config: ClaudeAdapterConfig) {
    this.apiKey = config.apiKey;
    this.modelId = config.model || 'claude-sonnet-4-20250514';
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com';
    this.maxRetries = config.maxRetries || 3;
    this.contextWindow = CONTEXT_WINDOWS[this.modelId] || 200000;
  }

  /**
   * Count tokens in content (approximation without API call)
   */
  countTokens(content: string | Message[]): number {
    if (typeof content === 'string') {
      return Math.ceil(content.length / CHARS_PER_TOKEN);
    }

    let totalChars = 0;
    for (const message of content) {
      if (typeof message.content === 'string') {
        totalChars += message.content.length;
      } else if (Array.isArray(message.content)) {
        for (const block of message.content) {
          if ('text' in block) {
            totalChars += block.text.length;
          }
        }
      }
      // Add overhead for role and structure
      totalChars += 20;
    }

    return Math.ceil(totalChars / CHARS_PER_TOKEN);
  }

  /**
   * Quick estimate without iterating
   */
  estimateTokens(content: string): number {
    return Math.ceil(content.length / CHARS_PER_TOKEN);
  }

  /**
   * Execute a request against Claude API
   */
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const startTime = Date.now();

    // Convert to Anthropic format
    const anthropicRequest = this.toAnthropicFormat(request);

    // Make API call
    const response = await this.callAPI(anthropicRequest);

    // Parse response
    return this.parseResponse(response, startTime);
  }

  /**
   * Stream a request (returns async iterator)
   */
  async *stream(request: ExecutionRequest): AsyncIterable<{ type: 'text' | 'tool_use'; content: string }> {
    const anthropicRequest = this.toAnthropicFormat(request);
    anthropicRequest.stream = true;

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(anthropicRequest),
    });

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'content_block_delta') {
            yield {
              type: 'text',
              content: data.delta?.text || '',
            };
          }
        }
      }
    }
  }

  supportsTools(): boolean {
    return true;
  }

  supportsVision(): boolean {
    return true;
  }

  maxOutputTokens(): number {
    return 8192;
  }

  // Private helpers

  private toAnthropicFormat(request: ExecutionRequest): Record<string, unknown> {
    const messages = request.messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));

    // Extract system message
    const systemMsg = request.messages.find(m => m.role === 'system');

    return {
      model: this.modelId,
      max_tokens: request.maxTokens || 4096,
      messages: messages.filter(m => m.role !== 'system'),
      system: systemMsg?.content,
      temperature: request.temperature ?? 0.7,
      tools: request.tools,
    };
  }

  private async callAPI(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/v1/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`API error: ${response.status} ${error}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.maxRetries - 1) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError;
  }

  private parseResponse(response: Record<string, unknown>, startTime: number): ExecutionResult {
    const content = response.content as Array<{ type: string; text?: string }>;
    const textContent = content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('');

    const usage = response.usage as { input_tokens: number; output_tokens: number };

    return {
      content: textContent,
      tokensUsed: {
        input: usage.input_tokens,
        output: usage.output_tokens,
        total: usage.input_tokens + usage.output_tokens,
      },
      stopReason: response.stop_reason as 'end' | 'max_tokens' | 'tool_use',
      toolCalls: content
        .filter(c => c.type === 'tool_use')
        .map(c => c as unknown as { id: string; name: string; input: unknown }),
    };
  }
}

export default ClaudeAdapter;
