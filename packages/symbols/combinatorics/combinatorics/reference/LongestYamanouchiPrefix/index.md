---
name: LongestYamanouchiPrefix
domain: Binary word statistics
signature: LongestYamanouchiPrefix(word)
summary: The length of the longest prefix in which no prefix has more ones than zeros.
catalog:
  - system: findstat
    identity: St001371
    url: https://www.findstat.org/St001371
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: LongestYamanouchiPrefix(word)
    description: The length of the longest prefix in which no prefix has more ones than zeros.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001371.
