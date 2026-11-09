---
name: OnesToLeading
domain: Combinatorial maps
signature: OnesToLeading(Permutation)
summary: The Foata–Riordan Prüfer code of the permutation's tree, with 0 in front and cyclically shifted so that no entry is 0.
catalog:
  - system: findstat
    identity: Mp00299
    url: https://www.findstat.org/Mp00299
    on: ParkingFunction
  - system: findstat
    identity: Mp00325
    url: https://www.findstat.org/Mp00325
    on: Permutation
mapOn:
  - ParkingFunction
  - Permutation
signatures:
  - call: OnesToLeading(Permutation)
    description: The Foata–Riordan Prüfer code of the permutation's tree, with 0 in front and cyclically shifted so that no entry is 0.
    library: enumeratio-combinatorics
    type: ((parking_function) -> parking_function) & ((permutation) -> permutation)
---

- Takes a `Permutation` and returns a `Permutation` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00325, a bijection: OnesToLeading on the parking functions that are permutations.
- Also takes a `ParkingFunction`, returning a `ParkingFunction`: The Foata–Riordan Prüfer code of the parking function's tree, with 0 in front and cyclically shifted into a parking function.
- FindStat's Mp00299. A bijection sending the number of ones to the number of occurrences of the first entry; the inverse is LeadingToOnes.
