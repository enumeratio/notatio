---
name: OneRunCount
domain: Binary word statistics
signature: OneRunCount(word)
summary: The number of maximal runs of ones.
catalog:
  - system: findstat
    identity: St000390
    url: https://www.findstat.org/St000390
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: OneRunCount(word)
    description: The number of maximal runs of ones.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- A run starts at the first letter if it is a 1, and after each 0 followed by a 1.
