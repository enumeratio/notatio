---
name: NonProjectiveTorsionlessModules
domain: Dyck path statistics
signature: NonProjectiveTorsionlessModules(path)
summary: "The indecomposable non-projective modules that are torsionless: submodules of a projective module."
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001278, which also reads it as the modules fixed by tau Omega^1 composed with its inverse.
