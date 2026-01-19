/**
 * TUI - Terminal UI for task execution
 */

import chalk from 'chalk';

interface TUIOptions {
  task: string;
  agent: string;
  isolation: string;
  config: { defaultModel: { model: string } };
  apiKey: string;
}

interface ContextState {
  used: number;
  capacity: number;
  efficiency: number;
  agents: Array<{ name: string; tokens: number; status: string }>;
  events: Array<{ time: string; type: string; tokens: number }>;
}

export async function renderTUI(options: TUIOptions): Promise<void> {
  const { task, agent } = options;
  const capacity = 200000;

  const state: ContextState = {
    used: 0,
    capacity,
    efficiency: 0,
    agents: [],
    events: [],
  };

  // Initial render
  clearScreen();
  render(state, task, 'Initializing...');

  // Simulate execution phases
  await simulatePhase(state, 'Loading system context...', 2500, task);
  await simulatePhase(state, `Spawning agent: ${agent}...`, 0, task, {
    name: agent,
    tokens: 0,
    status: 'starting',
  });
  await simulatePhase(state, 'Loading skills...', 3500, task);
  await simulatePhase(state, 'Processing task...', 18000, task);
  state.agents[0] = { ...state.agents[0], tokens: 18000, status: 'running' };
  await simulatePhase(state, 'Generating response...', 8500, task);
  state.agents[0] = { ...state.agents[0], status: 'completed' };

  // Final render
  state.efficiency = (26000 / state.used) * 100;
  clearScreen();
  render(state, task, chalk.green('✓ Task completed'));

  // Summary
  console.log('\n' + chalk.bold('Summary:'));
  console.log(chalk.dim('─'.repeat(50)));
  console.log(formatMetric('Total Tokens', state.used.toLocaleString()));
  console.log(formatMetric('Efficiency', state.efficiency.toFixed(1) + '%'));
  console.log(formatMetric('Est. Cost', '$' + (state.used * 0.000003).toFixed(4)));
  console.log();
}

async function simulatePhase(
  state: ContextState,
  status: string,
  tokensToAdd: number,
  task: string,
  newAgent?: { name: string; tokens: number; status: string }
): Promise<void> {
  if (newAgent) {
    state.agents.push(newAgent);
  }

  const steps = 10;
  const tokensPerStep = tokensToAdd / steps;

  for (let i = 0; i < steps; i++) {
    state.used += tokensPerStep;
    state.efficiency = Math.min(85, 20 + (state.used / state.capacity) * 100);

    if (i === 0) {
      state.events.unshift({
        time: new Date().toLocaleTimeString(),
        type: status.split('...')[0],
        tokens: tokensToAdd,
      });
    }

    clearScreen();
    render(state, task, status);
    await sleep(80);
  }
}

function render(state: ContextState, task: string, status: string): void {
  const { used, capacity, efficiency, agents, events } = state;
  const percentage = (used / capacity) * 100;

  // Header
  console.log(chalk.bold.cyan('\n⚡ ContextFlow') + chalk.dim(' v0.1.0\n'));

  // Context Tank
  console.log(chalk.bold('Context Usage'));
  console.log(renderProgressBar(percentage, 50));
  console.log(
    chalk.dim(`${used.toLocaleString()} / ${capacity.toLocaleString()} tokens`) +
    chalk.dim(' │ ') +
    chalk.bold(`${percentage.toFixed(1)}%`)
  );

  // Metrics row
  console.log('\n' + chalk.dim('─'.repeat(55)));
  console.log(
    formatBox('Efficiency', efficiency.toFixed(1) + '%', efficiency > 50 ? 'green' : 'yellow') +
    formatBox('Est. Cost', '$' + (used * 0.000003).toFixed(4), 'blue') +
    formatBox('Agents', agents.length.toString(), 'magenta')
  );
  console.log(chalk.dim('─'.repeat(55)));

  // Active Agents
  if (agents.length > 0) {
    console.log('\n' + chalk.bold('Agents'));
    for (const agent of agents) {
      const statusIcon = agent.status === 'completed' ? chalk.green('●') :
        agent.status === 'running' ? chalk.yellow('◉') : chalk.dim('○');
      console.log(
        `  ${statusIcon} ${agent.name.padEnd(15)} ` +
        chalk.dim(`${agent.tokens.toLocaleString()} tokens`)
      );
    }
  }

  // Recent Events
  if (events.length > 0) {
    console.log('\n' + chalk.bold('Timeline'));
    const recentEvents = events.slice(0, 5);
    for (const event of recentEvents) {
      console.log(
        chalk.dim(`  ${event.time} `) +
        event.type.padEnd(25) +
        chalk.cyan(`+${event.tokens.toLocaleString()}`)
      );
    }
  }

  // Status
  console.log('\n' + chalk.dim('─'.repeat(55)));
  console.log(chalk.dim('Task: ') + task.substring(0, 50));
  console.log(chalk.dim('Status: ') + status);
}

function renderProgressBar(percentage: number, width: number): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;

  const color = percentage > 80 ? chalk.red : percentage > 60 ? chalk.yellow : chalk.green;
  const bar = color('█'.repeat(filled)) + chalk.dim('░'.repeat(empty));

  return `[${bar}]`;
}

function formatBox(label: string, value: string, color: string): string {
  const colorFn = (chalk as unknown as Record<string, (s: string) => string>)[color] || chalk.white;
  return `${chalk.dim(label + ': ')}${colorFn(value)}  `;
}

function formatMetric(label: string, value: string): string {
  return `  ${chalk.dim(label.padEnd(20))}${chalk.bold(value)}`;
}

function clearScreen(): void {
  process.stdout.write('\x1B[2J\x1B[0f');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
