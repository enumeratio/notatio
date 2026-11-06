---
name: MinimalPeriod
domain: Binary word statistics
signature: MinimalPeriod(word)
summary: The least p with w(i) = w(i + p) wherever both are letters.
catalog:
  - system: findstat
    identity: St000626
    url: https://www.findstat.org/St000626
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: MinimalPeriod(word)
    description: The least p with w(i) = w(i + p) wherever both are letters.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000626: the length less the longest border.
