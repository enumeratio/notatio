// `SITE_TIMINGS=1`: the build prints where its time goes, one `site-phase <name> <milliseconds>`
// line per phase, for a script to read. Off, nothing is printed.

export const TIMINGS = process.env.SITE_TIMINGS === "1";

/** Runs `run` and, with timings on, prints how long it took (a promise's, until it settles). */
export function timed<T>(name: string, run: () => T): T {
  if (!TIMINGS) return run();
  const start = performance.now();
  const done = (): void => console.log(`site-phase ${name} ${Math.round(performance.now() - start)}`);
  const result = run();
  if (result instanceof Promise) return result.finally(done) as T;
  done();
  return result;
}

/** Prints the milliseconds since the process started, for a phase that ends here rather than being run by `timed`. */
export function reached(name: string): void {
  if (TIMINGS) console.log(`site-phase ${name} ${Math.round(performance.now())}`);
}
