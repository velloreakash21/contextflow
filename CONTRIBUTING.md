# Contributing to ContextFlow

We love contributions! This document explains how to contribute effectively.

## Quick Start

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/contextflow.git
cd contextflow

# Install dependencies
npm install

# Run tests
npm test

# Start development
npm run dev
```

## Development Workflow

1. **Create a branch** from `main`: `git checkout -b feature/your-feature`
2. **Make changes** following our code style
3. **Write tests** for new functionality
4. **Run checks**: `npm run lint && npm test`
5. **Commit** with conventional commits: `feat: add new feature`
6. **Push** and create a Pull Request

## Code Style

- TypeScript strict mode
- No `any` types (use `unknown` if needed)
- Max 200 lines per file
- Max 20 lines per function
- Document public APIs with JSDoc

## Commit Convention

```
type(scope): description

feat: new feature
fix: bug fix
docs: documentation
refactor: code refactoring
test: adding tests
chore: maintenance
```

## Priority Areas

1. **Model Adapters** - Gemini, Ollama, Cohere
2. **Dashboard** - React components, visualizations
3. **Benchmarks** - New test cases, optimizations
4. **Documentation** - Guides, examples, API docs

## Questions?

Open an issue or join our Discord.
