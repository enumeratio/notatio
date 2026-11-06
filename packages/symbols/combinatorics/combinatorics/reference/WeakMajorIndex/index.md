---
name: WeakMajorIndex
domain: Composition statistics
signature: WeakMajorIndex(composition)
summary: The sum of the positions i with c(i) >= c(i+1).
catalog:
  - system: findstat
    identity: St001931
    url: https://www.findstat.org/St001931
    on: IntegerComposition
  - system: findstat
    identity: St001930
    url: https://www.findstat.org/St001930
    on: BinaryWord
statOn:
  - BinaryWord
  - IntegerComposition
signatures:
  - call: WeakMajorIndex(composition)
    description: The sum of the positions i with c(i) >= c(i+1).
    library: enumeratio-combinatorics
    type: (binary_word | composition | list<integer>) -> number
---

- Defined over `IntegerComposition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerComposition`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
- Reads the composition as a word, so it stands on a bare list too.
