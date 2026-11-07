// The reference section: index pages, symbol pages, a statistic page, a map page, and the formats.
// Values were checked against mpmath (the comments give the digits) or against the definition.
// Complex plots and the plots lane's findings (the Plot range, GPUShaderForm) are not asserted here.
//
// Run: STORIES_PORT=<port> node node_modules/@playwright/test/cli.js test -c tests/stories/playwright.config.ts site-reference

import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { curveOf, settled } from "./support.ts";

/** Digit groups the printer adds (`1.202_056`) are not part of the value. */
const plain = (s: string) => s.replace(/_/g, "");

// An index grows with the catalogue, so its counter is read, not pinned.
const FILTERED = [
  { path: "/reference/statistics/", query: "IntegerPartition" },
  { path: "/reference/maps/", query: "Glaisher" },
];
const COUNTED = ["/reference/collections/", "/reference/domains/"];

/** "N of M" from the index's counter. */
async function counted(page: Page): Promise<{ shown: number; total: number }> {
  const text = await page.locator(".vp-doc").innerText();
  const m = /(\d[\d,]*) of (\d[\d,]*)/.exec(text);
  expect(m, "the index shows a counter").not.toBeNull();
  return { shown: Number(m![1].replace(/,/g, "")), total: Number(m![2].replace(/,/g, "")) };
}

/** The whole index, once the page shows it all. */
async function wholeIndex(page: Page): Promise<number> {
  let total = 0;
  await expect(async () => {
    const count = await counted(page);
    expect(count.total).toBeGreaterThan(0);
    expect(count.shown).toBe(count.total);
    total = count.total;
  }).toPass();
  return total;
}

test.describe("index pages", () => {
  for (const { path, query } of FILTERED) {
    test(`${path} filters by name and restores`, async ({ page }) => {
      await page.goto(path);
      const filter = page.locator(".ref-cat-search");
      const rows = page.locator(".ref-cat-table tbody tr");
      await expect(filter).toBeVisible();
      const total = await wholeIndex(page);
      await filter.fill(query);
      await expect(async () => {
        const { shown } = await counted(page);
        expect(shown).toBeGreaterThan(0);
        expect(shown).toBeLessThan(total);
        await expect(rows).toHaveCount(shown);
      }).toPass();
      await filter.fill("zzzqq");
      await expect(rows).toHaveCount(0);
      await filter.fill("");
      await expect(rows).toHaveCount(total);
    });
  }

  for (const path of COUNTED) {
    test(`${path} counts its entries`, async ({ page }) => {
      await page.goto(path);
      const rows = page.locator(".ref-cat-table tbody tr");
      const total = await wholeIndex(page);
      await expect(rows).toHaveCount(total);
      await page.locator(".ref-cat-search").fill("zzzqq");
      await expect(rows).toHaveCount(0);
      await page.locator(".ref-cat-search").fill("");
      await expect(rows).toHaveCount(total);
    });
  }

  for (const path of ["/reference/statistics/", "/reference/maps/"]) {
    test(`${path} shows its summary column at 1280 px`, async ({ page }) => {
      // A 70-letter name once widened the table past the column, so the summary (its third column)
      // started at the column's right edge and a reader saw only name and carrier.
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(path);
      await expect(page.locator(".ref-cat-table tbody tr").first()).toBeVisible();
      const clipped = await page.locator(".ref-cat-table").evaluate((table) => {
        const wrap = table.parentElement!.getBoundingClientRect();
        const summary = (table as HTMLTableElement).rows[1].cells[2].getBoundingClientRect();
        return summary.left >= wrap.right - 40;
      });
      expect(clipped, "the summary cell starts inside the visible column").toBe(false);
    });
  }
});

/** The output text of the symbol-page example whose id is `id`. */
const exampleOut = (page: Page, id: string) => page.locator(`.ref-example[id="example/${id}"] notatio-out`).first();

