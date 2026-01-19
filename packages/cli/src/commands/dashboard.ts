/**
 * Dashboard Command - Real-time context visualization
 */

import chalk from 'chalk';
import { renderDashboardTUI } from '../ui/dashboard-tui.js';

interface DashboardOptions {
  port?: string;
  tui?: boolean;
}

export async function dashboardCommand(options: DashboardOptions): Promise<void> {
  const port = parseInt(options.port || '3333', 10);
  const useTUI = options.tui ?? true; // Default to TUI for now

  if (useTUI) {
    console.log(chalk.cyan('\n⚡ ContextFlow Dashboard (TUI)\n'));
    await renderDashboardTUI();
  } else {
    // Web dashboard (future)
    console.log(chalk.cyan(`\n⚡ Starting ContextFlow Dashboard on port ${port}...\n`));
    console.log(chalk.dim('Web dashboard coming soon. Using TUI mode.\n'));
    await renderDashboardTUI();
  }
}
