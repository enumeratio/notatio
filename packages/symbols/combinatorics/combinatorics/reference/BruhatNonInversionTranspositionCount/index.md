---
name: BruhatNonInversionTranspositionCount
domain: Permutation statistics
signature: BruhatNonInversionTranspositionCount(p)
summary: Transpositions at most p in Bruhat order that are not inversions of p.
catalog:
  - system: findstat
    identity: St001559
    url: https://www.findstat.org/St001559
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: BruhatNonInversionTranspositionCount(p)
    description: Transpositions at most p in Bruhat order that are not inversions of p.
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Zero exactly when p is smooth, avoiding 4231 and 3412.
