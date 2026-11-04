---
name: LabelingPermutation
domain: Combinatorial maps
signature: LabelingPermutation(ParkingFunction)
summary: "The labeling of the parking function's support Dyck path: the positions of the entries, smallest entry first and equal entries left to right."
laws:
  - graded:
      from: ParkingFunctions
      to: Permutations
    on: parking_function
catalog:
  - system: findstat
    identity: Mp00055
    url: https://www.findstat.org/Mp00055
    on: ParkingFunction
mapOn:
  - ParkingFunction
signatures:
  - call: LabelingPermutation(ParkingFunction)
    description: "The labeling of the parking function's support Dyck path: the positions of the entries, smallest entry first and equal entries left to right."
    library: enumeratio-combinatorics
    type: (parking_function) -> permutation
---

- Takes a `ParkingFunction` and returns a `Permutation` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00055, which it titles labelling permutation; Sage's standard_permutation().inverse(). A surjection.
