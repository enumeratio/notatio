// Node's compile cache for the pool's workers: a worker imports compute-engine and every
// library, and compiling that source is much of its cold start. The directory (in the OS temp
// dir) outlives a worker, so a later spawn in this run, or the next run, reads the compiled
// code. Entries are keyed by file content, so an edited module never reads a stale one. A
// directory Node can't use, or a Node without the API, only loses the speed-up.

import { flushCompileCache } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** The environment a worker starts with: the cache on from its first import (it is read at
 *  worker start, so no module can compile before it), unless the caller chose a directory or
 *  turned the cache off. */
export function workerEnv(): NodeJS.ProcessEnv {
  const { NODE_COMPILE_CACHE, NODE_DISABLE_COMPILE_CACHE } = process.env;
  if (NODE_COMPILE_CACHE !== undefined || NODE_DISABLE_COMPILE_CACHE !== undefined) return process.env;
  return { ...process.env, NODE_COMPILE_CACHE: join(tmpdir(), "notatio-compile-cache") };
}

/** Writes what this worker compiled: it is ended by `terminate()`, which never flushes. */
export function saveCompileCache(): void {
  try {
    flushCompileCache();
  } catch {
    // Compiles as before.
  }
}
