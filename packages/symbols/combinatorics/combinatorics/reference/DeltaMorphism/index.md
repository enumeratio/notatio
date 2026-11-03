---
name: DeltaMorphism
domain: Combinatorial maps
signature: DeltaMorphism(IntegerComposition)
summary: The lengths of the maximal runs of equal parts, left to right.
catalog:
  - system: findstat
    identity: Mp00133
    url: https://www.findstat.org/Mp00133
    on: IntegerComposition
mapOn:
  - IntegerComposition
signatures:
  - call: DeltaMorphism(IntegerComposition)
    description: The lengths of the maximal runs of equal parts, left to right.
    library: enumeratio-combinatorics
    type: (composition) -> composition
---

- Takes a `IntegerComposition` and returns a `IntegerComposition` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00133. Lossy: the parts' values are forgotten. RunComposition is the same on a binary word.
