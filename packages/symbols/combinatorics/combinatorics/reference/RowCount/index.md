---
name: RowCount
domain: Plane partition statistics
signature: RowCount(planePartition)
summary: The number of rows.
catalog:
  - system: findstat
    identity: St001446
    url: https://www.findstat.org/St001446
    on: PlanePartition
statOn:
  - PlanePartition
signatures:
  - call: RowCount(planePartition)
    description: The number of rows.
    library: enumeratio-combinatorics
    type: (plane_partition) -> number
---

- Defined over `PlanePartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `PlanePartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001446.
