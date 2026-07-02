export async function withDbRetry<T>(
  operation: () => Promise<T>,
  retries = 4,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < retries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, 2000 * (attempt + 1)),
        );
      }
    }
  }

  throw lastError;
}
