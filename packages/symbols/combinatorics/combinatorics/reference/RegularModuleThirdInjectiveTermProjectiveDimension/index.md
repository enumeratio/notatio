---
name: RegularModuleThirdInjectiveTermProjectiveDimension
domain: Dyck path statistics
signature: RegularModuleThirdInjectiveTermProjectiveDimension(path)
summary: The greatest projective dimension of the third term of the minimal injective coresolution of an indecomposable projective module.
catalog:
  - system: findstat
    identity: St001275
    url: https://www.findstat.org/St001275
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001275, which calls this the second term; see RegularModuleSecondInjectiveTermProjectiveDimension.
