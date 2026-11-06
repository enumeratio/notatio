---
name: LatticePathsAboveWordCount
domain: Binary word statistics
signature: LatticePathsAboveWordCount(word)
summary: The paths of the word's length, ending anywhere, that stay weakly above the path the word gives.
signatures:
  - call: LatticePathsAboveWordCount(word)
    description: The paths of the word's length, ending anywhere, that stay weakly above the path the word gives.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
catalog:
  - system: findstat
    identity: St001365
    url: https://www.findstat.org/St001365
    on: BinaryWord
statOn:
  - BinaryWord
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001365. A 1 is a step up and a 0 a step across; a path is above when it has made at least as many steps up after every step. The fold counts the paths by how many steps up they are ahead.
