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

test("a symbol or number has no elements to read", () => {
  for (const atom of ["xs", 3]) expect(collectionElements(ce.box(atom as never))).toBeUndefined();
});

test("a lazy collection over an unknown symbol is not listed", () => {
  expect(collectionElements(ce.box(["Take", "xs", 3]))).toBeUndefined();
  expect(collectionElements(ce.box(["Map", ["Function", ["Multiply", "x", 2], "x"], "xs"]))).toBeUndefined();
  expect(collectionElements(ce.box(["Take", ["List", 1, 2, 3], 2]))?.map((e) => e.re)).toEqual([1, 2]);
});

test("a walk that disagrees with the collection's own count declines", () => {
  const short = {
    isCollection: true,
    isFiniteCollection: true,
    count: 3,
    *each() {
      yield ce.One;
    },
  };
  expect(collectionElements(short as never)).toBeUndefined();
});
