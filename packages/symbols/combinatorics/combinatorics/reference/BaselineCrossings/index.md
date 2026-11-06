---
name: BaselineCrossings
domain: Binary word statistics
signature: BaselineCrossings(word)
summary: The times the path, a 1 a step up and a 0 a step down, crosses the baseline.
signatures:
  - call: BaselineCrossings(word)
    description: The times the path, a 1 a step up and a 0 a step down, crosses the baseline.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
catalog:
  - system: findstat
    identity: St001730
    url: https://www.findstat.org/St001730
    on: BinaryWord
statOn:
  - BinaryWord
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001730.
