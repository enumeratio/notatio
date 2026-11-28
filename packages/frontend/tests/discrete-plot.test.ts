// `DiscretePlot(f, (n, lo, hi))` samples `f` at the integers of its iterator and draws a stem for each. It
// once drew only a literal list, so the head's own form (an expression and an iterator) drew nothing on
// the page; every route lowers it through the one plot sampler, and this holds that.

import { parseExpression } from "@notatio/formats/expression";
import type { BoxNode } from "@notatio/boxes";
import { expect, test } from "vite-plus/test";
import { declaredEngine } from "../../reference/scripts/engines.ts";
import { boxOfExample } from "../scripts/example-boxes.ts";
import { optionsOfBox, graphicsOf } from "@notatio/boxes";

const ce = declaredEngine();
const lower = (text: string): BoxNode => {
  const { json } = parseExpression(text, { ce });
  const box = boxOfExample(ce, json as never);
  return (graphicsOf(box)?.box ?? box) as BoxNode;
};
const dots = (box: BoxNode): number[][] => {
  const found = (box[1] as BoxNode[]).flatMap(function walk(node: unknown): number[][] {
    if (!Array.isArray(node)) return [];
    if (node[0] === "PointBox") return (optionsOfBox(node as unknown as BoxNode).Points as number[][]) ?? [];
    return node.slice(1).flatMap(walk);
  });
  return found;
};

test("an expression is sampled at the integers of its iterator, each with a stem", () => {
  const box = lower("DiscretePlot(n^2, (n, 1, 5))");
  expect(dots(box)).toEqual([
    [1, 1],
    [2, 4],
    [3, 9],
    [4, 16],
    [5, 25],
  ]);
  const text = JSON.stringify(box);
  expect(text).toContain('"Fill"');
  expect(text).not.toContain('"Notes"');
});

test("an iterator with no lower end starts at 1, and a step skips integers", () => {
  expect(dots(lower("DiscretePlot(n, (n, 3))")).map((p) => p[0])).toEqual([1, 2, 3]);
  expect(dots(lower("DiscretePlot(n, (n, 0, 10, 5))")).map((p) => p[0])).toEqual([0, 5, 10]);
});

test("a literal list is still a chart of its values", () => {
  expect(JSON.stringify(lower("DiscretePlot([1, 2, 4, 8])"))).toContain("Stem");
});
