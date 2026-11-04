---
name: LeadingOnesCount
domain: Binary word statistics
signature: LeadingOnesCount(word)
summary: The number of ones before the first 0.
catalog:
  - system: findstat
    identity: St000297
    url: https://www.findstat.org/St000297
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: LeadingOnesCount(word)
    description: The number of ones before the first 0.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
