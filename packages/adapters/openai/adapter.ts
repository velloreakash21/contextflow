/**
 * OpenAI Adapter for ContextFlow
 *
 * Implements the ModelAdapter interface for OpenAI's GPT models.
 */

import type { ModelAdapter, ExecutionRequest, ExecutionResult, Message } from '@contextflow/core';

export interface OpenAIAdapterConfig {
  apiKey: string;
  model?: 'gpt-4o' | 'gpt-4-turbo' | 'gpt-4' | 'gpt-3.5-turbo' | string;
  baseUrl?: string;
  organization?: string;
  maxRetries?: number;
}

// Context windows by model (January 2026)
const CONTEXT_WINDOWS: Record<string, number> = {
  // GPT-5.2 series (Dec 2025) - 400k context, 128k output
  'gpt-5.2': 400000,
  'gpt-5.2-pro': 400000,
  'gpt-5.2-mini': 200000,
  // o3 reasoning models
  'o3': 200000,
  'o3-mini': 128000,
  // Legacy o1
  'o1': 200000,
  'o1-mini': 128000,
  // GPT-4o series
  'gpt-4o': 128000,
  'gpt-4o-mini': 128000,
};

// Approximate token ratio (tiktoken would be more accurate)
const CHARS_PER_TOKEN = 4;

export class OpenAIAdapter implements ModelAdapter {
  readonly providerId = 'openai';
  readonly modelId: string;
  readonly contextWindow: number;

  private apiKey: string;
  private baseUrl: string;
  private organization?: string;
  private maxRetries: number;

  constructor(config: OpenAIAdapterConfig) {
    this.apiKey = config.apiKey;
    this.modelId = config.model || 'gpt-4o';
    this.baseUrl = config.baseUrl || 'https://api.openai.com';
    this.organization = config.organization;
    this.maxRetries = config.maxRetries || 3;
    this.contextWindow = CONTEXT_WINDOWS[this.modelId] || 128000;
  }

  countTokens(content: string | Message[]): number {
    // TODO: Use tiktoken for accurate counting
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
      totalChars += 20; // Role overhead
    }

    return Math.ceil(totalChars / CHARS_PER_TOKEN);
  }

  estimateTokens(content: string): number {
    return Math.ceil(content.length / CHARS_PER_TOKEN);
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const openaiRequest = this.toOpenAIFormat(request);
    const response = await this.callAPI(openaiRequest);
    return this.parseResponse(response);
  }

  async *stream(request: ExecutionRequest): AsyncIterable<{ type: 'text' | 'tool_use'; content: string }> {
    const openaiRequest = this.toOpenAIFormat(request);
    openaiRequest.stream = true;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };

    if (this.organization) {
      headers['OpenAI-Organization'] = this.organization;
    }

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(openaiRequest),
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
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            const delta = data.choices?.[0]?.delta?.content;
            if (delta) {
              yield { type: 'text', content: delta };
            }
          } catch {
            // Skip malformed lines
          }
        }
      }
    }
  }

  supportsTools(): boolean {
    return true;
  }

  supportsVision(): boolean {
    // GPT-4 Vision models
    return this.modelId.includes('gpt-4') || this.modelId.includes('gpt-4o');
  }

  maxOutputTokens(): number {
    if (this.modelId.includes('gpt-4o')) return 16384;
    if (this.modelId.includes('gpt-4-turbo')) return 4096;
    return 4096;
  }

  // Private helpers

  private toOpenAIFormat(request: ExecutionRequest): Record<string, unknown> {
    const messages = request.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    const result: Record<string, unknown> = {
      model: this.modelId,
      messages,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature ?? 0.7,
    };

    if (request.tools && request.tools.length > 0) {
      result.tools = request.tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      }));
    }

    return result;
  }

  private async callAPI(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    let lastError: Error | null = null;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };

    if (this.organization) {
      headers['OpenAI-Organization'] = this.organization;
    }

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
          method: 'POST',
          headers,
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

  private parseResponse(response: Record<string, unknown>): ExecutionResult {
    const choice = (response.choices as Array<Record<string, unknown>>)?.[0];
    const message = choice?.message as Record<string, unknown>;
    const usage = response.usage as { prompt_tokens: number; completion_tokens: number; total_tokens: number };

    const toolCalls = (message?.tool_calls as Array<Record<string, unknown>>)?.map(tc => ({
      id: tc.id as string,
      name: (tc.function as Record<string, unknown>)?.name as string,
      input: JSON.parse((tc.function as Record<string, unknown>)?.arguments as string || '{}'),
    }));

    return {
      content: message?.content as string || '',
      tokensUsed: {
        input: usage?.prompt_tokens || 0,
        output: usage?.completion_tokens || 0,
        total: usage?.total_tokens || 0,
      },
      stopReason: toolCalls?.length ? 'tool_use' : (choice?.finish_reason === 'length' ? 'max_tokens' : 'end'),
      toolCalls,
    };
  }
}

export default OpenAIAdapter;
