// Simple dev-only logger. In production these are no-ops.

function log(level: 'log' | 'warn' | 'error', ...args: unknown[]) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console[level](...args);
  }
}

export const logger = {
  log: (...args: unknown[]) => log('log', ...args),
  warn: (...args: unknown[]) => log('warn', ...args),
  error: (...args: unknown[]) => log('error', ...args),
};
