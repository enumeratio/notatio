---
name: SphericalSimpleModules
domain: Dyck path statistics
signature: SphericalSimpleModules(path)
summary: The simple modules with Ext^i(S, A) zero for 0 < i < the projective dimension of S; those of projective dimension at most one count.
catalog:
  - system: findstat
    identity: St001994
    url: https://www.findstat.org/St001994
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001994.
