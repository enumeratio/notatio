---
name: BorderCount
domain: Binary word statistics
signature: BorderCount(word)
summary: The prefixes shorter than the word that are also suffixes, the empty one included.
catalog:
  - system: findstat
    identity: St001884
    url: https://www.findstat.org/St001884
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: BorderCount(word)
    description: The prefixes shorter than the word that are also suffixes, the empty one included.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001884.
