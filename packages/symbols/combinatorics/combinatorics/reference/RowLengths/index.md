---
name: RowLengths
domain: Combinatorial maps
signature: RowLengths(SkewPartition)
summary: The number of cells in each row, from the top.
catalog:
  - system: findstat
    identity: Mp00181
    url: https://www.findstat.org/Mp00181
    on: SkewPartition
mapOn:
  - SkewPartition
signatures:
  - call: RowLengths(SkewPartition)
    description: The number of cells in each row, from the top.
    library: enumeratio-combinatorics
    type: (skew_partition) -> composition
---

- Takes a `SkewPartition` and returns a `IntegerComposition` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00181. Every row of a skew shape has a cell, so these are the parts of a composition.
