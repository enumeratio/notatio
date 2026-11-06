// CollectionTable on its reference page (/reference/component/CollectionTable): what a reader
// sees of the table -- when its first rows arrive, whether the last row can be read, where the
// view sits after a sort, and whether each glyph and element shows whole. Every assertion reads
// the page's geometry, not the component's state. Stories are the page's own (the story ids in
// packages/components/reference/CollectionTable.stories.yaml).
//
// Run with: STORIES_PORT=<port> pnpm exec playwright test -c tests/stories/playwright.config.ts tests/stories/collection-table.spec.ts

import { expect, type Locator, type Page, test } from "@playwright/test";

/** Pixels of slack for sub-pixel layout. */
const EPS = 1;

/** Opens a story and returns its table once the first data row is drawn. */
async function openStory(page: Page, id: string): Promise<Locator> {
  await page.goto(`/reference/component/CollectionTable#story/${id}`);
  const card = page.locator(`[id="story/${id}"]`);
  await expect(card).toBeVisible();
  // A table loads when the reader scrolls to it, and a hash link can land short of its card (the page settles after).
  const table = card.locator("table-view-box");
  await expect(async () => {
    await table.scrollIntoViewIfNeeded();
    await expect(table.locator(".tvb-row[data-index]:not([aria-busy])").first()).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 120_000 });
  return table;
}

/** Where the rows of a table sit: its viewport, header and the box of the row at `index`. */
async function geometry(table: Locator, index: number) {
  return table.evaluate((el, i) => {
    const viewport = el.querySelector<HTMLElement>(".tvb-viewport")!.getBoundingClientRect();
    const header = el.querySelector<HTMLElement>(".tvb-header")!.getBoundingClientRect();
    const row = el.querySelector<HTMLElement>(`.tvb-row[data-index="${i}"]`)?.getBoundingClientRect();
    return {
      viewportTop: viewport.top,
      viewportBottom: viewport.bottom,
      headerBottom: header.bottom,
      rowTop: row?.top,
      rowBottom: row?.bottom,
    };
  }, index);
}

/** The last row is on screen in full: below the header, above the footer, nothing cut off. */
async function expectRowFullyVisible(table: Locator, index: number): Promise<void> {
  await expect
    .poll(async () => {
      const g = await geometry(table, index);
      return g.rowTop !== undefined && g.rowBottom! <= g.viewportBottom + EPS && g.rowTop >= g.headerBottom - EPS;
    })
    .toBe(true);
}

async function jumpTo(table: Locator, row: string): Promise<void> {
  const jump = table.locator("input[aria-label='jump to row']");
  await jump.fill(row);
  await jump.press("Enter");
}

test.describe("CollectionTable first load", () => {
  test("the first screen shows rows, and is honest until they come", async ({ page }) => {
    const id = "subsets-4-with-glyph";
    await page.goto(`/reference/component/CollectionTable#story/${id}`);
    const card = page.locator(`[id="story/${id}"]`);
    await expect(card).toBeVisible();
    const table = card.locator("table-view-box");
    const seen = new Set<string>();
    // Until a data row arrives, the footer claims no count ("of ≥ 0") and numbers no rows while it
    // still says "loading…".
    await expect
      .poll(
        async () => {
          const state = await table.evaluate((el) => ({
            data: el.querySelectorAll(".tvb-row[data-index]:not([aria-busy])").length,
            numbered: el.querySelectorAll(".tvb-row[data-index]").length,
            footer: el.querySelector(".tvb-status")?.textContent ?? "",
          }));
          if (state.data === 0) {
            if (state.numbered > 0 && state.footer === "loading…")
              seen.add(`${state.numbered} numbered rows while loading`);
            if (/≥ 0\b/.test(state.footer)) seen.add(`footer "${state.footer}"`);
          }
          return state.data;
        },
        { intervals: [100] },
      )
      .toBeGreaterThan(0);
    expect([...seen]).toEqual([]);
    await expect(card.locator(".nct-count")).toHaveText("16 rows");
  });

  test("a table below the fold asks the kernel for nothing until it is near", async ({ page }) => {
    // The page holds ten tables and the kernel does one thing at a time: the last story's
    // table must stay unloaded while the first is the one in view.
    await page.goto("/reference/component/CollectionTable#story/subsets-4-with-glyph");
    const first = page.locator('[id="story/subsets-4-with-glyph"] table-view-box');
    await expect(first.locator(".tvb-row[data-index]:not([aria-busy])").first()).toBeVisible();
    const last = page.locator('[id="story/set-partitions-4-blocks"] table-view-box');
    await expect(last.locator(".tvb-status")).toHaveText("loading…");
    await expect(last.locator(".tvb-row[data-index]")).toHaveCount(0);
  });
});

