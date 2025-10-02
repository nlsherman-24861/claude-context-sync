import chalk from 'chalk';
import ora from 'ora';

let verboseMode = false;

export function setVerbose(value) {
  verboseMode = value;
}

export function debug(message) {
  if (verboseMode) {
    console.log(chalk.gray('🔍'), chalk.gray(message));
  }
}

export function info(message) {
  console.log(chalk.blue('→'), message);
}

export function success(message) {
  console.log(chalk.green('✓'), message);
}

export function warn(message) {
  console.log(chalk.yellow('⚠'), chalk.yellow(message));
}

export function error(message) {
  console.error(chalk.red('✗'), chalk.red(message));
}

export function spinner(text) {
  return ora(text).start();
}

export function formatError(err) {
  if (err instanceof Error) {
    return {
      title: err.name || 'Error',
      message: err.message,
      stack: verboseMode ? err.stack : null
    };
  }
  return {
    title: 'Unknown Error',
    message: String(err),
    stack: null
  };
}

export function printError(err) {
  const formatted = formatError(err);
  error(`${formatted.title}: ${formatted.message}`);
  
  if (formatted.stack && verboseMode) {
    console.error(chalk.gray(formatted.stack));
  }
  
  if (!verboseMode) {
    console.error(chalk.gray('Run with --verbose for more details'));
  }
}