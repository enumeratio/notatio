---
name: UniqueFactorLength
domain: Binary word statistics
signature: UniqueFactorLength(word)
summary: The least length for which all factors of that length are different.
catalog:
  - system: findstat
    identity: St000922
    url: https://www.findstat.org/St000922
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: UniqueFactorLength(word)
    description: The least length for which all factors of that length are different.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000922.
