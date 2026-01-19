/**
 * Dashboard TUI - Standalone monitoring dashboard
 */

import chalk from 'chalk';
import { stdin, stdout } from 'process';

interface DashboardState {
  contextUsed: number;
  contextCapacity: number;
  efficiency: number;
  activeAgents: Array<{ id: string; name: string; tokens: number; status: string }>;
  recentEvents: Array<{ time: number; type: string; delta: number }>;
  sessionCost: number;
  sessionStart: number;
}

export async function renderDashboardTUI(): Promise<void> {
  const state: DashboardState = {
    contextUsed: 0,
    contextCapacity: 200000,
    efficiency: 0,
    activeAgents: [],
    recentEvents: [],
    sessionCost: 0,
    sessionStart: Date.now(),
  };

  // Set up raw mode for key input
  if (stdin.isTTY) {
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
  }

  console.log(chalk.dim('Press q to quit, r to refresh\n'));

  // Key handler
  stdin.on('data', (key: string) => {
    if (key === 'q' || key === '\u0003') {
      clearScreen();
      console.log(chalk.cyan('Dashboard closed.\n'));
      process.exit(0);
    }
    if (key === 'r') {
      renderDashboard(state);
    }
  });

  // Initial render
  renderDashboard(state);

  // Simulate activity
  const interval = setInterval(() => {
    simulateActivity(state);
    renderDashboard(state);
  }, 2000);

  // Keep alive
  await new Promise(() => {});
}

function simulateActivity(state: DashboardState): void {
  // Random token changes
  const delta = Math.floor(Math.random() * 5000) - 1000;
  state.contextUsed = Math.max(0, Math.min(state.contextCapacity, state.contextUsed + delta));
  state.efficiency = 45 + Math.random() * 35;
  state.sessionCost = state.contextUsed * 0.000003;

  // Random agent activity
  if (Math.random() > 0.7 && state.activeAgents.length < 3) {
    const names = ['explorer', 'implementer', 'reviewer', 'tester'];
    state.activeAgents.push({
      id: `agent-${Date.now()}`,
      name: names[Math.floor(Math.random() * names.length)],
      tokens: Math.floor(Math.random() * 20000),
      status: Math.random() > 0.5 ? 'running' : 'idle',
    });
  }

  if (Math.random() > 0.8 && state.activeAgents.length > 0) {
    state.activeAgents.pop();
  }

  // Add event
  if (delta !== 0) {
    state.recentEvents.unshift({
      time: Date.now(),
      type: delta > 0 ? 'allocation' : 'release',
      delta,
    });
    state.recentEvents = state.recentEvents.slice(0, 8);
  }
}

function renderDashboard(state: DashboardState): void {
  clearScreen();

  const { contextUsed, contextCapacity, efficiency, activeAgents, recentEvents, sessionCost } = state;
  const percentage = (contextUsed / contextCapacity) * 100;
  const elapsed = Math.floor((Date.now() - state.sessionStart) / 1000);

  // Header
  console.log(boxTop('ContextFlow Dashboard'));

  // Main metrics
  console.log(chalk.bold('\n  Context Usage'));
  console.log('  ' + renderTank(percentage, 48));
  console.log(
    chalk.dim(`  ${contextUsed.toLocaleString().padStart(7)} / ${contextCapacity.toLocaleString()} tokens`) +
    `  ${getPercentageColor(percentage)(percentage.toFixed(1) + '%')}`
  );

  // Stats row
  console.log('\n  ' + chalk.dim('─'.repeat(52)));
  console.log(
    `  ${chalk.dim('Efficiency:')} ${getEfficiencyColor(efficiency)(efficiency.toFixed(1) + '%')}` +
    `  ${chalk.dim('│')}  ` +
    `${chalk.dim('Cost:')} ${chalk.cyan('$' + sessionCost.toFixed(4))}` +
    `  ${chalk.dim('│')}  ` +
    `${chalk.dim('Time:')} ${chalk.white(formatTime(elapsed))}`
  );
  console.log('  ' + chalk.dim('─'.repeat(52)));

  // Agents section
  console.log(chalk.bold('\n  Active Agents') + chalk.dim(` (${activeAgents.length})`));
  if (activeAgents.length === 0) {
    console.log(chalk.dim('  No active agents'));
  } else {
    for (const agent of activeAgents) {
      const statusIcon = agent.status === 'running' ? chalk.green('●') : chalk.dim('○');
      const bar = renderMiniBar(agent.tokens / 50000, 15);
      console.log(`  ${statusIcon} ${agent.name.padEnd(12)} ${bar} ${chalk.dim(agent.tokens.toLocaleString())}`);
    }
  }

  // Timeline
  console.log(chalk.bold('\n  Timeline'));
  if (recentEvents.length === 0) {
    console.log(chalk.dim('  No events yet'));
  } else {
    for (const event of recentEvents.slice(0, 5)) {
      const timeAgo = Math.floor((Date.now() - event.time) / 1000);
      const icon = event.delta > 0 ? chalk.blue('+') : chalk.green('-');
      console.log(
        chalk.dim(`  ${timeAgo}s ago `.padEnd(10)) +
        icon + Math.abs(event.delta).toLocaleString().padStart(6) +
        chalk.dim(` tokens (${event.type})`)
      );
    }
  }

  // Footer
  console.log('\n  ' + chalk.dim('─'.repeat(52)));
  console.log(chalk.dim('  Press q to quit, r to refresh'));
}

function renderTank(percentage: number, width: number): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  const color = getPercentageColor(percentage);

  return `[${color('█'.repeat(filled))}${chalk.dim('░'.repeat(empty))}]`;
}

function renderMiniBar(ratio: number, width: number): string {
  const filled = Math.max(0, Math.min(width, Math.round(ratio * width)));
  return chalk.cyan('▓'.repeat(filled)) + chalk.dim('░'.repeat(width - filled));
}

function getPercentageColor(pct: number): (s: string) => string {
  if (pct > 85) return chalk.red;
  if (pct > 65) return chalk.yellow;
  return chalk.green;
}

function getEfficiencyColor(eff: number): (s: string) => string {
  if (eff > 65) return chalk.green;
  if (eff > 40) return chalk.yellow;
  return chalk.red;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function boxTop(title: string): string {
  const padding = 2;
  const line = '─'.repeat(title.length + padding * 2);
  return `\n  ┌${line}┐\n  │${' '.repeat(padding)}${chalk.bold.cyan(title)}${' '.repeat(padding)}│\n  └${line}┘`;
}

function clearScreen(): void {
  stdout.write('\x1B[2J\x1B[0f');
}
