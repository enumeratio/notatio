---
name: InsertionBumpsOfOne
domain: Permutation statistics
signature: InsertionBumpsOfOne(p)
summary: One more than the longest decreasing subsequence of the entries before 1.
catalog:
  - system: findstat
    identity: St001390
    url: https://www.findstat.org/St001390
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: InsertionBumpsOfOne(p)
    description: One more than the longest decreasing subsequence of the entries before 1.
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Inserting 1 bumps along the first column of the tableau built from the entries before it.
