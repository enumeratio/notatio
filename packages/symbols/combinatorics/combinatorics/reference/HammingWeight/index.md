---
name: HammingWeight
domain: Binary word statistics
signature: HammingWeight(word)
summary: The number of ones.
catalog:
  - system: findstat
    identity: St000288
    url: https://www.findstat.org/St000288
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: HammingWeight(word)
    description: The number of ones.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