test.describe("CollectionTable last row", () => {
  test("Subsets(4): row 16 is fully visible at the end of the scroll", async ({ page }) => {
    const table = await openStory(page, "subsets-4-with-glyph");
    await table.locator(".tvb-viewport").evaluate((v) => (v.scrollTop = v.scrollHeight));
    await expect(table.locator(".tvb-row[data-index='16']")).toBeVisible();
    await expectRowFullyVisible(table, 16);
  });

  test("Subsets(4): a jump to row 16 shows it in full", async ({ page }) => {
    const table = await openStory(page, "subsets-4-with-glyph");
    await jumpTo(table, "16");
    await expectRowFullyVisible(table, 16);
  });

  test("IntegerPartitions(8): row 22 is fully visible at the end of the scroll", async ({ page }) => {
    const table = await openStory(page, "integer-partitions-8-ferrers");
    await table.locator(".tvb-viewport").evaluate((v) => (v.scrollTop = v.scrollHeight));
    await expectRowFullyVisible(table, 22);
  });

  test("SymmetricGroup(25): the story that opens on the last permutation shows it in full", async ({ page }) => {
    const table = await openStory(page, "symmetric-group-25-last-row");
    const last = table.locator(".tvb-row[data-index='15511210043330985984000000']");
    await expect(last).toBeVisible();
    const box = await table.evaluate((el) => {
      const row = el.querySelector<HTMLElement>(".tvb-row[data-index='15511210043330985984000000']")!;
      return {
        rowBottom: row.getBoundingClientRect().bottom,
        viewportBottom: el.querySelector(".tvb-viewport")!.getBoundingClientRect().bottom,
      };
    });
    expect(box.rowBottom).toBeLessThanOrEqual(box.viewportBottom + EPS);
  });
});

test.describe("CollectionTable past 2^53", () => {
  test("SymmetricGroup(25): the index column tells the rows apart, and the footer writes both ends alike", async ({
    page,
  }) => {
    const table = await openStory(page, "symmetric-group-25-last-row");
    const labels = await table.locator(".tvb-row[data-index] .tvb-idx").allInnerTexts();
    expect(new Set(labels).size).toBe(labels.length);
    await expect(table.locator(".tvb-status")).toHaveText(/^rows near 1\.55 × 10²⁵, 12 shown, of/);
  });

  test("the component page does not scroll sideways at 390 px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openStory(page, "symmetric-group-25-last-row");
    const widths = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      document.documentElement.clientWidth,
    ]);
    expect(widths[0]).toBe(widths[1]);
  });
});

test.describe("CollectionTable after a sort", () => {
  test("row 1 sits directly under the header after a sort from the bottom", async ({ page }) => {
    const table = await openStory(page, "symmetric-group-5-statistics");
    const viewport = table.locator(".tvb-viewport");
    await viewport.evaluate((v) => (v.scrollTop = v.scrollHeight));
    await expect.poll(() => viewport.evaluate((v) => v.scrollTop)).toBeGreaterThan(0);
    await table.locator(".tvb-header .tvb-sortable", { hasText: "Inversions" }).click();
    await expect(table.locator(".tvb-status")).toContainText("rows 1–");
    await expect
      .poll(async () => {
        const g = await geometry(table, 1);
        return g.rowTop === undefined ? Number.NaN : Math.abs(g.rowTop - g.headerBottom);
      })
      .toBeLessThanOrEqual(EPS);
  });
});

