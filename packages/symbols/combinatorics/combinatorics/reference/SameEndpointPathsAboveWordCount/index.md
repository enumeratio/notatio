---
name: SameEndpointPathsAboveWordCount
domain: Binary word statistics
signature: SameEndpointPathsAboveWordCount(word)
summary: The paths with the word's number of ones and zeros that stay weakly above the path the word gives.
signatures:
  - call: SameEndpointPathsAboveWordCount(word)
    description: The paths with the word's number of ones and zeros that stay weakly above the path the word gives.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
catalog:
  - system: findstat
    identity: St001313
    url: https://www.findstat.org/St001313
    on: BinaryWord
statOn:
  - BinaryWord
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001313, the count of St001365 that end where the word does: ahead by 0 steps up.
