---
name: Catabolism
domain: Combinatorial maps
signature: Catabolism(StandardTableau)
summary: Remove the first row and column-insert its entries back into the rest, largest first.
catalog:
  - system: findstat
    identity: Mp00106
    url: https://www.findstat.org/Mp00106
    on: StandardTableau
  - system: findstat
    identity: Mp00107
    url: https://www.findstat.org/Mp00107
    on: SemistandardTableau
mapOn:
  - SemistandardTableau
  - StandardTableau
laws:
  - graded:
      from: StandardTableaux
      to: StandardTableaux
    on: standard_tableau
signatures:
  - call: Catabolism(StandardTableau)
    description: Remove the first row and column-insert its entries back into the rest, largest first.
    library: enumeratio-combinatorics
    type: ((semistandard_tableau) -> semistandard_tableau) & ((standard_tableau) -> standard_tableau)
---

- Takes a `StandardTableau` and returns a `StandardTableau` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00106. Not injective: a row and a column of the same size both give the row.
- Also takes a `SemistandardTableau`, returning a `SemistandardTableau`: Remove the first row and column-insert its entries back into the rest, largest first.
- FindStat's Mp00107. Not injective.
