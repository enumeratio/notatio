---
name: SignedPermutationOrder
domain: Permutation statistics
signature: SignedPermutationOrder(p)
summary: The least m >= 1 with p^m the identity, p acting on -n..n.
signatures:
  - call: SignedPermutationOrder(p)
    description: The least m >= 1 with p^m the identity, p acting on -n..n.
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
catalog:
  - system: findstat
    identity: St001555
    url: https://www.findstat.org/St001555
    on: SignedPermutation
statOn:
  - SignedPermutation
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001555. The lcm of the signed orbit lengths of 1..n: a cycle is counted twice when it is negative. Not PermutationOrder, which reads the word as an unsigned permutation.
