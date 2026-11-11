---
name: HorizontalStripSizes
domain: Combinatorial maps
signature: HorizontalStripSizes(StandardTableau)
summary: The sizes of the consecutive runs of entries cut where an entry is not strictly right of the one before.
catalog:
  - system: findstat
    identity: Mp00207
    url: https://www.findstat.org/Mp00207
    on: StandardTableau
mapOn:
  - StandardTableau
signatures:
  - call: HorizontalStripSizes(StandardTableau)
    description: The sizes of the consecutive runs of entries cut where an entry is not strictly right of the one before.
    library: enumeratio-combinatorics
    type: (standard_tableau) -> composition
---

- Takes a `StandardTableau` and returns a `IntegerComposition` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00207. Follows FindStat's code and data rather than the title's "minimal composition".
