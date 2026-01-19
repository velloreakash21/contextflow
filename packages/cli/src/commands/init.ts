/**
 * Init Command - Initialize ContextFlow in a project
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import boxen from 'boxen';

interface InitOptions {
  yes?: boolean;
  model?: string;
}

const DEFAULT_CONFIG = {
  version: '1.0',
  defaultModel: {
    provider: 'claude',
    model: 'claude-sonnet-4-20250514',
  },
  contextBudget: 'auto',
  agentIsolation: 'strict',
  maxParallelAgents: 4,
  skillPreloadStrategy: 'on-demand',
  enableBenchmarking: true,
};

export async function initCommand(options: InitOptions): Promise<void> {
  const cwd = process.cwd();
  const configDir = join(cwd, '.contextflow');
  const configFile = join(configDir, 'config.json');

  console.log(boxen(
    chalk.bold.cyan('ContextFlow') + '\n' +
    chalk.dim('Your AI wastes 70% of its brain. We fix that.'),
    { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'cyan' }
  ));

  // Check if already initialized
  if (existsSync(configFile)) {
    const { overwrite } = options.yes ? { overwrite: true } : await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: 'ContextFlow already initialized. Overwrite?',
      default: false,
    }]);

    if (!overwrite) {
      console.log(chalk.yellow('Aborted.'));
      return;
    }
  }

  // Gather configuration
  let config = { ...DEFAULT_CONFIG };

  if (!options.yes) {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: 'Default model provider:',
        choices: [
          { name: 'Claude (Anthropic)', value: 'claude' },
          { name: 'GPT-4 (OpenAI)', value: 'openai' },
          { name: 'Gemini (Google)', value: 'gemini' },
          { name: 'Ollama (Local)', value: 'ollama' },
        ],
        default: options.model || 'claude',
      },
      {
        type: 'list',
        name: 'isolation',
        message: 'Agent isolation mode:',
        choices: [
          { name: 'Strict (recommended) - Isolated contexts', value: 'strict' },
          { name: 'Shared - Agents share context', value: 'shared' },
        ],
        default: 'strict',
      },
      {
        type: 'confirm',
        name: 'benchmarking',
        message: 'Enable benchmarking?',
        default: true,
      },
    ]);

    config.defaultModel.provider = answers.provider;
    config.agentIsolation = answers.isolation;
    config.enableBenchmarking = answers.benchmarking;

    // Set model based on provider
    const models: Record<string, string> = {
      claude: 'claude-sonnet-4-20250514',
      openai: 'gpt-4o',
      gemini: 'gemini-1.5-pro',
      ollama: 'llama3',
    };
    config.defaultModel.model = models[answers.provider] || models.claude;
  }

  // Create directories
  const spinner = ora('Creating ContextFlow structure...').start();

  try {
    const dirs = [
      '.contextflow',
      '.contextflow/agents',
      '.contextflow/skills',
      '.contextflow/checkpoints',
    ];

    for (const dir of dirs) {
      const fullPath = join(cwd, dir);
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
      }
    }

    // Write config
    writeFileSync(configFile, JSON.stringify(config, null, 2));

    // Create default agent
    const defaultAgent = `---
name: default
description: General-purpose agent for task execution
tools: [read, write, bash, glob, grep]
model: balanced
maxContextBudget: 50000
---

# Default Agent

You are a focused implementation agent.

## Guidelines
- Complete one task at a time
- Use minimal context for maximum efficiency
- Return structured, concise responses
- Report blockers immediately
`;
    writeFileSync(join(cwd, '.contextflow/agents/default.md'), defaultAgent);

    // Create .env.example
    const envExample = `# ContextFlow Configuration

# Model API Keys (add the ones you use)
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here

# Optional: Override default model
# CONTEXTFLOW_MODEL=claude-sonnet-4-20250514

# Optional: Context budget (default: auto)
# CONTEXTFLOW_BUDGET=180000
`;
    writeFileSync(join(cwd, '.contextflow/.env.example'), envExample);

    // Update .gitignore if exists
    const gitignorePath = join(cwd, '.gitignore');
    if (existsSync(gitignorePath)) {
      let gitignore = readFileSync(gitignorePath, 'utf-8');
      if (!gitignore.includes('.contextflow/checkpoints')) {
        gitignore += '\n# ContextFlow\n.contextflow/checkpoints/\n.contextflow/.env\n';
        writeFileSync(gitignorePath, gitignore);
      }
    }

    spinner.succeed('ContextFlow initialized');

    // Print summary
    console.log('\n' + chalk.green('✓') + ' Created .contextflow/');
    console.log(chalk.green('✓') + ' Created config.json');
    console.log(chalk.green('✓') + ' Created default agent');
    console.log(chalk.green('✓') + ' Created .env.example');

    console.log('\n' + chalk.bold('Next steps:'));
    console.log(chalk.dim('1.') + ' Copy .contextflow/.env.example to .contextflow/.env');
    console.log(chalk.dim('2.') + ' Add your API key');
    console.log(chalk.dim('3.') + ' Run: ' + chalk.cyan('contextflow run "your task"'));

    console.log('\n' + chalk.dim('Docs: https://contextflow.dev'));

  } catch (error) {
    spinner.fail('Failed to initialize');
    console.error(chalk.red(error));
    process.exit(1);
  }
}
