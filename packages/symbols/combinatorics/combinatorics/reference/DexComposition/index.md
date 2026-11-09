---
name: DexComposition
domain: Combinatorial maps
signature: DexComposition(Permutation)
summary: The composition cut at the descents of the word whose excedances are barred, so that they sit below every unbarred letter.
catalog:
  - system: findstat
    identity: Mp00248
    url: https://www.findstat.org/Mp00248
    on: Permutation
mapOn:
  - Permutation
signatures:
  - call: DexComposition(Permutation)
    description: The composition cut at the descents of the word whose excedances are barred, so that they sit below every unbarred letter.
    library: enumeratio-combinatorics
    type: (permutation) -> composition
---

- Takes a `Permutation` and returns a `IntegerComposition` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00248, Sage's DEX composition (Assaf's dual equivalence). Not injective.
