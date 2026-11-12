import { addBreadcrumb, initCrashReporting, reportError } from '../services/CrashReporting';

describe('crash reporting without a DSN', () => {
  it('stays off and never throws', () => {
    expect(() => {
      initCrashReporting();
      reportError(new Error('boom'));
      addBreadcrumb('note');
    }).not.toThrow();
  });
});