test.describe("symbol pages", () => {
  test("Zeta: exact and numeric examples agree with mpmath", async ({ page }) => {
    await page.goto("/reference/symbol/Zeta/");
    expect(await settled(exampleOut(page, "zeta-2"))).toBe("1 / 6 * Pi ^ 2");
    expect(await settled(exampleOut(page, "zeta-4"))).toBe("1 / 90 * Pi ^ 4");
    expect(await settled(exampleOut(page, "zeta-8-pi-8-9450"))).toBe("1 / 9_450 * Pi ^ 8");
    // zeta(-1) = -1/12 and zeta(-3) = 1/120 (Bernoulli: -B_4/4), zeta(-2) = 0; zeta(-5) = -1/252.
    expect(await settled(exampleOut(page, "threads-over-a-list-reducing-every-element-to"))).toBe(
      "[-1 / 12, 0, 1 / 120]",
    );
    expect(await settled(exampleOut(page, "zeta-5-b-6-6-1-252"))).toBe("-1 / 252");
    // mpmath: zeta(3) = 1.20205690315959428539973816, zeta(1.5) = 2.61237534868548834334856757.
    expect(plain(await settled(exampleOut(page, "apery-s-constant-zeta-3-numerically")))).toMatch(
      /^1\.202056903159594285/,
    );
    expect(plain(await settled(exampleOut(page, "a-machine-precision-argument")))).toMatch(/^2\.612375348685488343/);
    // mpmath: zeta(0.5 + 14i) = 0.0222411426099935892 - 0.1032581232664500579i.
    expect(plain(await settled(exampleOut(page, "on-the-critical-line-zeta-1-2-14i-0-02224-0")))).toBe(
      "0.02224114260999359 - 0.10325812326645006i",
    );
    // The pole at 1.
    expect(await settled(exampleOut(page, "pole-at-s-1-the-harmonic-series-sum-1-n-diverges"))).toBe("ComplexInfinity");
  });

  test("HurwitzZeta, Gamma and AiryAi examples agree with mpmath", async ({ page }) => {
    await page.goto("/reference/symbol/HurwitzZeta/");
    // mpmath: zeta(3, 0.2) = 125.739018057217945694903993.
    expect(plain(await settled(exampleOut(page, "an-inexact-a-evaluates-numerically-without-n")))).toMatch(
      /^125\.73901805721795/,
    );
    await page.goto("/reference/symbol/Gamma/");
    // mpmath: gamma(2.5) = 1.32934038817913702047362561.
    expect(plain(await settled(exampleOut(page, "a-floating-point-argument-evaluates-directly-to")))).toMatch(
      /^1\.3293403881791370204/,
    );
    expect(await settled(exampleOut(page, "gamma-5-4-24"))).toBe("24");
    await page.goto("/reference/symbol/AiryAi/");
    // mpmath: airyai(0) = 0.355028053887817239260063186.
    expect(plain(await settled(exampleOut(page, "ai-0")))).toMatch(/^0\.3550280538878172/);
  });

  test("BesselJ: the example and the real slice, which follows the order dial", async ({ page }) => {
    await page.goto("/reference/symbol/BesselJ/");
    // mpmath: besselj(0, 1) = 0.765197686557966551449717526.
    const cell = page.locator("notatio-cell[expect='0.7651976865579666'] notatio-out");
    expect(plain(await settled(cell))).toBe("0.7651976865579666");

    // The slice is J_n(x) for the order on the dial: n = 1, then n = 3 (series, accurate to 1e-12 here).
    const slice = page.locator("notatio-manipulate").filter({ has: page.locator("graphics-box") });
    const dial = slice.locator("slider-box[name=order] input");
    const svg = slice.locator("graphics-box svg[role=img]");
    const bessel = (n: number, x: number) => {
      let sum = 0;
      let term = Math.pow(x / 2, n) / factorial(n);
      for (let k = 0; k < 40; k++) {
        sum += term;
        term *= -((x / 2) * (x / 2)) / ((k + 1) * (k + 1 + n));
      }
      return sum;
    };
    for (const n of [1, 3]) {
      await dial.fill(String(n));
      await expect(async () => {
        const curve = await curveOf(svg);
        const worst = Math.max(...curve.xs.map((x, i) => Math.abs(curve.ys[i] - bessel(n, x))));
        // Path points are rounded to 0.01 px: under 1% of the span.
        expect(worst).toBeLessThan(5e-3);
        // The y axis spans the curve with a margin: max |J_1| = 0.5819 and max |J_3| = 0.4349.
        const top = Math.max(...curve.ys);
        expect(top).toBeGreaterThan(n === 1 ? 0.55 : 0.4);
        expect(top).toBeLessThan(n === 1 ? 0.7 : 0.5);
      }).toPass();
    }
  });

  test("anchors scroll their target into view", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const hash of ["#plot", "#example/zeta-4"]) {
      await page.goto(`/reference/symbol/Zeta/${hash}`);
      const target = page.locator(hash === "#plot" ? "h2" : '.ref-example[id="example/zeta-4"]', {
        hasText: hash === "#plot" ? "Plot" : undefined,
      });
      await expect(async () => {
        const top = await target.first().evaluate((n) => n.getBoundingClientRect().top);
        expect(top).toBeGreaterThan(0);
        expect(top).toBeLessThan(900);
      }).toPass();
    }
  });
});

function factorial(n: number): number {
  return n <= 1 ? 1 : n * factorial(n - 1);
}

