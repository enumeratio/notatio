---
name: ReverseComplementFactorHalfLength
domain: Binary word statistics
signature: ReverseComplementFactorHalfLength(word)
summary: Half the length of the longest factor that is its own reverse complement.
signatures:
  - call: ReverseComplementFactorHalfLength(word)
    description: Half the length of the longest factor that is its own reverse complement.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
catalog:
  - system: findstat
    identity: St001420
    url: https://www.findstat.org/St001420
    on: BinaryWord
statOn:
  - BinaryWord
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001420. Such a factor has even length: its middle letter would be its own complement.
