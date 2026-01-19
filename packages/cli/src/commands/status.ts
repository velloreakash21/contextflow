/**
 * Status Command - Show current context status
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

export async function statusCommand(): Promise<void> {
  const cwd = process.cwd();
  const configPath = join(cwd, '.contextflow/config.json');

  if (!existsSync(configPath)) {
    console.log(chalk.yellow('ContextFlow not initialized in this directory.'));
    console.log('Run: ' + chalk.cyan('contextflow init'));
    return;
  }

  const config = JSON.parse(readFileSync(configPath, 'utf-8'));

  console.log(chalk.bold.cyan('\n⚡ ContextFlow Status\n'));
  console.log(chalk.dim('─'.repeat(50)));

  // Config info
  console.log(chalk.bold('\nConfiguration:'));
  console.log(formatRow('Provider', config.defaultModel?.provider || 'claude'));
  console.log(formatRow('Model', config.defaultModel?.model || 'unknown'));
  console.log(formatRow('Isolation', config.agentIsolation || 'strict'));
  console.log(formatRow('Benchmarking', config.enableBenchmarking ? 'enabled' : 'disabled'));

  // Agents
  const agentsDir = join(cwd, '.contextflow/agents');
  if (existsSync(agentsDir)) {
    const agents = readdirSync(agentsDir).filter(f => f.endsWith('.md'));
    console.log(chalk.bold('\nAgents:') + chalk.dim(` (${agents.length})`));
    agents.forEach(a => console.log(chalk.dim('  • ') + a.replace('.md', '')));
  }

  // Skills
  const skillsDir = join(cwd, '.contextflow/skills');
  if (existsSync(skillsDir)) {
    const skills = readdirSync(skillsDir).filter(f => !f.startsWith('.'));
    console.log(chalk.bold('\nSkills:') + chalk.dim(` (${skills.length})`));
    skills.forEach(s => console.log(chalk.dim('  • ') + s));
  }

  // Checkpoints
  const checkpointsDir = join(cwd, '.contextflow/checkpoints');
  if (existsSync(checkpointsDir)) {
    const checkpoints = readdirSync(checkpointsDir).filter(f => f.endsWith('.json'));
    console.log(chalk.bold('\nCheckpoints:') + chalk.dim(` (${checkpoints.length})`));
  }

  // API Key status
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

  console.log(chalk.bold('\nAPI Keys:'));
  console.log(formatRow('ANTHROPIC_API_KEY', hasAnthropicKey ? chalk.green('✓ set') : chalk.dim('not set')));
  console.log(formatRow('OPENAI_API_KEY', hasOpenAIKey ? chalk.green('✓ set') : chalk.dim('not set')));

  console.log(chalk.dim('\n─'.repeat(50)));
  console.log(chalk.dim('Run ') + chalk.cyan('contextflow run "task"') + chalk.dim(' to start\n'));
}

function formatRow(label: string, value: string): string {
  return `  ${chalk.dim(label.padEnd(20))} ${value}`;
}
