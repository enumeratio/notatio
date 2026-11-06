---
name: FlagWeakExcedance
domain: Signed permutation statistics
signature: FlagWeakExcedance(signedPermutation)
summary: Twice the weak excedances plus the negative entries.
catalog:
  - system: findstat
    identity: St001817
    url: https://www.findstat.org/St001817
    on: SignedPermutation
statOn:
  - SignedPermutation
signatures:
  - call: FlagWeakExcedance(p)
    description: Twice the weak excedances plus the negative entries.
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001817. A weak excedance is an entry p(i) >= i.
