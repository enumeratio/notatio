---
name: SortedPartition
domain: Combinatorial maps
signature: SortedPartition(IntegerComposition)
summary: The partition a composition's parts form, sorted largest first.
catalog:
  - system: findstat
    identity: Mp00040
    url: https://www.findstat.org/Mp00040
    on: IntegerComposition
mapOn:
  - IntegerComposition
laws:
  - surjection
  - graded:
      from: IntegerCompositions
      to: IntegerPartitions
    on: composition
signatures:
  - call: SortedPartition(IntegerComposition)
    description: The partition a composition's parts form, sorted largest first.
    library: enumeratio-combinatorics
    type: (composition) -> integer_partition
---

- Takes a `IntegerComposition` and returns a `IntegerPartition` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- Lossy: the order of the parts is forgotten, so it is not a constructor overload.
