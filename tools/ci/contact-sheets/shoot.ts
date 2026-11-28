// Advisory contact sheets for the reference heads a PR changes (BL-632).
//
//   node tools/ci/contact-sheets/shoot.ts --dist web/.vitepress/dist --out contact-sheets --base <sha>
//
// Serves the built site statically, opens each changed head's page, shoots every example in a light
// theme, a dark theme and at 400 px wide, and composes `<Head>.png` (or `<Head>-<n>.png`) sheets plus a
// `summary.md`. Never fails: every error is caught per head and per example, written to the summary,
// and the process exits 0. There are no goldens; a person reads the sheets.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { createRequire } from "node:module";
import { extname, join, normalize, resolve, sep } from "node:path";
import { parseArgs } from "node:util";
import { changedHeads, describeSelection, headPath } from "./changed-heads.ts";
import { CONDITIONS, sheetPages, type Cell, type SheetRow } from "./sheet.ts";

/** The part of Playwright this script uses; the package lives under web/, so it is loaded from there. */
interface Locator {
  count(): Promise<number>;
  nth(index: number): Locator;
  getAttribute(name: string): Promise<string | null>;
  scrollIntoViewIfNeeded(): Promise<void>;
  screenshot(options?: { timeout?: number }): Promise<Uint8Array>;
}
interface Page {
  goto(url: string, options?: { waitUntil?: string }): Promise<{ status(): number } | null>;
  waitForLoadState(state: string, options?: { timeout?: number }): Promise<void>;
  waitForTimeout(ms: number): Promise<void>;
  locator(selector: string): Locator;
  setContent(html: string): Promise<void>;
  screenshot(options: { fullPage: boolean }): Promise<Uint8Array>;
}
interface Context {
  newPage(): Promise<Page>;
  setDefaultTimeout(ms: number): void;
  addInitScript(script: string): Promise<void>;
  close(): Promise<void>;
}
interface Browser {
  newContext(options: { viewport: { width: number; height: number }; colorScheme: "light" | "dark" }): Promise<Context>;
  close(): Promise<void>;
}
const { chromium } = createRequire(new URL("../../../web/package.json", import.meta.url))("@playwright/test") as {
  chromium: { launch(options: { headless: boolean; args: string[] }): Promise<Browser> };
};

/** Field and complex plots draw on WebGL: headed under `xvfb-run`, on ANGLE's SwiftShader, as the GPU stories run
 *  (`web/tests/stories/playwright.gpu.config.ts`); headless Chromium on a runner leaves their canvases blank. */
const LAUNCH = {
  headless: false,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
};

/** Examples shot per head; the rest are named in the summary. */
const MAX_EXAMPLES = 30;
/** Time one action may take, in milliseconds. */
const ACTION_TIMEOUT = 20_000;
/** Time given to a page's examples to settle after it loads, in milliseconds. */
const SETTLE_TIMEOUT = 15_000;

const SETUPS = [
  { name: CONDITIONS[0], width: 1100, scheme: "light" },
  { name: CONDITIONS[1], width: 1100, scheme: "dark" },
  { name: CONDITIONS[2], width: 400, scheme: "light" },
] as const;

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
};

/** A static server over `root`: a path, then `<path>/index.html`, then `<path>.html`. */
function serve(root: string): Promise<{ server: Server; origin: string }> {
  const base = resolve(root);
  const server = createServer((request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
      // A clean URL may end in a slash (`/reference/symbol/Plot/`) while the build wrote `Plot.html`.
      const target = normalize(join(base, pathname)).replace(/[\\/]+$/, "");
      const candidates = [target, join(target, "index.html"), `${target}.html`];
      const file = target.startsWith(base + sep) || target === base ? candidates.find(isFile) : undefined;
      if (file === undefined) {
        response.writeHead(404).end("not found");
        return;
      }
      response.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
      response.end(readFileSync(file));
    } catch {
      response.writeHead(500).end("error");
    }
  });
  return new Promise((done, fail) => {
    server.once("error", fail);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      done({ server, origin: `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}` });
    });
  });
}

function isFile(path: string): boolean {
  return existsSync(path) && statSync(path).isFile();
}

const reason = (error: unknown) =>
  (error instanceof Error ? error.message : String(error)).split("\n")[0].slice(0, 200);

/** The vitepress theme choice, set before the page's scripts run, so the page opens in `scheme`. */
const themeScript = (scheme: string) =>
  `try { localStorage.setItem("vitepress-theme-appearance", "${scheme}") } catch {}`;

