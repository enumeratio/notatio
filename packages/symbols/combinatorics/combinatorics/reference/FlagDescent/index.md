---
name: FlagDescent
domain: Signed permutation statistics
signature: FlagDescent(signedPermutation)
summary: Twice the descents between entries, plus 1 when the first entry is negative.
catalog:
  - system: findstat
    identity: St001893
    url: https://www.findstat.org/St001893
    on: SignedPermutation
statOn:
  - SignedPermutation
signatures:
  - call: FlagDescent(p)
    description: Twice the descents between entries, plus 1 when the first entry is negative.
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001893. The descent at 0 counts once, the others twice.
