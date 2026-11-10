---
name: AlternatingSubsetBreakCount
domain: Permutation statistics
signature: AlternatingSubsetBreakCount(p)
summary: The subsets of 1 .. n alternating in parity whose image under p is not.
catalog:
  - system: findstat
    identity: St001639
    url: https://www.findstat.org/St001639
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: AlternatingSubsetBreakCount(p)
    description: The subsets of 1 .. n alternating in parity whose image under p is not.
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
