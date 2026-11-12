// Dev logger. In production, warnings become crash-report breadcrumbs and errors are reported.
import { addBreadcrumb, reportError } from '../services/CrashReporting';

function describe(args: unknown[]): string {
  return args.map(a => (a instanceof Error ? a.message : typeof a === 'string' ? a : '')).filter(Boolean).join(' ');
}

function log(level: 'log' | 'warn' | 'error', ...args: unknown[]) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console[level](...args);
    return;
  }
  if (level === 'warn') addBreadcrumb(describe(args));
  if (level === 'error') reportError(args.find(a => a instanceof Error) ?? new Error(describe(args)));
}

export const logger = {
  log: (...args: unknown[]) => log('log', ...args),
  warn: (...args: unknown[]) => log('warn', ...args),
  error: (...args: unknown[]) => log('error', ...args),
};
