---
name: FlagExcedance
domain: Signed permutation statistics
signature: FlagExcedance(signedPermutation)
summary: Twice the excedances plus the negative entries.
catalog:
  - system: findstat
    identity: St001892
    url: https://www.findstat.org/St001892
    on: SignedPermutation
statOn:
  - SignedPermutation
signatures:
  - call: FlagExcedance(p)
    description: Twice the excedances plus the negative entries.
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001892. An excedance is an entry p(i) > i.
