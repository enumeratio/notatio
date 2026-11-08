---
name: SparreAndersenPositiveCount
domain: Signed permutation statistics
signature: SparreAndersenPositiveCount(signedPermutation)
summary: The steps at which the walk x_t = sum of 2^(|p(s)| - 1) sign(p(|p(s)|)) over s <= t is positive.
catalog:
  - system: findstat
    identity: St001927
    url: https://www.findstat.org/St001927
    on: SignedPermutation
statOn:
  - SignedPermutation
signatures:
  - call: SparreAndersenPositiveCount(signedPermutation)
    description: The steps at which the walk x_t = sum of 2^(|p(s)| - 1) sign(p(|p(s)|)) over s <= t is positive.
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001927. The walk is read as the list w of its values, doubled and raised by 2^(n + 1).
