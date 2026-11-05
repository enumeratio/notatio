---
name: TypeBInversionCount
domain: Permutation statistics
signature: TypeBInversionCount(p)
summary: Pairs i < j with p(i) > p(j), plus pairs i <= j with -p(i) > p(j).
catalog:
  - system: findstat
    identity: St001428
    url: https://www.findstat.org/St001428
    on: SignedPermutation
statOn:
  - SignedPermutation
signatures:
  - call: TypeBInversionCount(p)
    description: Pairs i < j with p(i) > p(j), plus pairs i <= j with -p(i) > p(j).
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The Coxeter length in type B (FindStat St001428).
