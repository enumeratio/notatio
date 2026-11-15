import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, test } from "vite-plus/test";
import { workerEnv } from "../src/compile-cache.ts";

const KEYS = ["NODE_COMPILE_CACHE", "NODE_DISABLE_COMPILE_CACHE"] as const;
const saved = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));
afterEach(() => {
  for (const key of KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

test("a worker gets a compile cache in the temp dir unless the caller chose otherwise", () => {
  for (const key of KEYS) delete process.env[key];
  expect(workerEnv().NODE_COMPILE_CACHE).toBe(join(tmpdir(), "notatio-compile-cache"));
  process.env.NODE_COMPILE_CACHE = "/chosen";
  expect(workerEnv().NODE_COMPILE_CACHE).toBe("/chosen");
  delete process.env.NODE_COMPILE_CACHE;
  process.env.NODE_DISABLE_COMPILE_CACHE = "1";
  expect(workerEnv().NODE_COMPILE_CACHE).toBeUndefined();
});
