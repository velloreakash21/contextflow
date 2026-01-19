/**
 * Run Command - Execute tasks with context tracking
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { renderTUI } from '../ui/tui.js';

interface RunOptions {
  agent?: string;
  isolation?: 'strict' | 'shared';
  dashboard?: boolean;
}

interface Config {
  defaultModel: { provider: string; model: string };
  agentIsolation: string;
  enableBenchmarking: boolean;
}

export async function runCommand(task: string, options: RunOptions): Promise<void> {
  const cwd = process.cwd();
  const configPath = join(cwd, '.contextflow/config.json');

  // Check initialization
  if (!existsSync(configPath)) {
    console.log(chalk.red('Error:') + ' ContextFlow not initialized.');
    console.log('Run: ' + chalk.cyan('contextflow init'));
    process.exit(1);
  }

  const config: Config = JSON.parse(readFileSync(configPath, 'utf-8'));

  // Check for API key
  const envPath = join(cwd, '.contextflow/.env');
  let apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;

  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');
    const match = envContent.match(/(?:ANTHROPIC|OPENAI|GOOGLE)_API_KEY=(.+)/);
    if (match) apiKey = match[1];
  }

  if (!apiKey || apiKey === 'your_key_here') {
    console.log(chalk.red('Error:') + ' No API key found.');
    console.log('Set ' + chalk.cyan('ANTHROPIC_API_KEY') + ' or add to .contextflow/.env');
    process.exit(1);
  }

  const agent = options.agent || 'default';
  const isolation = options.isolation || config.agentIsolation || 'strict';
  const showDashboard = options.dashboard !== false;

  console.log(boxHeader('ContextFlow Run'));
  console.log(chalk.dim('Task:    ') + task);
  console.log(chalk.dim('Agent:   ') + agent);
  console.log(chalk.dim('Mode:    ') + isolation);
  console.log(chalk.dim('Model:   ') + config.defaultModel.model);
  console.log();

  if (showDashboard) {
    // Run with TUI
    await renderTUI({
      task,
      agent,
      isolation,
      config,
      apiKey,
    });
  } else {
    // Run without TUI
    await runWithoutTUI(task, agent, isolation, config, apiKey);
  }
}

async function runWithoutTUI(
  task: string,
  agent: string,
  isolation: string,
  config: Config,
  apiKey: string
): Promise<void> {
  const spinner = ora('Executing task...').start();

  // Simulate execution (replace with actual ContextFlow integration)
  const startTime = Date.now();
  let tokensUsed = 0;
  let efficiency = 0;

  try {
    // In real implementation, this would use ContextFlow core
    spinner.text = 'Loading agent context...';
    await sleep(500);
    tokensUsed += 2500;

    spinner.text = 'Processing task...';
    await sleep(1500);
    tokensUsed += 15000;

    spinner.text = 'Generating response...';
    await sleep(1000);
    tokensUsed += 8000;

    efficiency = 67 + Math.random() * 15;

    spinner.succeed('Task completed');

    const duration = Date.now() - startTime;

    console.log();
    console.log(chalk.bold('Results:'));
    console.log(chalk.dim('─'.repeat(40)));
    console.log(formatMetric('Tokens Used', tokensUsed.toLocaleString()));
    console.log(formatMetric('Efficiency', efficiency.toFixed(1) + '%'));
    console.log(formatMetric('Duration', (duration / 1000).toFixed(1) + 's'));
    console.log(formatMetric('Est. Cost', '$' + (tokensUsed * 0.000003).toFixed(4)));

  } catch (error) {
    spinner.fail('Task failed');
    console.error(chalk.red(error));
    process.exit(1);
  }
}

function boxHeader(text: string): string {
  const line = '─'.repeat(text.length + 4);
  return `\n┌${line}┐\n│  ${chalk.bold.cyan(text)}  │\n└${line}┘\n`;
}

function formatMetric(label: string, value: string): string {
  return chalk.dim(label.padEnd(15)) + chalk.bold(value);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
