import type { Patch } from "../patch.ts";
import { replaceAllCompoundPatterns } from "../compute-engine/library/replace-all.ts";

// See replace-all.ts: `ReplaceAll` replaces a symbol or the whole expression, so
// `{x, x^2} /. x^2 -> y` comes back unchanged; Wolfram replaces every part the pattern matches.
// compute-engine#637 fixes compound rules but still applies symbol rules first, so mixed rules
// (`x + x^2 /. {x -> 2, x^2 -> y}` is y + 2 in Wolfram) keep this patch until that moves too.
export const replaceAllCompoundPatternsPatch: Patch = {
  id: "replace-all-compound-patterns",
  lands: "ReplaceAll replaces every subexpression a rule matches, top-down, mixed symbol and compound rules included",
  issue: "https://github.com/cortex-js/compute-engine/issues/636",
  pr: "https://github.com/cortex-js/compute-engine/pull/637",
  files: ["src/compute-engine/library/replace-all.ts"],
  heads: ["ReplaceAll"],

  fixed: (ce) =>
    ce
      .box(["ReplaceAll", ["List", "x", ["Power", "x", 2]], ["Rule", ["Power", "x", 2], "y"]])
      .evaluate()
      .isSame(ce.box(["List", "x", "y"])) &&
    ce
      .box([
        "ReplaceAll",
        ["Add", "x", ["Power", "x", 2]],
        ["List", ["Rule", "x", 2], ["Rule", ["Power", "x", 2], "y"]],
      ])
      .evaluate()
      .isSame(ce.box(["Add", "y", 2]).evaluate()),

  apply: (ce) => replaceAllCompoundPatterns(ce),
};
