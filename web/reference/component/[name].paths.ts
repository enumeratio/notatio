import { collectComponents } from "../../.vitepress/data/components.ts";
import { timed } from "../../.vitepress/data/timings.ts";

// One generated page per element module in @notatio/frontend, at its Vue/React name
// (`/reference/component/BarChart3D`) -- the same rule /reference/symbol/<Head> follows.
export default {
  paths: () =>
    timed("component-paths", () => collectComponents().map((component) => ({ params: { name: component.name } }))),
};
