---
name: FirstOnePositionAfterAppendedOne
domain: Binary word statistics
signature: FirstOnePositionAfterAppendedOne(word)
summary: "The position of the first 1 once a 1 is appended to the word: one more than the leading zeros."
catalog:
  - system: findstat
    identity: St000326
    url: https://www.findstat.org/St000326
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: FirstOnePositionAfterAppendedOne(word)
    description: "The position of the first 1 once a 1 is appended to the word: one more than the leading zeros."
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
