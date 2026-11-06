---
name: FlagDenertIndex
domain: Signed permutation statistics
signature: FlagDenertIndex(signedPermutation)
summary: The negative entries plus twice the Denert index of the permutation |p(1)| ... |p(n)|.
signatures:
  - call: FlagDenertIndex(p)
    description: The negative entries plus twice the Denert index of the permutation |p(1)| ... |p(n)|.
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
catalog:
  - system: findstat
    identity: St001819
    url: https://www.findstat.org/St001819
    on: SignedPermutation
statOn:
  - SignedPermutation
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001819.
