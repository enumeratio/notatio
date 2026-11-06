---
name: DistinctSquareCount
domain: Binary word statistics
signature: DistinctSquareCount(word)
summary: The distinct nonempty words u with uu a factor.
catalog:
  - system: findstat
    identity: St001424
    url: https://www.findstat.org/St001424
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: DistinctSquareCount(word)
    description: The distinct nonempty words u with uu a factor.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001424.
