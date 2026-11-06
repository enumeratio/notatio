---
name: DescentWordPreimageCount
domain: Binary word statistics
signature: DescentWordPreimageCount(word)
summary: The permutations whose descent word is this word.
signatures:
  - call: DescentWordPreimageCount(word)
    description: The permutations whose descent word is this word.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
catalog:
  - system: findstat
    identity: St000529
    url: https://www.findstat.org/St000529
    on: BinaryWord
statOn:
  - BinaryWord
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000529, the size of the preimage of the descent word map. The word has length N - 1; the count is by inclusion-exclusion over the descents.
