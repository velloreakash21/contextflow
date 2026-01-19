#!/usr/bin/env node
/**
 * ContextFlow CLI
 *
 * Enterprise-grade context management for LLM applications.
 */

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { runCommand } from './commands/run.js';
import { dashboardCommand } from './commands/dashboard.js';
import { statusCommand } from './commands/status.js';
import { configCommand } from './commands/config.js';

const program = new Command();

program
  .name('contextflow')
  .description('Your AI wastes 70% of its brain. We fix that.')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize ContextFlow in current project')
  .option('-y, --yes', 'Skip prompts, use defaults')
  .option('--model <model>', 'Default model (claude/openai/gemini)', 'claude')
  .action(initCommand);

program
  .command('run')
  .description('Execute a task with context tracking')
  .argument('<task>', 'Task description or ticket ID')
  .option('-a, --agent <agent>', 'Agent to use', 'default')
  .option('-i, --isolation <mode>', 'Isolation mode (strict/shared)', 'strict')
  .option('--no-dashboard', 'Disable live dashboard')
  .action(runCommand);

program
  .command('dashboard')
  .description('Launch real-time context visualization')
  .option('-p, --port <port>', 'Dashboard port', '3333')
  .option('--tui', 'Terminal UI mode (no browser)')
  .action(dashboardCommand);

program
  .command('status')
  .description('Show current context status')
  .action(statusCommand);

program
  .command('config')
  .description('Manage ContextFlow configuration')
  .argument('[key]', 'Config key to get/set')
  .argument('[value]', 'Value to set')
  .option('--list', 'List all config')
  .action(configCommand);

program.parse();
