export type ErrorReporter = {
  captureException: (error: unknown, context?: Record<string, unknown>) => void;
};

export const consoleReporter: ErrorReporter = {
  captureException(error, context) {
    console.error("[monitoring] exception", { error, context });
  }
};
