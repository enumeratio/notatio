import { MAX_COLLECTION_ELEMENTS } from "@notatio/engine";
import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCollections } from "../src/library.ts";

// An override reads a lazy collection through collectionElements, which declines past its cap;
// the override then defers to compute-engine instead of answering for the elements it walked.
const declared = bareEngine();
declareCollections(declared);
const bare = bareEngine();

const past = ["Range", 1, MAX_COLLECTION_ELEMENTS + 1];

for (const call of [
  ["Commonest", past, 2],
  ["Partition", past, 2, 2],
] as const)
  test(`${call[0]} of a finite collection past the cap answers as compute-engine does`, () => {
    const ours = declared.box(call as never).evaluate();
    const native = bare.box(call as never).evaluate();
    expect(JSON.stringify(ours.json).slice(0, 2000)).toBe(JSON.stringify(native.json).slice(0, 2000));
  });
