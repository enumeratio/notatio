---
name: RulerGrundyValue
domain: Binary word statistics
signature: RulerGrundyValue(word)
summary: The exclusive or of 2^e over the 1s at positions with 2-adic valuation e.
catalog:
  - system: findstat
    identity: St000792
    url: https://www.findstat.org/St000792
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: RulerGrundyValue(word)
    description: The exclusive or of 2^e over the 1s at positions with 2-adic valuation e.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000792, the Grundy value of the game of ruler. The exclusive or of distinct powers of 2 adds them, and a power occurs when an odd number of its positions hold a 1.
