// See ./types.ts: the bindings rule lives in `@notatio/entry`, so every package
// holding entries can enforce it over its own.
export { checkImplementations, type Exists, type Problem } from "@notatio/entry";
