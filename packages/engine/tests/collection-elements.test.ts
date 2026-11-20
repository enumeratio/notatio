import { expect, test } from "vite-plus/test";
import { collectionElements, MAX_COLLECTION_ELEMENTS } from "../src/index.ts";
import { bareEngine } from "../src/testing.ts";

const ce = bareEngine();

test("a known-finite collection is walked through its elements, lazy ones included", () => {
  expect(collectionElements(ce.box(["Range", 1, 5]))?.map((e) => e.re)).toEqual([1, 2, 3, 4, 5]);
  expect(collectionElements(ce.box(["Range", 1, MAX_COLLECTION_ELEMENTS]))).toHaveLength(MAX_COLLECTION_ELEMENTS);
});

test("one element past the cap declines rather than answering for a prefix", () => {
  expect(collectionElements(ce.box(["Range", 1, MAX_COLLECTION_ELEMENTS + 1]))).toBeUndefined();
});

test("a collection not known to be finite is not walked", () => {
  let walked = false;
  const unknown = {
    isCollection: true,
    isFiniteCollection: undefined,
    *each() {
      walked = true;
      yield ce.One;
    },
  };
  expect(collectionElements(unknown as never)).toBeUndefined();
  expect(walked).toBe(false);
});
