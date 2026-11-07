---
name: RegularModuleSecondInjectiveTermProjectiveDimension
domain: Dyck path statistics
signature: RegularModuleSecondInjectiveTermProjectiveDimension(path)
summary: The greatest projective dimension of the second term of the minimal injective coresolution of an indecomposable projective module.
catalog:
  - system: findstat
    identity: St001273
    url: https://www.findstat.org/St001273
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: RegularModuleSecondInjectiveTermProjectiveDimension(path)
    description: The greatest projective dimension of the second term of the minimal injective coresolution of an indecomposable projective module.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001273, which calls this the first term: its rows count the injective hull as the zeroth term, the injective hull of the first cosyzygy as the first.
