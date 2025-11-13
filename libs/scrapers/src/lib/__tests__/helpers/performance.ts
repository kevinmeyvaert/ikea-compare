/**
 * Performance benchmarking utilities for testing
 */

interface BenchmarkResult {
  duration: number;
  withinThreshold: boolean;
  message: string;
}

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
 * Benchmark an async function and validate it completes within a threshold
 */
export async function benchmark<T>(
  fn: () => Promise<T>,
  thresholdMs: number,
  description = 'Operation'
): Promise<BenchmarkResult> {
  const { duration } = await measureExecutionTime(fn);
  const withinThreshold = duration <= thresholdMs;

  const message = withinThreshold
    ? `${description} completed in ${duration.toFixed(2)}ms (threshold: ${thresholdMs}ms) ✓`
    : `${description} took ${duration.toFixed(2)}ms, exceeding threshold of ${thresholdMs}ms ✗`;

  return {
    duration,
    withinThreshold,
    message,
  };
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
 * Run multiple benchmarks and report results
 */
export async function runBenchmarks(
  benchmarks: Array<{
    name: string;
    fn: () => Promise<unknown>;
    threshold: number;
  }>
): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];

  for (const { name, fn, threshold } of benchmarks) {
    const result = await benchmark(fn, threshold, name);
    results.push(result);
  }

  return results;
}

/**
 * Calculate average execution time over multiple runs
 */
export async function averageExecutionTime<T>(
  fn: () => Promise<T>,
  runs = 10
): Promise<number> {
  const durations: number[] = [];

  for (let i = 0; i < runs; i++) {
    const { duration } = await measureExecutionTime(fn);
    durations.push(duration);
  }

  const sum = durations.reduce((acc, d) => acc + d, 0);
  return sum / runs;
}

/**
 * Get performance statistics for multiple runs
 */
export async function getPerformanceStats<T>(
  fn: () => Promise<T>,
  runs = 10
): Promise<{
  min: number;
  max: number;
  avg: number;
  median: number;
  p95: number;
}> {
  const durations: number[] = [];

  for (let i = 0; i < runs; i++) {
    const { duration } = await measureExecutionTime(fn);
    durations.push(duration);
  }

  durations.sort((a, b) => a - b);

  const sum = durations.reduce((acc, d) => acc + d, 0);
  const avg = sum / runs;
  const min = durations[0];
  const max = durations[durations.length - 1];
  const median = durations[Math.floor(runs / 2)];
  const p95Index = Math.floor(runs * 0.95);
  const p95 = durations[p95Index];

  return { min, max, avg, median, p95 };
}
