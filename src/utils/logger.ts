import chalk from 'chalk';

type LogLevel = 'info' | 'success' | 'error' | 'warn' | 'debug';

const LOG_LEVELS: Record<
  LogLevel,
  { symbol: string; color: (text: string) => string }
> = {
  info: { symbol: 'ℹ', color: chalk.blue },
  success: { symbol: '✔', color: chalk.green },
  error: { symbol: '✖', color: chalk.red },
  warn: { symbol: '⚠', color: chalk.yellow },
  debug: { symbol: '🔍', color: chalk.gray },
};

function getTimestamp(): string {
  return chalk.gray(new Date().toLocaleTimeString());
}

function formatMessage(level: LogLevel, message: string): string {
  const { symbol, color } = LOG_LEVELS[level];
  const timestamp = getTimestamp();
  return `${timestamp} ${color(symbol)} ${message}`;
}

export const logger = {
  info: (message: string) => {
    console.log(formatMessage('info', message));
  },

  success: (message: string) => {
    console.log(formatMessage('success', message));
  },

  error: (message: string) => {
    console.error(formatMessage('error', message));
  },

  warn: (message: string) => {
    console.warn(formatMessage('warn', message));
  },

  debug: (message: string) => {
    console.log(formatMessage('debug', message));
  },

  step: (step: number, total: number, message: string) => {
    const progress = chalk.cyan(`[${step}/${total}]`);
    console.log(`${getTimestamp()} ${progress} ${message}`);
  },
};
