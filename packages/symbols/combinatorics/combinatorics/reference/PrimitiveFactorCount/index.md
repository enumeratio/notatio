---
name: PrimitiveFactorCount
domain: Binary word statistics
signature: PrimitiveFactorCount(word)
summary: The distinct nonempty factors that are not a power of a shorter word.
signatures:
  - call: PrimitiveFactorCount(word)
    description: The distinct nonempty factors that are not a power of a shorter word.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
catalog:
  - system: findstat
    identity: St001838
    url: https://www.findstat.org/St001838
    on: BinaryWord
statOn:
  - BinaryWord
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001838.
