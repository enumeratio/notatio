---
name: AtomicLength
domain: Signed permutation statistics
signature: AtomicLength(signedPermutation)
summary: The sum of the heights, in type B, of the positive roots the inverse sends to negative ones.
catalog:
  - system: findstat
    identity: St001848
    url: https://www.findstat.org/St001848
    on: SignedPermutation
statOn:
  - SignedPermutation
signatures:
  - call: AtomicLength(signedPermutation)
    description: The sum of the heights, in type B, of the positive roots the inverse sends to negative ones.
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001848, the atomic length of a Weyl group element.
