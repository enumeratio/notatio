---
name: CriticalStepCount
domain: Binary word statistics
signature: CriticalStepCount(word)
summary: The critical steps l + m in the Catalan factorization (D 0)^l D (1 D)^m.
catalog:
  - system: findstat
    identity: St000885
    url: https://www.findstat.org/St000885
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: CriticalStepCount(word)
    description: The critical steps l + m in the Catalan factorization (D 0)^l D (1 D)^m.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000885. The word ends at height m - l, and l is the least height reached below 0.
