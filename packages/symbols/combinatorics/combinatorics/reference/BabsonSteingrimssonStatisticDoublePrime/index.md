---
name: BabsonSteingrimssonStatisticDoublePrime
domain: Permutation statistics
signature: BabsonSteingrimssonStatisticDoublePrime(p)
summary: Descents plus the occurrences of the vincular patterns 1-32, 3-12 and 3-21.
catalog:
  - system: findstat
    identity: St000797
    url: https://www.findstat.org/St000797
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: BabsonSteingrimssonStatisticDoublePrime(p)
    description: Descents plus the occurrences of the vincular patterns 1-32, 3-12 and 3-21.
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
- FindStat's stat'', after Babson and Steingrimsson.
