import { expect, test } from "vite-plus/test";
import { Session } from "../src/engine.ts";
import { sampledFigure } from "../src/textual.ts";

// 2 / Csch(x) is a shape compiled code gets wrong (compute-engine 0.187): the terminal draws it interpreted.
test("a plot whose compiled code is declined still draws in the terminal", () => {
  const session = new Session();
  const box = sampledFigure(session, session.evaluate("Plot(2 / Csch(x), (x, -2, 2))").expr.json as never);
  expect(box).toBeDefined();
});
