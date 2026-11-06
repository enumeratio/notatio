---
name: PositiveBeforeNegativeCount
domain: Signed permutation statistics
signature: PositiveBeforeNegativeCount(signedPermutation)
summary: Twice the adjacent pairs of a positive entry followed by a negative one, plus 1 when the first entry is negative.
catalog:
  - system: findstat
    identity: St001870
    url: https://www.findstat.org/St001870
    on: SignedPermutation
statOn:
  - SignedPermutation
signatures:
  - call: PositiveBeforeNegativeCount(p)
    description: Twice the adjacent pairs of a positive entry followed by a negative one, plus 1 when the first entry is negative.
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001870 counts them in the word p(-n), ..., p(-1), p(1), ..., p(n) with p(-i) = -p(i): each adjacent pair twice, once reflected, and the pair across the middle when p(1) is negative.
