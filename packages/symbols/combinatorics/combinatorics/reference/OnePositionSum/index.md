---
name: OnePositionSum
domain: Binary word statistics
signature: OnePositionSum(word)
summary: The sum of the positions of the ones.
catalog:
  - system: findstat
    identity: St000391
    url: https://www.findstat.org/St000391
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: OnePositionSum(word)
    description: The sum of the positions of the ones.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
