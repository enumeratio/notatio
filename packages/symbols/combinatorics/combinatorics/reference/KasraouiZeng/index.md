---
name: KasraouiZeng
domain: Combinatorial maps
signature: KasraouiZeng(SetPartition)
summary: "The Kasraoui-Zeng involution: exchanges the number of crossings with the number of nestings."
laws:
  - bijection
  - involution
  - graded:
      from: SetPartitions
      to: SetPartitions
    on: set_partition
catalog:
  - system: findstat
    identity: Mp00115
    url: https://www.findstat.org/Mp00115
    on: SetPartition
  - system: findstat
    identity: Mp00116
    url: https://www.findstat.org/Mp00116
    on: PerfectMatching
mapOn:
  - PerfectMatching
  - SetPartition
signatures:
  - call: KasraouiZeng(SetPartition)
    description: "The Kasraoui-Zeng involution: exchanges the number of crossings with the number of nestings."
    library: enumeratio-combinatorics
    type: ((perfect_matching) -> perfect_matching) & ((set_partition) -> set_partition)
---

- Takes a `SetPartition` and returns a `SetPartition` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00115, defined in Kasraoui and Zeng's "Distribution of crossings, nestings and alignments of two edges in matchings and partitions".
- Also takes a `PerfectMatching`, returning a `PerfectMatching`: The Kasraoui-Zeng involution: exchanges the number of crossings with the number of nestings.
- FindStat's Mp00116, the case of Mp00115 where every block is an arc.
