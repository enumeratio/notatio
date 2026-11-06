---
name: CarPermutation
domain: Combinatorial maps
signature: CarPermutation(ParkingFunction)
summary: Spot j holds the car that parks there, each car taking the first free spot at or after its preference.
laws:
  - graded:
      from: ParkingFunctions
      to: Permutations
    on: parking_function
catalog:
  - system: findstat
    identity: Mp00053
    url: https://www.findstat.org/Mp00053
    on: ParkingFunction
mapOn:
  - ParkingFunction
signatures:
  - call: CarPermutation(ParkingFunction)
    description: Spot j holds the car that parks there, each car taking the first free spot at or after its preference.
    library: enumeratio-combinatorics
    type: (parking_function) -> permutation
---

- Takes a `ParkingFunction` and returns a `Permutation` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00053, Sage's cars_permutation. A surjection.
