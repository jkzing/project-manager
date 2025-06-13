import chalk from 'chalk';

type LogLevel = 'info' | 'success' | 'error' | 'warn' | 'debug';

interface LoggerOptions {
  indent?: number;
  group?: string;
}

const LOG_LEVELS: Record<LogLevel, { symbol: string; color: (text: string) => string }> = {
  info: { symbol: 'ℹ', color: chalk.blue },
  success: { symbol: '✔', color: chalk.green },
  error: { symbol: '✖', color: chalk.red },
  warn: { symbol: '⚠', color: chalk.yellow },
  debug: { symbol: '🔍', color: chalk.gray },
};

let currentIndent = 0;
let currentGroup: string | null = null;

function getTimestamp(): string {
  return chalk.gray(new Date().toLocaleTimeString());
}

function getIndent(): string {
  return '  '.repeat(currentIndent);
}

function formatMessage(level: LogLevel, message: string, options: LoggerOptions = {}): string {
  const { indent = 0, group } = options;
  const { symbol, color } = LOG_LEVELS[level];
  const timestamp = getTimestamp();
  const indentStr = getIndent() + '  '.repeat(indent);
  const groupPrefix = group ? chalk.cyan(`[${group}] `) : '';

  return `${timestamp} ${indentStr}${color(symbol)} ${groupPrefix}${message}`;
}

export const logger = {
  info: (message: string, options?: LoggerOptions) => {
    console.log(formatMessage('info', message, options));
  },

  success: (message: string, options?: LoggerOptions) => {
    console.log(formatMessage('success', message, options));
  },

  error: (message: string, options?: LoggerOptions) => {
    console.error(formatMessage('error', message, options));
  },

  warn: (message: string, options?: LoggerOptions) => {
    console.warn(formatMessage('warn', message, options));
  },

  debug: (message: string, options?: LoggerOptions) => {
    console.log(formatMessage('debug', message, options));
  },

  step: (step: number, total: number, message: string, options?: LoggerOptions) => {
    const progress = chalk.cyan(`[${step}/${total}]`);
    console.log(`${getTimestamp()} ${getIndent()}${progress} ${message}`);
  },

  group: async (name: string, callback: () => PromiseLike<void>) => {
    const previousGroup = currentGroup;
    currentGroup = name;
    console.log(`${getTimestamp()} ${getIndent()}${chalk.cyan('┌')} ${name}`);

    currentIndent++;
    await callback();
    currentIndent--;

    console.log(`${getTimestamp()} ${getIndent()}${chalk.cyan('└')} ${name}`);
    currentGroup = previousGroup;
  },

  progress: (message: string, callback: () => Promise<void>) => {
    const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;

    const interval = setInterval(() => {
      process.stdout.write(`\r${getTimestamp()} ${getIndent()}${chalk.cyan(spinner[i])} ${message}`);
      i = (i + 1) % spinner.length;
    }, 80);

    return callback().finally(() => {
      clearInterval(interval);
      process.stdout.write('\r'.padEnd(process.stdout.columns));
    });
  },
};
