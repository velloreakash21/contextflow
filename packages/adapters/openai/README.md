# @updatecode.ai/adapter-openai

OpenAI adapter for ContextFlow - context-efficient AI development.

## Installation

```bash
npm install @updatecode.ai/core @updatecode.ai/adapter-openai openai
```

## Usage

```typescript
import { ContextFlow } from '@updatecode.ai/core';
import { OpenAIAdapter } from '@updatecode.ai/adapter-openai';

const adapter = new OpenAIAdapter({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-5.2', // or gpt-5.2-pro, o3
});

const cf = new ContextFlow({
  adapter,
  contextBudget: 300000, // 75% of 400k for safety
});

const result = await cf.execute({
  task: 'Build a REST API endpoint',
});
```

## Supported Models (January 2026)

| Model | Context Window | Best For |
|-------|---------------|----------|
| `gpt-5.2` | 400k | General purpose |
| `gpt-5.2-pro` | 400k | Complex tasks |
| `gpt-5.2-mini` | 200k | Cost-effective |
| `o3` | 200k | Reasoning |
| `o3-mini` | 128k | Fast reasoning |

## Configuration

```typescript
const adapter = new OpenAIAdapter({
  apiKey: string,           // Required: OpenAI API key
  model: string,            // Model ID (default: gpt-5.2)
  organization: string,     // Optional: Org ID
});

// Properties
adapter.providerId          // 'openai'
adapter.modelId             // Current model
adapter.contextWindow       // Max context tokens
```

## Multi-Model Setup

```typescript
import { ContextFlow } from '@updatecode.ai/core';
import { OpenAIAdapter } from '@updatecode.ai/adapter-openai';
import { ClaudeAdapter } from '@updatecode.ai/adapter-claude';

// Use different models for different tasks
const fastAdapter = new OpenAIAdapter({ model: 'gpt-5.2-mini' });
const powerAdapter = new ClaudeAdapter({ model: 'claude-4.5-opus' });

const cf = new ContextFlow({ adapter: fastAdapter });

// Switch adapters as needed
cf.setAdapter(powerAdapter);
```

## Links

- [GitHub](https://github.com/velloreakash21/contextflow)
- [Core Package](https://www.npmjs.com/package/@updatecode.ai/core)
- [Claude Adapter](https://www.npmjs.com/package/@updatecode.ai/adapter-claude)

## License

MIT
