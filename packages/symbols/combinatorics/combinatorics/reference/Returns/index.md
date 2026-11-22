---
name: Returns
domain: Dyck path statistics
signature: Returns(path)
summary: Points where the path comes back to height 0.
statOn:
  - DyckPath
signatures:
  - call: Returns(path)
    description: Points where the path comes back to height 0.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
bindings:
  - origin: mapped
    form: sage
    template: enumeratio_stat("DyckPath", $1, "Returns")
    arity: 1
    checked:
      version: "10.9"
      on: 2026-10-16
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
