import type { Patch } from "../patch.ts";
import { replaceAllCompoundPatterns } from "../compute-engine/library/replace-all.ts";

// See replace-all.ts: `ReplaceAll` replaces a symbol or the whole expression, so
// `{x, x^2} /. x^2 -> y` comes back unchanged; Wolfram replaces every part the pattern matches.
export const replaceAllCompoundPatternsPatch: Patch = {
  id: "replace-all-compound-patterns",
  lands: "ReplaceAll replaces every subexpression a rule with a compound left side matches, top-down",
  files: ["src/compute-engine/library/replace-all.ts"],
  heads: ["ReplaceAll"],

  fixed: (ce) =>
    ce
      .box(["ReplaceAll", ["List", "x", ["Power", "x", 2]], ["Rule", ["Power", "x", 2], "y"]])
      .evaluate()
      .isSame(ce.box(["List", "x", "y"])),

  apply: (ce) => replaceAllCompoundPatterns(ce),
};
