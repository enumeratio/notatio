// `extent` is the height of the view, not its half-width: the shader maps a pixel to
// `center + (uv - 0.5) * (extent * aspect, extent)` (E#16), so the page must say that.

import { fileURLToPath } from "node:url";
import { collectComponents } from "@enumeratio/frontend/reflect";
import { expect, test } from "vite-plus/test";

const srcDir = fileURLToPath(new URL("../src/", import.meta.url));

test("ComplexPlot's extent is documented as the view's vertical span", () => {
  const plot = collectComponents(srcDir).find((c) => c.tag === "notatio-complex-plot")!;
  const extent = plot.attributes.find((a) => a.attribute === "extent")!;
  expect(extent.description).toMatch(/height|vertical/i);
  expect(extent.description).not.toMatch(/half-width/i);
});
