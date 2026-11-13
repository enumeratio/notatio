import { parseExpression } from "@notatio/formats/expression";
import { expect, test } from "vite-plus/test";
import { renderingOf, scopeOf } from "../src/symbols.ts";
import { type StructuralNode, structuralOf, tagOf, toVNode, vdomOf } from "../src/vdom.ts";

/** A vnode factory that keeps everything, for looking at. */
const h = (tag: string, props: Readonly<Record<string, string>>, children: readonly unknown[]) => ({
  tag,
  props,
  children,
});

test("the tag is the naming rule: notatio- plus the head, kebab-cased, or the head's box", () => {
  expect(tagOf("Plot")).toBe("notatio-plot");
  expect(tagOf("Plot3D")).toBe("notatio-plot-3d");
  expect(tagOf("Slider2D")).toBe("slider-2d-box");
  expect(tagOf("CollectionTable")).toBe("notatio-collection-table");
});

test("the structural tree is the expression verbatim: heads are tags, arguments children, atoms tokens", () => {
  const { json } = parseExpression('Binomial(n, 2, "a b", 2.5)');
  expect(toVNode(structuralOf(json), h)).toEqual({
    tag: "notatio-binomial",
    props: {},
    children: ['n 2 "a b" 2.5'],
  });
  const nested = parseExpression("Sin(x)^2 + 1").json;
  const tree = structuralOf(nested);
  expect(tree.tag).toBe("notatio-add");
  expect(tree.children?.map((c) => (typeof c === "string" ? c : c.tag))).toEqual(["notatio-power", "1"]);
  expect(structuralOf(parseExpression('"so"').json)).toEqual({
    tag: "notatio-string",
    attributes: { value: "so" },
  });
  expect(structuralOf(parseExpression("2.5").json).tag).toBe("notatio-real");
});

test("the realized tree lowers a component's arguments into props, and typesets the rest", () => {
  const plot = vdomOf(parseExpression("Plot(Sin(k * x), (x, 0, 10))").json);
  expect(plot.tag).toBe("graphics-box");
  expect(plot.attributes).toEqual({ value: "Plot(sin(k * x), (x, 0, 10))" });
  expect(plot.children).toBeUndefined();

  const scoped = vdomOf(parseExpression("Row([Slider((k, 2), (0, 5)), Dynamic(k^2)])").json);
  expect(scoped.tag).toBe("dynamic-module-box");
  const row = scoped.children?.[0];
  expect(row?.tag).toBe("row-box");
  expect(row?.attributes["data-head"]).toBe("Row");
  expect(row?.children?.map((c) => [c.tag, c.attributes])).toEqual([
    ["slider-box", { name: "k", value: "2", min: "0", max: "5" }],
    ["dynamic-box", { value: "_k ^ 2" }],
  ]);

  const plain = vdomOf(parseExpression("Binomial(n, 2)").json);
  expect(plain.tag).toBe("notatio-out");
  expect(plain.attributes.format).toBe("mathjson");
});

test("toVNode typesets a math run with the given typesetter, as innerHTML", () => {
  const leaf = { tag: "form-box", attributes: { "data-form": "TeXForm" }, text: "x^2", tex: "x^2" };
  expect(toVNode(leaf, h, (tex) => `<k>${tex}</k>`)).toEqual({
    tag: "form-box",
    props: { "data-form": "TeXForm", innerHTML: "<k>x^2</k>" },
    children: [],
  });
  expect(toVNode(leaf, h).children).toEqual(["x^2"]);
});

test("toVNode hands the tree to any h, text as a lone child", () => {
  const v = toVNode({ tag: "div", attributes: {}, children: [{ tag: "span", attributes: {}, text: "so" }] }, h);
  expect(v).toEqual({
    tag: "div",
    props: {},
    children: [{ tag: "span", props: {}, children: ["so"] }],
  });
});

test("options ride as props in the structural tree, a node-valued one as a slotted child", () => {
  const tree = structuralOf(
    parseExpression(
      'Plot(Sin(x), (x, 0, 10), PlotRange -> All, Frame -> True, Epilog -> Point((1, 0.5)), PlotLabel -> "wave", Inset -> Plot(Cos(x)))',
    ).json,
  );
  expect(tree.tag).toBe("notatio-plot");
  expect(tree.children?.slice(0, 2).map((c) => (typeof c === "string" ? c : c.tag))).toEqual([
    "notatio-sin",
    "notatio-tuple",
  ]);
  expect(tree.attributes).toEqual({
    "plot-range": "all",
    frame: "true",
    epilog: "Point((1, 0.5))",
    "plot-label": "wave",
  });
  const inset = tree.children?.find((c): c is StructuralNode => typeof c !== "string" && c.attributes.slot === "inset");
  expect(inset?.tag).toBe("notatio-plot");
});

test("controls in an expression scope it: the structural tree is a module whose readouts read the wildcard", () => {
  const { json } = parseExpression("Row([Animator(t, (0, 1, 0.25)), Dynamic(Sin(Pi * t))])");
  const tree = structuralOf(scopeOf(json));
  expect(tree.tag).toBe("dynamic-module-box");
  const find = (node: StructuralNode | string, tag: string): StructuralNode | undefined =>
    typeof node === "string"
      ? undefined
      : node.tag === tag
        ? node
        : node.children?.map((c) => find(c, tag)).find((n) => n !== undefined);
  expect(find(tree, "dynamic-box")?.attributes.value).toBe("sin(pi * _t)");
  expect(find(tree, "animator-box")).toBeDefined();
  const plain = parseExpression("Sin(Pi * t)").json;
  expect(scopeOf(plain)).toBe(plain);
});

test("a Cell's held expression rides as its Epsil value, whatever it lowers to", () => {
  const tree = structuralOf(
    parseExpression("Cell(Row([Slider((k, 2), (0, 5)), Dynamic(k^2)]), InForm -> InputForm)").json,
  );
  expect(tree.tag).toBe("notatio-cell");
  expect(tree.attributes.value).toBe(
    renderingOf(parseExpression("Cell(Row([Slider((k, 2), (0, 5)), Dynamic(k^2)]))").json)?.attributes.value,
  );
  expect(tree.attributes.value).toContain("Slider");
  expect(tree.children).toEqual([]);
});

test("a Cell's and a Show's options reach the attributes on both routes", () => {
  for (const text of [
    "Cell(1 + 1, InForm -> InputForm, OutForm -> TeXForm, Expected -> 2)",
    'Show(Plot(Sin(x), (x, 0, 1)), Caption -> "a sine")',
  ]) {
    const json = parseExpression(text).json;
    const drawn = renderingOf(json);
    const written = structuralOf(json);
    expect(written.tag).toBe(drawn?.tag);
    expect(written.attributes).toEqual(drawn?.attributes);
  }
  const cell = structuralOf(parseExpression("Cell(1 + 1, InForm -> InputForm, Expected -> 2)").json).attributes;
  expect(cell["in-form"]).toBe("input");
  expect(cell.expect).toBe("2");
  expect(cell.expected).toBeUndefined();
});
