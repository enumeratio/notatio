---
name: OneRegularSimpleModules
domain: Dyck path statistics
signature: OneRegularSimpleModules(path)
summary: The simple modules of projective dimension one, grade one and one-dimensional first extension by the regular module.
catalog:
  - system: findstat
    identity: St001126
    url: https://www.findstat.org/St001126
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001126. A simple module is k-regular when its projective dimension is k, Ext^k(S, A) is one-dimensional and Ext^i(S, A) vanishes below k.
