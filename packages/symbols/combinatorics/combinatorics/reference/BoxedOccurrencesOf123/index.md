---
name: BoxedOccurrencesOf123
domain: Permutation statistics
signature: BoxedOccurrencesOf123(p)
summary: Occurrences of 123 with no other entry positioned between the first and last and valued between them.
catalog:
  - system: findstat
    identity: St001082
    url: https://www.findstat.org/St001082
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: BoxedOccurrencesOf123(p)
    description: Occurrences of 123 with no other entry positioned between the first and last and valued between them.
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
