---
name: DurfeeCube
domain: Plane partition statistics
signature: DurfeeCube(planePartition)
summary: "The side of the largest cube in the array: the most diagonal entries d with the d-th at least d."
catalog:
  - system: findstat
    identity: St001451
    url: https://www.findstat.org/St001451
    on: PlanePartition
statOn:
  - PlanePartition
signatures:
  - call: DurfeeCube(planePartition)
    description: "The side of the largest cube in the array: the most diagonal entries d with the d-th at least d."
    library: enumeratio-combinatorics
    type: (plane_partition) -> number
---

- Defined over `PlanePartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `PlanePartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001451, the plane partition analogue of the Durfee square. Entries down the diagonal never increase, so once one falls short of its place every later one does.
