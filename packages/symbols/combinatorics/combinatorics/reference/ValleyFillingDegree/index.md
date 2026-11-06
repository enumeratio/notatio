---
name: ValleyFillingDegree
domain: Binary word statistics
signature: ValleyFillingDegree(word)
summary: The number of times every valley 01 must be swapped for a peak 10, and a trailing 0 made a 1, to leave no zeros.
signatures:
  - call: ValleyFillingDegree(word)
    description: The number of times every valley 01 must be swapped for a peak 10, and a trailing 0 made a 1, to leave no zeros.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
catalog:
  - system: findstat
    identity: St001721
    url: https://www.findstat.org/St001721
    on: BinaryWord
statOn:
  - BinaryWord
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001721.
