import { docRoutes } from "../.vitepress/data/repo-docs.ts";
import { timed } from "../.vitepress/data/timings.ts";

// Each workspace package's README at /docs/<slug>/ and its docs/**/*.md below it.
export default {
  paths: () => timed("docs-paths", () => docRoutes()),
};
