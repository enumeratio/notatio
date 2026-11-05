---
name: MaximalFirstExtensionWithRegularModule
domain: Dyck path statistics
signature: MaximalFirstExtensionWithRegularModule(path)
summary: The greatest dimension of the first extensions of an indecomposable module by the regular module.
catalog:
  - system: findstat
    identity: St001210
    url: https://www.findstat.org/St001210
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: MaximalFirstExtensionWithRegularModule(path)
    description: The greatest dimension of the first extensions of an indecomposable module by the regular module.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001210, over the pairs (v, y) of an indecomposable module as one list: a nested maximum would not evaluate.
