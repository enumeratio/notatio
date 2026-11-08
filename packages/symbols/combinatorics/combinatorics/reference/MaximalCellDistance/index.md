---
name: MaximalCellDistance
domain: Plane partition statistics
signature: MaximalCellDistance(planePartition)
summary: "The largest sum of the coordinates of a cell: the largest of row + column + entry less 3."
catalog:
  - system: findstat
    identity: St001598
    url: https://www.findstat.org/St001598
    on: PlanePartition
statOn:
  - PlanePartition
signatures:
  - call: MaximalCellDistance(planePartition)
    description: "The largest sum of the coordinates of a cell: the largest of row + column + entry less 3."
    library: enumeratio-combinatorics
    type: (plane_partition) -> number
---

- Defined over `PlanePartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `PlanePartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001598. The cells of the plane partition are the boxes (row, column, height), counted from 0, and the empty plane partition gives 0.
