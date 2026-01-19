/**
 * Config Command - Manage ContextFlow configuration
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

interface ConfigOptions {
  list?: boolean;
}

export async function configCommand(
  key?: string,
  value?: string,
  options: ConfigOptions = {}
): Promise<void> {
  const cwd = process.cwd();
  const configPath = join(cwd, '.contextflow/config.json');

  if (!existsSync(configPath)) {
    console.log(chalk.red('Error:') + ' ContextFlow not initialized.');
    console.log('Run: ' + chalk.cyan('contextflow init'));
    process.exit(1);
  }

  const config = JSON.parse(readFileSync(configPath, 'utf-8'));

  // List all config
  if (options.list || (!key && !value)) {
    console.log(chalk.bold.cyan('\n⚡ ContextFlow Config\n'));
    printConfig(config);
    return;
  }

  // Get specific key
  if (key && !value) {
    const val = getNestedValue(config, key);
    if (val !== undefined) {
      console.log(chalk.dim(key + ' = ') + chalk.bold(JSON.stringify(val)));
    } else {
      console.log(chalk.yellow(`Key "${key}" not found`));
    }
    return;
  }

  // Set key-value
  if (key && value) {
    try {
      const parsedValue = JSON.parse(value);
      setNestedValue(config, key, parsedValue);
    } catch {
      setNestedValue(config, key, value);
    }

    writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(chalk.green('✓') + ` Set ${key} = ${value}`);
  }
}

function printConfig(obj: Record<string, unknown>, prefix = ''): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      printConfig(value as Record<string, unknown>, fullKey);
    } else {
      console.log(chalk.dim(fullKey.padEnd(30)) + chalk.bold(JSON.stringify(value)));
    }
  }
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object') {
      const record = acc as Record<string, unknown>;
      if (!record[key]) record[key] = {};
      return record[key];
    }
    return {};
  }, obj);
  if (target && typeof target === 'object') {
    (target as Record<string, unknown>)[lastKey] = value;
  }
}
