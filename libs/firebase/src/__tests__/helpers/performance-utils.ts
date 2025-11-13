/**
 * Performance benchmarking utilities for Firebase tests
 */

/**
 * Measure the execution time of an async function
 */
export async function measureExecutionTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  const duration = endTime - startTime;

  return { result, duration };
}

/**
 * Custom Jest matcher to assert performance thresholds
 */
export async function expectPerformance<T>(
  fn: () => Promise<T>,
  maxDurationMs: number
): Promise<T> {
  const { result, duration } = await measureExecutionTime(fn);

  if (duration > maxDurationMs) {
    throw new Error(
      `Performance threshold exceeded: ${duration.toFixed(2)}ms > ${maxDurationMs}ms`
    );
  }

  return result;
}

/**
 * Benchmark batch operations
 */
export async function benchmarkBatchOperation<T>(
  fn: () => Promise<T>,
  thresholdMs: number,
  description: string = 'Batch operation'
): Promise<{ result: T; duration: number; passed: boolean }> {
  const { result, duration } = await measureExecutionTime(fn);
  const passed = duration <= thresholdMs;

  if (!passed) {
    console.warn(
      `${description} took ${duration.toFixed(2)}ms, exceeding threshold of ${thresholdMs}ms`
    );
  }

  return { result, duration, passed };
}

/**
 * Run multiple operations and report average time
 */
export async function averageExecutionTime<T>(
  fn: () => Promise<T>,
  runs: number = 10
): Promise<number> {
  const durations: number[] = [];

  for (let i = 0; i < runs; i++) {
    const { duration } = await measureExecutionTime(fn);
    durations.push(duration);
  }

  const sum = durations.reduce((acc, d) => acc + d, 0);
  return sum / runs;
}
