---
name: AmbientCubeSize
domain: Plane partition statistics
signature: AmbientCubeSize(planePartition)
summary: "The side of the smallest cube that holds the array: the most of its rows, its columns and its largest entry."
catalog:
  - system: findstat
    identity: St001920
    url: https://www.findstat.org/St001920
    on: PlanePartition
statOn:
  - PlanePartition
signatures:
  - call: AmbientCubeSize(planePartition)
    description: "The side of the smallest cube that holds the array: the most of its rows, its columns and its largest entry."
    library: enumeratio-combinatorics
    type: (plane_partition) -> number
---

- Defined over `PlanePartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `PlanePartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001920.
