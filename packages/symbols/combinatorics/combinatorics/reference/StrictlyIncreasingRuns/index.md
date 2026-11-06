---
name: StrictlyIncreasingRuns
domain: Binary word statistics
signature: StrictlyIncreasingRuns(word)
summary: The maximal runs of strictly increasing letters.
catalog:
  - system: findstat
    identity: St000393
    url: https://www.findstat.org/St000393
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: StrictlyIncreasingRuns(word)
    description: The maximal runs of strictly increasing letters.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000393: one more than the weak descents.
