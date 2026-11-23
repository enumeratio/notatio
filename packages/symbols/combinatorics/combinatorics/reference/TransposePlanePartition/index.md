---
name: TransposePlanePartition
domain: Combinatorial maps
signature: TransposePlanePartition(PlanePartition)
summary: "The transpose of a plane partition: rows and columns of the array exchanged."
catalog:
  - system: findstat
    identity: Mp00177
    url: https://www.findstat.org/Mp00177
    on: PlanePartition
mapOn:
  - PlanePartition
signatures:
  - call: TransposePlanePartition(PlanePartition)
    description: "The transpose of a plane partition: rows and columns of the array exchanged."
    library: enumeratio-combinatorics
    type: (plane_partition) -> plane_partition
---

- Takes a `PlanePartition` and returns a `PlanePartition` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00177, an involution.
