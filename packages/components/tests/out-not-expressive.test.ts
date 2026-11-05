// @vitest-environment happy-dom
// An `<notatio-out>` shows a value; it does not stand for one. A scope (`<dynamic-module-box>`) adopts
// each child that has an `expression` as an argument and moves it out of the page, so an Out written
// inline in its prose vanished (S#10) -- it must not look expressive.

import { expect, test } from "vite-plus/test";
import { isExpressive } from "../src/generic.ts";

test("an Out is not an expressive element, so a scope leaves it in its prose", async () => {
  await import("../src/notatio-out.ts");
  const out = document.createElement("notatio-out");
  out.setAttribute("inline", "");
  out.setAttribute("format", "latex");
  out.setAttribute("value", "e_1");
  expect(customElements.get("notatio-out")).toBeDefined();
  expect(isExpressive(out)).toBe(false);
});
