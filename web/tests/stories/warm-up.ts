// Runs once, after the dev server answers and before any test: loads one page of each family the
// specs open, so the server's cold transforms of the engine and the components (tens of seconds
// each, several times that on a runner) are not charged to whichever test happens to open the
// family first against its own timeout. Best effort: a page that does not settle in time is left
// to the test that needs it.

import { chromium, type FullConfig } from "@playwright/test";

const PAGES = [
  "/docs/components/environments",
  "/worksheet/",
  "/reference/statistics/",
  "/reference/statistic/IntegerPartition/LargestPart/",
  "/reference/map/IntegerPartition/GlaisherFranklin/",
];

export default async function warmUp(config: FullConfig): Promise<void> {
  const { baseURL, navigationTimeout } = config.projects[0].use;
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ baseURL });
    for (const path of PAGES) {
      try {
        await page.goto(path, { waitUntil: "networkidle", timeout: navigationTimeout });
      } catch {
        // the test that opens it waits for it itself
      }
    }
  } finally {
    await browser.close();
  }
}
