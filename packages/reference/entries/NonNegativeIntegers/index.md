---
name: NonNegativeIntegers
domain: Compute engine
signature: "NonNegativeIntegers: set<integer>"
summary: The set of non-negative integers 0, 1, 2, …, a constant compute-engine declares.
signatures:
  - call: "NonNegativeIntegers: set<integer>"
    description: a constant, as compute-engine declares it
seeAlso:
  - PositiveIntegers
  - Element
catalog:
  - system: mathlib4
    identity: Nat
    url: https://leanprover-community.github.io/mathlib4_docs/Init/Prelude.html
  - system: oeis
    identity: A001477
    url: https://oeis.org/A001477
stub: engine
---
