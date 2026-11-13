import { cpSync, existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { constants } from "node:os";
import { resolve } from "node:path";
import { HOLE_TAGS, isBoxTag } from "@enumeratio/frontend/box-tags";
import { BOX_LAYOUT_CSS } from "@enumeratio/frontend/core";
import type { DefaultTheme, UserConfig } from "vitepress";
import { appRoot, repoRoot } from "./app-root.ts";
import { codeThemes } from "./code-theme.ts";
import { fillPrerendered } from "./data/prerender.ts";
import { fillMarkup } from "./data/prerender-markup.ts";
import { writeServiceWorker } from "./host/service-worker.ts";
import { loaderWatchPlugin } from "./loader-watch.ts";
import { notatioMarkup, useLibraryParams } from "./notatio-markup.ts";
import { notatioMath } from "./notatio-math.ts";
import { notatioSourceLinks } from "./notatio-source-links.ts";
import { notatioSymbols } from "./notatio-symbols.ts";
import { notationEntriesPlugin } from "./notation-entries.ts";
import { chunksIn, pageTags, preloads, prerenderMarkup } from "./prerender-markup.ts";
import { referenceDataPlugin } from "./reference-data.ts";
import { reviewModePlugin } from "./review/plugin.ts";
import { libraryParams } from "./theme/libraries.ts";
import { CATALOGUE } from "./theme/worker-catalogue.ts";
import { vendorExternals, vendorHref, writeVendor } from "./vendor.ts";

// Resolve every @enumeratio/* import (bare and subpaths) to its source, so the docs
// site reads sibling packages directly and never depends on a prior `vp pack` of
// them — dev and build both stay in sync with source, with no stale-dist surprises.
// Each package's exports are read, and any target under dist/ is remapped to the
// matching src/*.ts; exports that already point at src are used as-is.
// SITE_FROM_PACKAGES=1 turns them off: the site resolves `@enumeratio/*` through whatever is installed,
// as it would from the registry (tools/tarball-check builds it that way, from packed tarballs).
// A library installed beside the tree's packages has no alias: the app resolves it through node_modules.
const fromPackages = process.env.SITE_FROM_PACKAGES === "1";
const pkgsDir = resolve(repoRoot, "packages");
const srcAliases: { find: RegExp; replacement: string }[] = [];
// Symbol packages sit a level deeper, under packages/symbols/<group>/.
const packageDirs = (fromPackages ? [] : readdirSync(pkgsDir)).flatMap((name) =>
  name === "symbols"
    ? readdirSync(resolve(pkgsDir, name)).flatMap((group) =>
        readdirSync(resolve(pkgsDir, name, group)).map((pkg) => `${name}/${group}/${pkg}`),
      )
    : [name],
);
for (const dir of packageDirs) {
  const manifest = resolve(pkgsDir, dir, "package.json");
  if (!existsSync(manifest)) continue;
  const pkg = JSON.parse(readFileSync(manifest, "utf8")) as {
    name?: string;
    exports?: Record<string, unknown>;
  };
  if (!pkg.name?.startsWith("@enumeratio/") || !pkg.exports) continue;
  for (const [sub, entry] of Object.entries(pkg.exports)) {
    const target = typeof entry === "string" ? entry : (entry as { import?: string })?.import;
    if (typeof target !== "string") continue;
    const srcRel = target.includes("/dist/")
      ? target.replace("/dist/", "/src/").replace(/\.(m|c)?js$/, ".ts")
      : target.startsWith("./src/")
        ? target
        : undefined;
    if (!srcRel) continue;
    const abs = resolve(pkgsDir, dir, srcRel);
    if (!existsSync(abs)) continue;
    const spec = sub === "." ? pkg.name : pkg.name + sub.slice(1);
    srcAliases.push({
      find: new RegExp(`^${spec.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
      replacement: abs,
    });
  }
}

// `@enumeratio/combinatorics` keeps its `collections` area (https://github.com/enumeratio/notatio/wiki/Speculative-Combinatorics-Layering-and-Plausible)
// under its own nested `<area>/src/index.ts` rather than a package-root `src/`, so the
// generic dist->src rewrite above (which only swaps the `/dist/` segment) can't find it.
// So are the other entries whose source isn't `src/<entry>.ts`; alias them by hand.
const sourceEntries: [specifier: string, source: string][] = fromPackages
  ? []
  : [
      ["@enumeratio/combinatorics/collections", "symbols/combinatorics/combinatorics/collections/src/index.ts"],
      ["@enumeratio/combinatorics/findstat", "symbols/combinatorics/combinatorics/findstat/src/findstat-data.ts"],
      ["@enumeratio/catalog/records", "catalog/src/catalog-records-data.ts"],
      ["@enumeratio/ce-patches/glsl-complex", "ce-patches/src/compute-engine/compilation/glsl-complex.ts"],
    ];
for (const [specifier, source] of sourceEntries) {
  const abs = resolve(pkgsDir, source);
  if (!existsSync(abs)) continue;
  srcAliases.push({ find: new RegExp(`^${specifier}$`), replacement: abs });
}

const dev = process.argv.includes("dev");

// A build bundles the server side into `.vitepress/.temp` (about 180 MB) and removes it when it
// ends; a build killed by a signal never gets there. A new build starts from a clean directory,
// and a signal removes it before the process exits.
function clearTempOnBuild(): void {
  if (!process.argv.includes("build")) return;
  const temp = resolve(appRoot(), ".vitepress/.temp");
  rmSync(temp, { recursive: true, force: true });
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
    process.once(signal, () => {
      rmSync(temp, { recursive: true, force: true });
      process.exit(128 + constants.signals[signal]);
    });
  }
}

// The published libraries' parameter names, for markup that gives a library symbol's slots by
// name. Offline, markup still reads; only named slots on library heads stay pairs.
async function setLibraryParams(): Promise<void> {
  useLibraryParams(
    await libraryParams().catch((error: unknown) => {
      console.warn(`libraries: no parameter names (${String(error)})`);
      return {};
    }),
  );
}

// Rollup's tree-shaking is most of the bundling time (its path tracking over every call's
// argument), and across our own modules it removes almost nothing: they are used nearly whole. So
// they are included whole, unanalysed ("no-treeshake"). Vendor code keeps shaking: skipping it
// ships unused compute-engine compile code. Generated data keeps shaking too, so unused rows
// don't ship.
const INCLUDED_WHOLE = /\/(?:packages|web)\//;
const SHAKEN = /-data\.ts$|\/generated\/|system-names/;
const includeWhole = () => ({
  name: "enumeratio-include-whole",
  enforce: "post" as const,
  transform: (_code: string, id: string) =>
    INCLUDED_WHOLE.test(id) && !SHAKEN.test(id)
      ? { code: null, map: null, moduleSideEffects: "no-treeshake" }
      : undefined,
});

/** What an app says about itself; the rest of its VitePress config is the theme's. */
export interface SiteSettings {
  title: string;
  description: string;
  /** The site's navigation: the nav bar, the sidebars and the links beside them. */
  themeConfig: DefaultTheme.Config;
  /** The app's own build steps (redirects, files it serves), run before the theme's vendor files and service worker. */
  buildEnd?: (outDir: string) => void | Promise<void>;
}

export async function siteConfig(settings: SiteSettings): Promise<UserConfig> {
  await setLibraryParams();
  clearTempOnBuild();
  const root = appRoot();
  return {
    vite: {
      resolve: { alias: srcAliases },
      // A production hydration mismatch names its node instead of only "contains mismatches"
      // (/explore/zeta and the braid guide log one with no detail otherwise). About 1 KB.
      define: { __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "true" },
      // Module workers: a session kernel imports each library as its own chunk, which the
      // default (IIFE) worker bundle can't split.
      // The worker reads every package's notation through `virtual:notation-entries`.
      worker: { format: "es", plugins: () => [vendorExternals(), notationEntriesPlugin(), includeWhole()] as never },
      // The SSR build imports vendor code from node_modules (client and worker bundles use /vendor/ URLs).
      ssr: { external: ["@cortex-js/compute-engine", "katex", "mathlive"], noExternal: ["@enumeratio/site-theme"] },
      // Review mode: a dev-server-only REST API over a markdown backlog file, for
      // working through shipped features. `apply: "serve"` on the plugin itself
      // keeps it out of `vitepress build`/`preview`; gating it here too means the
      // route never even gets registered outside `vitepress dev`.
      // The repo's `vite` specifier resolves to vite-plus-core (see pnpm-workspace.yaml),
      // while vitepress's `plugins` field types against its own nested real `vite` --
      // two structurally-identical but nominally distinct `Plugin` types.
      plugins: (dev
        ? [reviewModePlugin(root), referenceDataPlugin(dev), notationEntriesPlugin(), loaderWatchPlugin()]
        : [vendorExternals(), referenceDataPlugin(dev), notationEntriesPlugin(), includeWhole()]) as never,
    },
    title: settings.title,
    description: settings.description,
    lang: "en-US",
    head: [
      ["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
      // The browser chrome takes the paper's color in each theme.
      ["meta", { name: "theme-color", content: "#fbfaf5", media: "(prefers-color-scheme: light)" }],
      ["meta", { name: "theme-color", content: "#15171c", media: "(prefers-color-scheme: dark)" }],
    ],
    cleanUrls: true,
    // `/review` (review mode) is dev-only.
    srcExclude: dev ? [] : ["review/**"],
    // Dynamic reference routes carry their name in params; use it as the page title
    // (the raw markdown H1 is `{{ $params.name }}`, which VitePress can't read).
    buildEnd: async (site: { outDir: string }) => {
      await settings.buildEnd?.(site.outDir);
      // Before the service worker, which caches them.
      writeVendor(site.outDir);
      // The host: a service worker that caches the kernel's libraries on install (host/).
      writeServiceWorker(site.outDir, { libraries: CATALOGUE.map((library) => library.name) });
    },
    transformPageData(pageData: { params?: { name?: string; title?: string }; title?: string }) {
      if (pageData.params?.title) pageData.title = pageData.params.title;
      else if (pageData.params?.name) pageData.title = pageData.params.name;
    },
    // A reference page's examples, and any page's own cells and plots, rendered at build
    // (data/prerender.ts, data/prerender-markup.ts) into their placeholders.
    async transformHtml(
      code: string,
      _id: string,
      ctx: { pageData: { relativePath: string; params?: { name?: string } } },
    ) {
      const name = ctx.pageData.params?.name;
      const page =
        name !== undefined && ctx.pageData.relativePath.startsWith("reference/symbol/")
          ? fillPrerendered(code, name)
          : code;
      return fillMarkup(page, ctx.pageData.relativePath);
    },
    // The chunks a page's cells and plots load (lazy.ts loads them at idle), fetched with the page.
    // The client bundle is written before any page renders, so its chunks are on disk.
    transformHead(ctx: { siteConfig: { outDir: string }; pageData: { relativePath: string } }) {
      const tags = pageTags(ctx.pageData.relativePath);
      if (tags.size === 0) return [];
      // A cell typesets with KaTeX, a vendor file, not a chunk.
      const katex = tags.has("notatio-cell") ? vendorHref("katex") : undefined;
      const preloaded = [
        ...chunksIn(ctx.siteConfig.outDir).filter((asset) => preloads(asset, tags)),
        ...(katex === undefined ? [] : [katex]),
      ].map((href) => ["link", { rel: "modulepreload", href }] as [string, Record<string, string>]);
      // Any prerendered cell's Out can be a grid of boxes, laid out by the elements' stylesheet, which
      // scripts inject; so every page with a cell carries it, whether or not a cell turns out to hold one.
      return tags.has("notatio-cell")
        ? [...preloaded, ["style", { id: "box-layout" }, BOX_LAYOUT_CSS] as [string, Record<string, string>, string]]
        : preloaded;
    },

    // `$latex$` / `$$latex$$` typeset by KaTeX at build (notatio-math.ts), as cells are at runtime;
    // cells and plots marked for the build to render (prerender-markup.ts).
    markdown: {
      theme: codeThemes as never,
      config: (md) => {
        notatioMath(md);
        notatioMarkup(md);
        notatioSymbols(md);
        notatioSourceLinks(md);
        prerenderMarkup(md);
      },
    },
    vue: {
      template: {
        compilerOptions: {
          // notatio-*, the box tags (row-box, table-view-box, …) and MathLive's math-field are custom elements, not Vue components.
          isCustomElement: (tag: string) =>
            tag.startsWith("notatio-") || isBoxTag(tag) || HOLE_TAGS.includes(tag) || tag === "math-field",
        },
      },
    },
    themeConfig: settings.themeConfig,
  };
}
