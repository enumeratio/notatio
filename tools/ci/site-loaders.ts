#!/usr/bin/env node
// The key of the site's cached route loaders' output (web/.vitepress/data/loader-cache.ts), and
// where the output is stored.
//
//   node tools/ci/site-loaders.ts key     print the key
//
// A loader's output depends only on what it reads: the packages (the build keys of every unit the
// site depends on, from dist-cache.ts), every record, and web's own loader code. Anything a loader
// reads that is in none of these makes the cache wrong; web/.vitepress/loader-cache.test.ts checks
// that every file a loader imports is in the key.

import { createHash } from "node:crypto";
import { join } from "node:path";
import { cacheDir, inputsOf } from "./dist-cache.ts";
import { RECORD_PATH } from "./reads.ts";

/** Bump when what the key covers or what is stored changes. */
const KEY_VERSION = 1;

/** Web's files the cached loaders run or import: the route loaders, their data modules and the worker catalogue. */
export const LOADER_CODE =
  /^web\/(?:package\.json$|\.vitepress\/theme\/worker-catalogue\.ts$|(?:reference|docs)\/.*\.paths\.ts$|\.vitepress\/data\/(?!.*\.(?:test\.ts|golden\.json)$))/;

/** What a build's output depends on besides files: the run's mode and where the packages are read from. */
export interface SiteEnv {
  fromPackages: boolean;
  preview: boolean;
}

export interface SiteInputs {
  /** Build key of every unit the site reads. */
  keys: ReadonlyMap<string, string>;
  /** Repo-relative path to content hash, for every file a build could read. */
  files: ReadonlyMap<string, string>;
  env: SiteEnv;
}

const sorted = <T>(rows: Iterable<[string, T]>): [string, T][] => [...rows].toSorted(([a], [b]) => (a < b ? -1 : 1));

export function loaderKey({ keys, files, env }: SiteInputs): string {
  const h = createHash("sha256");
  h.update(`${KEY_VERSION} ${JSON.stringify(env)}\n`);
  for (const [id, key] of sorted(keys)) h.update(`unit ${id} ${key}\n`);
  for (const [path, hash] of sorted(files))
    if (RECORD_PATH.test(path)) h.update(`record ${path} ${hash}\n`);
    else if (LOADER_CODE.test(path)) h.update(`code ${path} ${hash}\n`);
  return h.digest("hex").slice(0, 32);
}

export const siteEnv = (argv: readonly string[] = process.argv): SiteEnv => ({
  fromPackages: process.env.SITE_FROM_PACKAGES === "1",
  preview: argv.includes("preview"),
});

export function siteLoaderKey(env: SiteEnv = siteEnv()): string {
  return loaderKey({ ...inputsOf("@notatio/web"), env });
}

/** Where a loader's output for `key` is stored, beside the build cache's own entries. */
export const loaderStore = (): string => join(cacheDir(), "site-loaders");

if (import.meta.main) {
  if (process.argv[2] === "key") console.log(siteLoaderKey());
  else {
    console.error("usage: site-loaders.ts key");
    process.exit(2);
  }
}
