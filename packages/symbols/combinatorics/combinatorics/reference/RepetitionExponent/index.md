---
name: RepetitionExponent
domain: Binary word statistics
signature: RepetitionExponent(word)
summary: The largest e such that the word is e copies of one word.
catalog:
  - system: findstat
    identity: St000627
    url: https://www.findstat.org/St000627
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: RepetitionExponent(word)
    description: The largest e such that the word is e copies of one word.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000627, also called the frequency. The word is copies of a word of length q when q divides n and the first n - q letters are the last n - q.