/** Every example on the head's page in one condition, by id: its screenshot or why there is none. */
async function shootCondition(
  browser: Browser,
  url: string,
  setup: (typeof SETUPS)[number],
): Promise<{ status: number; ids: string[]; cells: Map<string, Cell>; skipped: number }> {
  const context = await browser.newContext({
    viewport: { width: setup.width, height: 900 },
    colorScheme: setup.scheme,
  });
  try {
    context.setDefaultTimeout(ACTION_TIMEOUT);
    await context.addInitScript(themeScript(setup.scheme));
    const page = await context.newPage();
    const response = await page.goto(url, { waitUntil: "load" });
    const status = response?.status() ?? 0;
    if (status >= 400) return { status, ids: [], cells: new Map(), skipped: 0 };
    await page.waitForLoadState("networkidle", { timeout: SETTLE_TIMEOUT }).catch(() => undefined);
    await page.waitForTimeout(1000);
    const examples = page.locator(".ref-example");
    const count = await examples.count();
    const ids: string[] = [];
    const cells = new Map<string, Cell>();
    for (let i = 0; i < Math.min(count, MAX_EXAMPLES); i++) {
      const example = examples.nth(i);
      const id = ((await example.getAttribute("id").catch(() => null)) ?? `example-${i + 1}`).replace(/^example\//, "");
      ids.push(id);
      try {
        await example.scrollIntoViewIfNeeded();
        cells.set(id, { png: await example.screenshot({ timeout: ACTION_TIMEOUT }) });
      } catch (error) {
        cells.set(id, { error: reason(error) });
      }
    }
    return { status, ids, cells, skipped: Math.max(0, count - MAX_EXAMPLES) };
  } finally {
    await context.close().catch(() => undefined);
  }
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      dist: { type: "string", default: "web/.vitepress/dist" },
      out: { type: "string", default: "contact-sheets" },
      base: { type: "string", default: process.env.PR_BASE ?? "" },
    },
  });
  const out = resolve(values.out);
  mkdirSync(out, { recursive: true });
  const lines: string[] = ["## Reference contact sheets (advisory)", ""];
  const flush = () => writeFileSync(join(out, "summary.md"), `${lines.join("\n")}\n`);

  let server: Server | undefined;
  let browser: Browser | undefined;
  try {
    if (!values.base) throw new Error("no base commit given (--base or PR_BASE)");
    const changed = execFileSync("git", ["diff", "--name-only", values.base, "HEAD"], { encoding: "utf8" })
      .split("\n")
      .filter(Boolean);
    const selection = changedHeads(changed);
    lines.push(describeSelection(selection), "");
    if (selection.heads.length === 0) return;
    if (!existsSync(join(values.dist, "index.html"))) throw new Error(`no built site in ${values.dist}`);

    const served = await serve(values.dist);
    server = served.server;
    browser = await chromium.launch(LAUNCH);

    const shot: string[] = [];
    const skipped: string[] = [];
    const failures: string[] = [];
    for (const head of selection.heads) {
      try {
        const results: Awaited<ReturnType<typeof shootCondition>>[] = [];
        for (const setup of SETUPS) results.push(await shootCondition(browser, served.origin + headPath(head), setup));
        const [light] = results;
        if (light.status >= 400 || light.status === 0) {
          skipped.push(`${head}: no built page (status ${light.status}); the head may be new, removed or hidden`);
          continue;
        }
        if (light.ids.length === 0) {
          skipped.push(`${head}: the page has no examples`);
          continue;
        }
        if (light.skipped > 0)
          skipped.push(`${head}: ${light.skipped} examples beyond the first ${MAX_EXAMPLES} left out`);
        const rows: SheetRow[] = light.ids.map((id) => ({
          label: id,
          cells: results.map((result): Cell => result.cells.get(id) ?? { error: `no example ${id} in this condition` }),
        }));
        for (const [i, setup] of SETUPS.entries())
          for (const [id, cell] of results[i].cells)
            if ("error" in cell) failures.push(`${head} / ${id} / ${setup.name}: ${cell.error}`);

        const pages = sheetPages(head, rows);
        const composer = await browser.newContext({ viewport: { width: 1700, height: 900 }, colorScheme: "light" });
        try {
          composer.setDefaultTimeout(ACTION_TIMEOUT);
          const page = await composer.newPage();
          for (const [i, html] of pages.entries()) {
            await page.setContent(html);
            const file = pages.length === 1 ? `${head}.png` : `${head}-${i + 1}.png`;
            writeFileSync(join(out, file), await page.screenshot({ fullPage: true }));
            shot.push(file);
          }
        } finally {
          await composer.close().catch(() => undefined);
        }
      } catch (error) {
        failures.push(`${head}: ${reason(error)}`);
      }
    }

    lines.push(
      `Sheets written (${shot.length}): ${shot.length ? shot.map((f) => `\`${f}\``).join(", ") : "none"}.`,
      "",
    );
    lines.push("Each sheet has a row per example and the columns light, dark and 400 px wide.", "");
    if (skipped.length) lines.push("### Skipped", "", ...skipped.map((s) => `- ${s}`), "");
    if (failures.length) lines.push("### Could not shoot", "", ...failures.map((f) => `- ${f}`), "");
  } catch (error) {
    lines.push(`Contact sheets were not made: ${reason(error)}`, "");
  } finally {
    await browser?.close().catch(() => undefined);
    server?.close();
    flush();
  }
}

await main().catch((error) => console.error(`contact sheets: ${reason(error)}`));
process.exit(0);
