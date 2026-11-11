---
name: NonProjectiveTorsionlessModules
domain: Dyck path statistics
signature: NonProjectiveTorsionlessModules(path)
summary: "The indecomposable non-projective modules that are torsionless: submodules of a projective module."
signatures:
  - call: NonProjectiveTorsionlessModules(path)
    description: "The indecomposable non-projective modules that are torsionless: submodules of a projective module."
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
catalog:
  - system: findstat
    identity: St001278
    url: https://www.findstat.org/St001278
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001278, which also reads it as the modules fixed by tau Omega^1 composed with its inverse.
