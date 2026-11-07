---
name: PrefixExchangeDistance
domain: Permutation statistics
signature: PrefixExchangeDistance(p)
summary: "The star transpositions (1 i) needed to sort p: the moved points, plus the nontrivial cycles, less two when 1 is moved."
catalog:
  - system: findstat
    identity: St001077
    url: https://www.findstat.org/St001077
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: PrefixExchangeDistance(p)
    description: "The star transpositions (1 i) needed to sort p: the moved points, plus the nontrivial cycles, less two when 1 is moved."
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
