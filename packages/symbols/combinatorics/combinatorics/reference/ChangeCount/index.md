---
name: ChangeCount
domain: Binary word statistics
signature: ChangeCount(word)
summary: The positions i where the letters i and i + 1 differ.
catalog:
  - system: findstat
    identity: St000691
    url: https://www.findstat.org/St000691
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: ChangeCount(word)
    description: The positions i where the letters i and i + 1 differ.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
