---
name: RemovableBoxCount
domain: Plane partition statistics
signature: RemovableBoxCount(planePartition)
summary: The number of entries larger than both the entry to their right and the entry below.
catalog:
  - system: findstat
    identity: St001445
    url: https://www.findstat.org/St001445
    on: PlanePartition
statOn:
  - PlanePartition
signatures:
  - call: RemovableBoxCount(planePartition)
    description: The number of entries larger than both the entry to their right and the entry below.
    library: enumeratio-combinatorics
    type: (plane_partition) -> number
---

- Defined over `PlanePartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `PlanePartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001445. Taking one box off such an entry leaves a plane partition, and off any other does not.