/** Every drawn mark of the glyph in the row at `index` lies inside the glyph's cell. */
async function glyphMarksInside(
  table: Locator,
  index: number,
): Promise<{ marks: number; outside: number; smallest: number }> {
  return table.evaluate((el, i) => {
    const cell = el.querySelector<HTMLElement>(`.tvb-row[data-index="${i}"] .tvb-cell[data-col="0"]`)!;
    const box = cell.getBoundingClientRect();
    const marks = [...cell.querySelectorAll<SVGGraphicsElement>("svg rect, svg text, svg polyline, svg circle")];
    let outside = 0;
    let smallest = Number.POSITIVE_INFINITY;
    for (const mark of marks) {
      const r = mark.getBoundingClientRect();
      if (r.left < box.left - 0.5 || r.right > box.right + 0.5 || r.top < box.top - 0.5 || r.bottom > box.bottom + 0.5)
        outside++;
      smallest = Math.min(smallest, r.width, r.height);
    }
    return { marks: marks.length, outside, smallest };
  }, index);
}

test.describe("CollectionTable glyphs", () => {
  test("IntegerPartitions(8): [8] draws its eight boxes whole, and legibly", async ({ page }) => {
    const table = await openStory(page, "integer-partitions-8-ferrers");
    const g = await glyphMarksInside(table, 1);
    expect(g.marks).toBe(8);
    expect(g.outside).toBe(0);
    expect(g.smallest).toBeGreaterThanOrEqual(3);
  });

  test("IntegerPartitions(8): [7,1] draws all eight boxes", async ({ page }) => {
    const table = await openStory(page, "integer-partitions-8-ferrers");
    const g = await glyphMarksInside(table, 2);
    expect(g.marks).toBe(8);
    expect(g.outside).toBe(0);
  });

  test("Subsets(4): every box of the subset glyph is shown", async ({ page }) => {
    const table = await openStory(page, "subsets-4-with-glyph");
    for (const row of [1, 16]) {
      const g = await glyphMarksInside(table, row);
      // Four cells and their four labels.
      expect(g.marks).toBe(8);
      expect(g.outside).toBe(0);
    }
  });

  test("SetPartitions(4): the pills show every element", async ({ page }) => {
    const table = await openStory(page, "set-partitions-4-blocks");
    // Row 1 is {1,2,3,4}, one pill of four numbers.
    const g = await glyphMarksInside(table, 1);
    expect(g.outside).toBe(0);
    expect(await table.locator(".tvb-row[data-index='1'] .tvb-cell[data-col='0'] svg text").allTextContents()).toEqual([
      "1",
      "2",
      "3",
      "4",
    ]);
  });
});

test.describe("CollectionTable element column", () => {
  test("IntegerPartitions(8): the element is the part list, not cut to its constructor", async ({ page }) => {
    const table = await openStory(page, "integer-partitions-8-ferrers");
    const cell = table.locator(".tvb-row[data-index='1'] .tvb-cell[data-col='1']");
    await expect(cell).toHaveText("[8]");
    for (const i of [1, 2]) {
      const fits = await table.evaluate((el, row) => {
        const c = el.querySelector<HTMLElement>(`.tvb-row[data-index="${row}"] .tvb-cell[data-col="1"]`)!;
        return c.scrollWidth <= c.clientWidth;
      }, i);
      expect(fits, `row ${i}`).toBe(true);
    }
    // A part list too long for the column is cut at its end, and the whole of it is the tooltip.
    const last = table.locator(".tvb-row[data-index='22'] .tvb-cell[data-col='1']");
    await table.locator(".tvb-viewport").evaluate((v) => (v.scrollTop = v.scrollHeight));
    await expect(last).toHaveAttribute("title", "[1, 1, 1, 1, 1, 1, 1, 1]");
  });
});
