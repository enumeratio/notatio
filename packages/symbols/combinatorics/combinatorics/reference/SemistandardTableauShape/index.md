---
name: SemistandardTableauShape
domain: Combinatorial maps
signature: SemistandardTableauShape(SemistandardTableau)
summary: "The shape of a semistandard tableau: its row lengths."
catalog:
  - system: findstat
    identity: Mp00077
    url: https://www.findstat.org/Mp00077
    on: SemistandardTableau
mapOn:
  - SemistandardTableau
signatures:
  - call: SemistandardTableauShape(SemistandardTableau)
    description: "The shape of a semistandard tableau: its row lengths."
    library: enumeratio-combinatorics
    type: (semistandard_tableau) -> integer_partition
---

- Takes a `SemistandardTableau` and returns a `IntegerPartition` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00077.
