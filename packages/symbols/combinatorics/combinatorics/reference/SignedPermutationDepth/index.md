---
name: SignedPermutationDepth
domain: Signed permutation statistics
signature: SignedPermutationDepth(signedPermutation)
summary: The sum of p(i) - i over the entries p(i) > i, plus the absolute values of the negative entries, plus half the odd blocks less the negative entries.
catalog:
  - system: findstat
    identity: St001894
    url: https://www.findstat.org/St001894
    on: SignedPermutation
statOn:
  - SignedPermutation
signatures:
  - call: SignedPermutationDepth(signedPermutation)
    description: The sum of p(i) - i over the entries p(i) > i, plus the absolute values of the negative entries, plus half the odd blocks less the negative entries.
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001894. The odd blocks and the negative entries have the same parity, so the half is an integer.
