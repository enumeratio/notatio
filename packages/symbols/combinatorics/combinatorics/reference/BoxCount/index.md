---
name: BoxCount
domain: Plane partition statistics
signature: BoxCount(planePartition)
summary: "The number of boxes: the sum of the entries."
catalog:
  - system: findstat
    identity: St001422
    url: https://www.findstat.org/St001422
    on: PlanePartition
statOn:
  - PlanePartition
signatures:
  - call: BoxCount(planePartition)
    description: "The number of boxes: the sum of the entries."
    library: enumeratio-combinatorics
    type: (plane_partition) -> number
---

- Defined over `PlanePartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `PlanePartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001422.
