---
name: SymmetricBorderLength
domain: Binary word statistics
signature: SymmetricBorderLength(word)
summary: The length of the longest prefix whose reverse is a suffix.
catalog:
  - system: findstat
    identity: St000296
    url: https://www.findstat.org/St000296
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: SymmetricBorderLength(word)
    description: The length of the longest prefix whose reverse is a suffix.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000296. The longest prefix that is a suffix read backwards is the run of leading positions i with w(i) = w(n + 1 - i).
