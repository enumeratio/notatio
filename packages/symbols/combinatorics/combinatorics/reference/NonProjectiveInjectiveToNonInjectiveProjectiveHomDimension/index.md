---
name: NonProjectiveInjectiveToNonInjectiveProjectiveHomDimension
domain: Dyck path statistics
signature: NonProjectiveInjectiveToNonInjectiveProjectiveHomDimension(path)
summary: The dimension of the homomorphisms from the direct sum of the non-projective indecomposable injective modules to the direct sum of the non-injective indecomposable projective modules.
catalog:
  - system: findstat
    identity: St000687
    url: https://www.findstat.org/St000687
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: NonProjectiveInjectiveToNonInjectiveProjectiveHomDimension(path)
    description: The dimension of the homomorphisms from the direct sum of the non-projective indecomposable injective modules to the direct sum of the non-injective indecomposable projective modules.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000687. A projective is injective when the projective before it is no longer than it.
