---
name: PlanePartitionShape
domain: Combinatorial maps
signature: PlanePartitionShape(PlanePartition)
summary: "The shape of a plane partition: the row lengths of the array's support."
mapOn:
  - PlanePartition
signatures:
  - call: PlanePartitionShape(PlanePartition)
    description: "The shape of a plane partition: the row lengths of the array's support."
    library: enumeratio-combinatorics
    type: (plane_partition) -> integer_partition
---

- Takes a `PlanePartition` and returns a `IntegerPartition` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- Lossy: the entries are forgotten, only where they are nonzero stays.
