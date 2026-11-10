---
name: TableauWeight
domain: Combinatorial maps
signature: TableauWeight(SemistandardTableau)
summary: "The multiplicities of the entries, largest first: the weight, sorted."
catalog:
  - system: findstat
    identity: Mp00225
    url: https://www.findstat.org/Mp00225
    on: SemistandardTableau
mapOn:
  - SemistandardTableau
signatures:
  - call: TableauWeight(SemistandardTableau)
    description: "The multiplicities of the entries, largest first: the weight, sorted."
    library: enumeratio-combinatorics
    type: (semistandard_tableau) -> integer_partition
---

- Takes a `SemistandardTableau` and returns a `IntegerPartition` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00225. Entries that do not occur contribute nothing.