test.describe("a statistic's page", () => {
  const path = "/reference/statistic/IntegerPartition/LargestPart/";
  const live = (page: Page) => ({
    input: page.locator(".field-live notatio-in"),
    out: page.locator(".field-live notatio-out"),
  });

  test("the opening Live example is the one the picker names", async ({ page }) => {
    // BL-319 S#9: the picker opens at Size 4, Rank 1 of 5, which is the partition [4] (largest part 4),
    // and the cell opens on IntegerPartition([1]), largest part 1, until the picker is touched.
    test.fail();
    await page.goto(path);
    await expect(page.locator("slider-box[name=rank]")).toBeVisible();
    await expect(page.getByText("of 5")).toBeVisible();
    const { input, out } = live(page);
    await expect(input).toHaveAttribute("input-form", /./);
    expect(await input.getAttribute("input-form")).toContain("IntegerPartition([4])");
    expect(await settled(out)).toBe("4");
  });

  test("the picker drives the Live example, and the triangle and FindStat table are right", async ({ page }) => {
    await page.goto(path);
    const rank = page.locator("slider-box[name=rank] input");
    await expect(rank).toBeVisible();
    const { input, out } = live(page);
    // The partitions of 4 in order: [4], [3,1], [2,2], [2,1,1], [1,1,1,1]; their largest parts are 4, 3, 2, 2, 1.
    for (const [r, parts, largest] of [
      [2, "[3, 1]", "3"],
      [3, "[2, 2]", "2"],
      [5, "[1, 1, 1, 1]", "1"],
    ] as const) {
      await rank.fill(String(r));
      await expect(input).toHaveAttribute("input-form", new RegExp(`IntegerPartition\\(${escape(parts)}\\)`));
      await expect(out).toHaveAttribute("input-form", largest);
    }
    // Size 5, rank 2: [4, 1], largest part 4.
    await page.locator(".field-live").getByRole("button", { name: "Next" }).first().click();
    await rank.fill("2");
    await expect(input).toHaveAttribute("input-form", /IntegerPartition\(\[4, 1\]\)/);
    await expect(out).toHaveAttribute("input-form", "4");

    // The triangle counts partitions of n by largest part (python, p(n, k) by the recurrence).
    await page.getByText("Compute the triangle").click();
    const rows = page.locator(".vp-doc table").filter({ hasText: "Generating polynomial" }).locator("tbody tr");
    await expect(rows).toHaveCount(8);
    const expected = [
      "1",
      "1, 1",
      "1, 1, 1",
      "1, 2, 1, 1",
      "1, 2, 2, 1, 1",
      "1, 3, 3, 2, 1, 1",
      "1, 3, 4, 3, 2, 1, 1",
      "1, 4, 5, 5, 3, 2, 1, 1",
    ];
    for (const [i, coefficients] of expected.entries())
      await expect(rows.nth(i).locator("td").nth(1)).toHaveText(new RegExp(`^${coefficients} from q\\^1`));

    // FindStat St000147 is the largest part: [] -> 0, [k] -> k.
    const findstat = page.locator(".vp-doc table").filter({ hasText: "Object" }).last();
    await expect(findstat.locator("tbody tr").first()).toContainText("[]");
    await expect(findstat.locator("tbody tr").first()).toContainText("0");
    await expect(findstat.locator("tbody tr").nth(4)).toContainText("[4]");
    await expect(findstat.locator("tbody tr").nth(4)).toContainText("4");
  });
});

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test.describe("a map's page", () => {
  const path = "/reference/map/IntegerPartition/GlaisherFranklin/";

  test("the opening Live example is the one the picker names", async ({ page }) => {
    // BL-319 S#9: as on the statistic page, the picker opens at Size 4, Rank 1 ([4]) and the cell at [1].
    test.fail();
    await page.goto(path);
    await expect(page.locator("slider-box[name=rank]")).toBeVisible();
    const input = page.locator(".field-live notatio-in");
    await expect(input).toHaveAttribute("input-form", /./);
    expect(await input.getAttribute("input-form")).toContain("IntegerPartition([4])");
  });

  test("the table and the properties follow the definition", async ({ page }) => {
    await page.goto(path);
    await page.getByText("Show the table").click();
    // Even parts halve into repeated parts, repeated odd parts merge into binary multiples, all at once:
    // [4] -> [2,2], [2,2] -> [1,1,1,1], [1,1,1,1] -> [4], while [3,1] and [2,1,1] stay.
    const text = async () => plain((await page.locator(".vp-doc").innerText()).replace(/\s+/g, " "));
    await expect(async () => {
      const t = await text();
      for (const pair of [
        "IntegerPartition([4]) IntegerPartition([2, 2])",
        "IntegerPartition([3, 1]) IntegerPartition([3, 1])",
        "IntegerPartition([2, 2]) IntegerPartition([1, 1, 1, 1])",
        "IntegerPartition([2, 1, 1]) IntegerPartition([2, 1, 1])",
        "IntegerPartition([1, 1, 1, 1]) IntegerPartition([4])",
      ])
        expect(t).toContain(pair);
    }).toPass();
  });
});

test.describe("formats", () => {
  test("WGSLForm writes the shader expression", async ({ page }) => {
    await page.goto("/reference/formats/output/wgsl/");
    const wgsl = (source: string) => page.locator(`notatio-out[form=wgsl][value='${source}']`).first();
    await expect(wgsl('["Add",["Power","x",2],1]')).toContainText("(x * x) + 1.0");
    await expect(wgsl('["Sin","x"]')).toContainText("_gpu_sin(x)");
    await expect(wgsl('["Divide",1,"x"]')).toContainText("1.0 / x");
    await expect(wgsl('["Rational",1,2]')).toContainText("0.5");
    await expect(wgsl('["Sqrt",["Add",["Power","x",2],["Power","y",2]]]')).toContainText("sqrt((x * x) + (y * y))");
    await expect(wgsl('["Abs","x"]')).toContainText("abs(x)");
  });
});
