---
name: DistinctCubeCount
domain: Binary word statistics
signature: DistinctCubeCount(word)
summary: The distinct nonempty words u with uuu a factor.
catalog:
  - system: findstat
    identity: St001423
    url: https://www.findstat.org/St001423
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: DistinctCubeCount(word)
    description: The distinct nonempty words u with uuu a factor.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001423.
