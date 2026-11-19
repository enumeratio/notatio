// A route loader's output, stored under the build cache's directory (`$DIST_CACHE_DIR`, else the
// clone's shared git directory) in a file named for the key that tools/ci/site-loaders.ts derives
// from everything the loaders read. A build with the same key returns the stored output instead of
// computing it. `SITE_LOADER_CACHE=0` turns it off; only `vitepress build` uses it.

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gunzipSync, gzipSync } from "node:zlib";
import { timed } from "./timings.ts";

const repoRoot = resolve(fileURLToPath(import.meta.url), "../../../..");

/** Newest keys whose files are kept; older ones are dropped when a new one is stored. */
const KEEP_KEYS = 2;

interface SiteLoaders {
  siteLoaderKey: () => string;
  loaderStore: () => string;
}

/** Off for `dev` and `preview`, for a build that reads installed packages (their files are in no key), and with `SITE_LOADER_CACHE=0`. */
const enabled = (): boolean =>
  process.argv.includes("build") && process.env.SITE_FROM_PACKAGES !== "1" && process.env.SITE_LOADER_CACHE !== "0";

// Imported by file URL so it runs from tools/ci as it is, not bundled into the loader (once per build, whichever loader asks first).
const state = globalThis as { __siteLoaders?: Promise<{ key: string; store: string }> };
const location = (): Promise<{ key: string; store: string }> =>
  (state.__siteLoaders ??= (async () => {
    const mod = (await import(
      /* @vite-ignore */ pathToFileURL(join(repoRoot, "tools/ci/site-loaders.ts")).href
    )) as SiteLoaders;
    return { key: mod.siteLoaderKey(), store: mod.loaderStore() };
  })());

/** Drops the files of every key but the newest few. */
function prune(store: string): void {
  const files = readdirSync(store).filter((f) => f.endsWith(".json.gz"));
  const keys = new Map<string, number>();
  for (const f of files) {
    const key = f.slice(0, f.indexOf("-"));
    keys.set(key, Math.max(keys.get(key) ?? 0, statSync(join(store, f)).mtimeMs));
  }
  const keep = new Set(
    [...keys]
      .toSorted((a, b) => b[1] - a[1])
      .slice(0, KEEP_KEYS)
      .map(([key]) => key),
  );
  for (const f of files) if (!keep.has(f.slice(0, f.indexOf("-")))) rmSync(join(store, f), { force: true });
}

/**
 * `compute`'s output, from the store when this key has it, else computed and stored. The output
 * is what VitePress takes of a route's params: JSON. `onHit` runs on a stored output, for effects
 * `compute` has besides its value.
 */
export async function cachedLoader<T>(name: string, compute: () => Promise<T>, onHit?: (value: T) => void): Promise<T> {
  if (!enabled()) return compute();
  const { key, store } = await timed("loader-cache-key", location);
  const file = join(store, `${key}-${name}.json.gz`);
  if (existsSync(file)) {
    const value = await timed(
      `${name}-cache-read`,
      async () => JSON.parse(gunzipSync(readFileSync(file)).toString("utf8")) as T,
    );
    const now = new Date();
    utimesSync(file, now, now);
    onHit?.(value);
    console.log(`site loader cache: ${name} hit`);
    return value;
  }
  const value = await compute();
  mkdirSync(store, { recursive: true });
  const tmp = join(store, `.tmp-${process.pid}-${key}-${name}`);
  writeFileSync(tmp, gzipSync(JSON.stringify(value), { level: 1 }));
  renameSync(tmp, file);
  prune(store);
  console.log(`site loader cache: ${name} miss, stored`);
  return value;
}
