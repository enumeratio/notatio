---
name: AbsoluteOrderCoverCount
domain: Signed permutation statistics
signature: AbsoluteOrderCoverCount(signedPermutation)
summary: The reflections t, a sign change of one entry or a swap of two, possibly with both negated, whose product p t has one fewer positive cycle.
catalog:
  - system: findstat
    identity: St001858
    url: https://www.findstat.org/St001858
    on: SignedPermutation
statOn:
  - SignedPermutation
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001858. The reflection length n less the positive cycles rises by 1 exactly when the positive cycles fall by 1: the elements covering p in absolute order are the p t of one more reflection length.
