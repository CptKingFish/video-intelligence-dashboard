/**
 * Retry transient Neon HTTP failures (cold starts, network blips).
 */

const RETRYABLE = /fetch failed|ECONNRESET|ETIMEDOUT|socket hang up|network/i;

export async function withDbRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const message =
        error instanceof Error
          ? `${error.message} ${error.cause instanceof Error ? error.cause.message : ""}`
          : String(error);
      if (!RETRYABLE.test(message) || i === attempts - 1) throw error;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw lastError;
}
