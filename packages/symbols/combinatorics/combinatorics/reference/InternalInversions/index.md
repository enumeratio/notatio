---
name: InternalInversions
domain: Binary word statistics
signature: InternalInversions(word)
summary: The pairs i < j with w(i) > w(j) that lie in the same block of the sorted word.
catalog:
  - system: findstat
    identity: St000921
    url: https://www.findstat.org/St000921
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: InternalInversions(word)
    description: The pairs i < j with w(i) > w(j) that lie in the same block of the sorted word.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000921. The sorted word is the zeros then the ones, so a pair is internal when both positions are among the first z or both after.
