---
name: BruhatLowerCoverCount
domain: Signed permutation statistics
signature: BruhatLowerCoverCount(signedPermutation)
summary: The reflections t, a sign change of one entry or a swap of two, possibly with both negated, whose product p t is one shorter in the Coxeter length whose last generator negates the last entry.
catalog:
  - system: findstat
    identity: St001861
    url: https://www.findstat.org/St001861
    on: SignedPermutation
statOn:
  - SignedPermutation
signatures:
  - call: BruhatLowerCoverCount(signedPermutation)
    description: The reflections t, a sign change of one entry or a swap of two, possibly with both negated, whose product p t is one shorter in the Coxeter length whose last generator negates the last entry.
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001861. The lower covers of p in Bruhat order are the p t shorter by exactly 1.
