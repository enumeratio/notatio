---
name: BoxedOccurrencesOf132
domain: Permutation statistics
signature: BoxedOccurrencesOf132(p)
summary: Occurrences of 132 with no other entry positioned between the first and last and valued between the least and greatest.
catalog:
  - system: findstat
    identity: St001083
    url: https://www.findstat.org/St001083
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: BoxedOccurrencesOf132(p)
    description: Occurrences of 132 with no other entry positioned between the first and last and valued between the least and greatest.
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
