---
name: MaximalComplexityFactorLength
domain: Binary word statistics
signature: MaximalComplexityFactorLength(word)
summary: The largest length of a factor at which the number of distinct factors is greatest.
catalog:
  - system: findstat
    identity: St000519
    url: https://www.findstat.org/St000519
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: MaximalComplexityFactorLength(word)
    description: The largest length of a factor at which the number of distinct factors is greatest.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000519, the largest length at which the subword complexity is greatest, over the lengths 0 .. n - 1.
