---
name: DistinctFactorCount
domain: Binary word statistics
signature: DistinctFactorCount(word)
summary: "The distinct factors, the empty one included: the subword complexity."
catalog:
  - system: findstat
    identity: St000294
    url: https://www.findstat.org/St000294
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: DistinctFactorCount(word)
    description: "The distinct factors, the empty one included: the subword complexity."
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000294.
