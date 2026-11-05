---
name: HaglundHag
domain: Permutation statistics
signature: HaglundHag(p)
summary: The excedance tops less their positions, plus the inversions among the excedance tops less those among the rest, plus the pairs k < i, over excedances i, with p(k) <= i.
catalog:
  - system: findstat
    identity: St001671
    url: https://www.findstat.org/St001671
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: HaglundHag(p)
    description: The excedance tops less their positions, plus the inversions among the excedance tops less those among the rest, plus the pairs k < i, over excedances i, with p(k) <= i.
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The inversions are within the subwords, as in Denert.
