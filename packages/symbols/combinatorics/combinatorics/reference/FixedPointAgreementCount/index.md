---
name: FixedPointAgreementCount
domain: Permutation statistics
signature: FixedPointAgreementCount(p)
summary: The permutations s of the same size such that p composed with s has as many fixed points as p.
catalog:
  - system: findstat
    identity: St001528
    url: https://www.findstat.org/St001528
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: FixedPointAgreementCount(p)
    description: The permutations s of the same size such that p composed with s has as many fixed points as p.
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- s agrees with the inverse of p in exactly the fixed points' number of places, which counts as the choices of those places times the derangements of the rest.
