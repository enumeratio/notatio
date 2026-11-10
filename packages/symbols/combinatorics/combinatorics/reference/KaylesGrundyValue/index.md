---
name: KaylesGrundyValue
domain: Binary word statistics
signature: KaylesGrundyValue(word)
summary: The exclusive or, over the maximal runs of ones, of the Grundy values of Kayles on a row of that many pins.
catalog:
  - system: findstat
    identity: St000753
    url: https://www.findstat.org/St000753
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: KaylesGrundyValue(word)
    description: The exclusive or, over the maximal runs of ones, of the Grundy values of Kayles on a row of that many pins.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000753. The 0s are pins already down, so each run of ones is a game of its own and the values add by exclusive or, bit by bit as the parity of the runs whose value has that bit. A row's value is the least value no move leaves; Kayles values stay below 16 (they are at most 9).
