import { expect, test } from "vite-plus/test";
import { COMPILED_FAMILIES } from "../src/families/compiled-families.generated.js";
import { kSubsetsFamily, subsetsFamily } from "../src/families/core.ts";
import { familyHash } from "../src/families/epsil.ts";

// `Subsets(n)` and `KSubsets(n, k)` rows are read through the families `declareCallForms` builds its kernels
// from. Generated code is found by the definition's hash, so a copy that differs from the declared family
// misses it, and every row is compiled or interpreted afresh.
test("the subset call forms read the declared families, whose generated code is current", () => {
  for (const family of [subsetsFamily, kSubsetsFamily])
    expect(COMPILED_FAMILIES[family.head]?.hash, family.head).toBe(familyHash(family));
});
