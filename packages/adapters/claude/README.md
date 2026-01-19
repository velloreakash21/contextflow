# @updatecode.ai/adapter-claude

Claude (Anthropic) adapter for ContextFlow - context-efficient AI development.

## Installation

```bash
npm install @updatecode.ai/core @updatecode.ai/adapter-claude @anthropic-ai/sdk
```

## Usage

```typescript
import { ContextFlow } from '@updatecode.ai/core';
import { ClaudeAdapter } from '@updatecode.ai/adapter-claude';

const adapter = new ClaudeAdapter({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-4.5-sonnet', // or claude-4.5-opus, claude-4.5-haiku
});

const cf = new ContextFlow({
  adapter,
  contextBudget: 150000, // 75% of 200k for safety
});

const result = await cf.execute({
  task: 'Build a REST API endpoint',
});
```

## Supported Models (January 2026)

| Model | Context Window | Best For |
|-------|---------------|----------|
| `claude-4.5-opus` | 200k | Complex reasoning |
| `claude-4.5-sonnet` | 200k | Balanced performance |
| `claude-4.5-haiku` | 200k | Fast, cost-effective |

## Configuration

```typescript
const adapter = new ClaudeAdapter({
  apiKey: string,           // Required: Anthropic API key
  model: string,            // Model ID (default: claude-4.5-sonnet)
  maxRetries: number,       // Retry attempts (default: 3)
});

// Properties
adapter.providerId          // 'anthropic'
adapter.modelId             // Current model
adapter.contextWindow       // Max context tokens
```

## With Claude Code

ContextFlow is optimized for Claude Code users:

```bash
# Install globally
npm install -g @updatecode.ai/cli

# Initialize in your project
contextflow init

# Run with tracking
contextflow run "Add user authentication"

# View real-time dashboard
contextflow dashboard
```

## Links

- [GitHub](https://github.com/velloreakash21/contextflow)
- [Core Package](https://www.npmjs.com/package/@updatecode.ai/core)
- [OpenAI Adapter](https://www.npmjs.com/package/@updatecode.ai/adapter-openai)

## License

MIT
