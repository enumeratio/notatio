// A plotting head's declared options (`options:` in its record) each do something: for every one, a
// call that sets it lowers to another box than the call without it, or the head reports the option
// (`optionIssuesOf`) because it does not read it there. A declared option that does neither is a
// promise the head does not keep, and fails here. `graphics.test.ts` holds the readers of each option;
// `formats/tests/declared-options.test.ts` holds the record's list to what `rulesInCalls` knows.

import { readEntries } from "@notatio/entry/node";
import { parseExpression } from "@notatio/formats/expression";
import { expect, test } from "vite-plus/test";
import { declaredEngine } from "../../reference/scripts/engines.ts";
import { boxOfExample } from "../scripts/example-boxes.ts";
import { plainJson } from "../src/graphics-rules.ts";
import { optionIssuesOf } from "../src/symbols.ts";

/** A head's call without the option, and for each declared option a value that makes a difference. */
interface Probe {
  readonly call: string;
  readonly options: Readonly<Record<string, string>>;
}

/** What the frame's options of every curve head are set to. */
const FRAME = {
  AspectRatio: "0.5",
  Axes: "False",
  AxesLabel: '("x", "y")',
  AxesOrigin: "(1, 1)",
  Epilog: "Point((1, 1))",
  Frame: "True",
  GridLines: "True",
  PlotLabel: '"title"',
  PlotRange: "(-0.5, 0.5)",
  PlotRangePadding: "0.5",
  PlotStyle: "Red",
  Prolog: "Point((1, 1))",
  Ticks: "None",
};

const LIST_OPTIONS = { ...FRAME, Filling: "True", ScalingFunctions: '"Log"' };

const PROBES: Readonly<Record<string, Probe>> = {
  Plot: {
    call: "Plot([Sin(x) + 2, Cos(x) + 2], (x, 0, 3))",
    options: {
      ...FRAME,
      ColorFunction: '"Magma"',
      Filling: "True",
      PlotLegends: "True",
      PlotPoints: "10",
      ScalingFunctions: '"Log"',
    },
  },
  ParametricPlot: {
    call: "ParametricPlot((Cos(t), Sin(t)), (t, 0, 5))",
    options: { ...FRAME, PlotPoints: "10" },
  },
  PolarPlot: {
    call: "PolarPlot(1 + Sin(t), (t, 0, 6))",
    options: { Filled: "True", PlotLabel: '"title"', PlotPoints: "10", PlotStyle: "Red" },
  },
  ListPlot: { call: "ListPlot([1, 3, 2, 5])", options: LIST_OPTIONS },
  ListLinePlot: { call: "ListLinePlot([1, 3, 2, 5])", options: LIST_OPTIONS },
  ListPolarPlot: { call: "ListPolarPlot([[0, 1], [1, 2], [2, 1]])", options: { Closed: "True" } },
  BarChart: {
    call: "BarChart([1, 3, 2])",
    options: { ColorFunction: '"Magma"', GridLines: "None", PlotLabel: '"title"' },
  },
  ArrayPlot: {
    call: "ArrayPlot([[1, 2], [3, 4]])",
    // A matrix has no tiles to rule, mix or bound: those three are said, not drawn.
    options: {
      BoundaryStyle: "Red",
      ColorFunction: '"Magma"',
      ColorMixing: '"Additive"',
      ColorRules: "[IsUnit -> Red]",
    },
  },
  DiscretePlot: {
    call: "DiscretePlot(n^2, (n, 1, 5))",
    options: { PlotLabel: '"title"', PlotStyle: "Red" },
  },
  Chart: { call: "Chart([1, 3, 2])", options: { ColorFunction: '"Magma"' } },
};

const entries = readEntries(new URL("../../formats/reference", import.meta.url));
const declared = (head: string): string[] => [...(entries.find((e) => e.name === head)?.options ?? [])];

const ce = declaredEngine();
const callWith = (call: string, option?: string, value?: string): string =>
  option === undefined ? call : `${call.slice(0, -1)}, ${option} -> ${value})`;
const lowered = (text: string): { box: string; issues: string[] } => {
  const { json } = parseExpression(text, { ce });
  return {
    box: JSON.stringify(boxOfExample(ce, json as never)),
    issues: optionIssuesOf(plainJson(json as never) as never),
  };
};

test.each(Object.keys(PROBES))("%s: every declared option has a probe, and every probe is declared", (head) => {
  expect(Object.keys(PROBES[head]!.options).toSorted(), head).toEqual(declared(head).toSorted());
});

test.each(
  Object.entries(PROBES).flatMap(([head, probe]) =>
    Object.entries(probe.options).map(([o, v]) => [head, o, v, probe.call] as const),
  ),
)("%s: %s changes the box or is reported", (head, option, value, call) => {
  const without = lowered(call);
  const set = lowered(callWith(call, option, value));
  const reported = set.issues.some((issue) => issue.startsWith(`${option} ->`));
  expect(reported || set.box !== without.box, `${head}: ${option} -> ${value} does nothing`).toBe(true);
});
