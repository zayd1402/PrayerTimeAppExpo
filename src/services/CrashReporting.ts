// ─── CrashReporting — sends production crashes to Sentry ───
// Off unless EXPO_PUBLIC_SENTRY_DSN is set at build time, and never on in development.
// Sentry is required lazily so tests and DSN-less builds never load it.

type SentryModule = typeof import('@sentry/react-native');

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
let sentry: SentryModule | null = null;

export function initCrashReporting(): void {
  if (sentry || !DSN || __DEV__) return;
  try {
    const Sentry: SentryModule = require('@sentry/react-native');
    Sentry.init({
      dsn: DSN,
      // No names, IPs or locations: prayer logs and coordinates stay on the phone.
      sendDefaultPii: false,
      tracesSampleRate: 0,
    });
    sentry = Sentry;
  } catch {
    sentry = null;
  }
}

export function reportError(error: unknown, context?: Record<string, unknown>): void {
  if (!sentry) return;
  sentry.captureException(error, context ? { extra: context } : undefined);
}

export function addBreadcrumb(message: string): void {
  sentry?.addBreadcrumb({ message, level: 'warning' });
}
