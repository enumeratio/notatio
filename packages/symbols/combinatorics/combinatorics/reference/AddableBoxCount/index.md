---
name: AddableBoxCount
domain: Plane partition statistics
signature: AddableBoxCount(planePartition)
summary: "The boxes that can be added to give a plane partition: one past the end of each row, one in a new row, and each cell lower than its left and upper neighbors."
catalog:
  - system: findstat
    identity: St001921
    url: https://www.findstat.org/St001921
    on: PlanePartition
statOn:
  - PlanePartition
signatures:
  - call: AddableBoxCount(planePartition)
    description: "The boxes that can be added to give a plane partition: one past the end of each row, one in a new row, and each cell lower than its left and upper neighbors."
    library: enumeratio-combinatorics
    type: (plane_partition) -> number
---

- Defined over `PlanePartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `PlanePartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001921. A cell can take a box when its entry is below its left neighbor's and its upper neighbor's, the first column and row having no such neighbor; so can the cell past the end of each row and the first of a new row. The empty plane partition has the one corner.
