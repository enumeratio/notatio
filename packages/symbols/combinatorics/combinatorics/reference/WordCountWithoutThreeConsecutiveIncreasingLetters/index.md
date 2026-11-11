---
name: WordCountWithoutThreeConsecutiveIncreasingLetters
domain: Partition statistics
signature: WordCountWithoutThreeConsecutiveIncreasingLetters(partition)
summary: The words in which letter i occurs as many times as part i that have no three consecutive letters in increasing order.
catalog:
  - system: findstat
    identity: St001103
    url: https://www.findstat.org/St001103
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: WordCountWithoutThreeConsecutiveIncreasingLetters(partition)
    description: The words in which letter i occurs as many times as part i that have no three consecutive letters in increasing order.
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
