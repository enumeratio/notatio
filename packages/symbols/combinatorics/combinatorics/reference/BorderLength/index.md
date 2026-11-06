---
name: BorderLength
domain: Binary word statistics
signature: BorderLength(word)
summary: The length of the longest proper prefix that is also a suffix; 0 for none.
catalog:
  - system: findstat
    identity: St000295
    url: https://www.findstat.org/St000295
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: BorderLength(word)
    description: The length of the longest proper prefix that is also a suffix; 0 for none.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000295.
