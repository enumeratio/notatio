---
name: DecimalRepresentation
domain: Binary word statistics
signature: DecimalRepresentation(word)
summary: The word read as a binary numeral.
catalog:
  - system: findstat
    identity: St000289
    url: https://www.findstat.org/St000289
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: DecimalRepresentation(word)
    description: The word read as a binary numeral.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000289. The first letter is the most significant digit.
