---
name: SimplesOfDominantDimensionAtLeastThree
domain: Dyck path statistics
signature: SimplesOfDominantDimensionAtLeastThree(path)
summary: The simple modules whose dominant dimension is at least three.
catalog:
  - system: findstat
    identity: St001163
    url: https://www.findstat.org/St001163
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: SimplesOfDominantDimensionAtLeastThree(path)
    description: The simple modules whose dominant dimension is at least three.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
