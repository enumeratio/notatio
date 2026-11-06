---
name: FirstRowSum
domain: Plane partition statistics
signature: FirstRowSum(planePartition)
summary: The sum of the first row.
catalog:
  - system: findstat
    identity: St001456
    url: https://www.findstat.org/St001456
    on: PlanePartition
statOn:
  - PlanePartition
signatures:
  - call: FirstRowSum(planePartition)
    description: The sum of the first row.
    library: enumeratio-combinatorics
    type: (plane_partition) -> number
---

- Defined over `PlanePartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `PlanePartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001456.
