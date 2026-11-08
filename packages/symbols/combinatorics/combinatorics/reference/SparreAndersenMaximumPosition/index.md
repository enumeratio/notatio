---
name: SparreAndersenMaximumPosition
domain: Signed permutation statistics
signature: SparreAndersenMaximumPosition(signedPermutation)
summary: The last step, from 0 to n, at which the walk of SparreAndersenPositiveCount is largest.
catalog:
  - system: findstat
    identity: St001926
    url: https://www.findstat.org/St001926
    on: SignedPermutation
statOn:
  - SignedPermutation
signatures:
  - call: SparreAndersenMaximumPosition(signedPermutation)
    description: The last step, from 0 to n, at which the walk of SparreAndersenPositiveCount is largest.
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001926. The walk starts at 0, so the answer is 0 when it never rises.
