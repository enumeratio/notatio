---
name: SignedReflectionLength
domain: Permutation statistics
signature: SignedReflectionLength(p)
summary: "The least number of reflections of the hyperoctahedral group with product p: n minus the positive cycles."
signatures:
  - call: SignedReflectionLength(p)
    description: "The least number of reflections of the hyperoctahedral group with product p: n minus the positive cycles."
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
catalog:
  - system: findstat
    identity: St001769
    url: https://www.findstat.org/St001769
    on: SignedPermutation
statOn:
  - SignedPermutation
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001769. The codimension of the fixed space, which is n less the number of positive cycles. Not ReflectionLength, which counts transpositions of an unsigned permutation.
