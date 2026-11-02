---
name: SecondToLastInjectiveProjectiveDimension
domain: Dyck path statistics
signature: SecondToLastInjectiveProjectiveDimension(path)
summary: The projective dimension of the indecomposable injective module whose socle is the second-to-last simple module.
catalog:
  - system: findstat
    identity: St001217
    url: https://www.findstat.org/St001217
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: SecondToLastInjectiveProjectiveDimension(path)
    description: The projective dimension of the indecomposable injective module whose socle is the second-to-last simple module.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001217, I[n-2] with the simples numbered 0 to n-1.
