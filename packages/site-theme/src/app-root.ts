// Where the app being built keeps its files. The theme is a package of its own, so what an app
// owns (its `.vitepress/cache`) is found from the VitePress command line, not from this file:
// `vitepress build web` has `web` as its root, a bare `vitepress dev` its working directory.

import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const COMMANDS = ["dev", "build", "preview", "serve"];

/** The VitePress root the process runs on. */
export function appRoot(argv: readonly string[] = process.argv, cwd: string = process.cwd()): string {
  const at = argv.findIndex((arg) => COMMANDS.includes(arg));
  const root = at < 0 ? undefined : argv[at + 1];
  return root === undefined || root.startsWith("-") ? cwd : resolve(cwd, root);
}

/** The app's build cache, `<root>/.vitepress/cache`. */
export const appCache = (...parts: string[]): string => join(appRoot(), ".vitepress/cache", ...parts);

/**
 * The repository root: where `packages/` is (or, in a build from installed packages, `node_modules/@enumeratio`).
 * The theme in the tree sits at `packages/site-theme`; installed, it has no repository around it, and the
 * app's parent directory is the root, as `web/` has it.
 */
const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot: string = here.includes("/node_modules/") ? resolve(appRoot(), "..") : resolve(here, "../../..");
