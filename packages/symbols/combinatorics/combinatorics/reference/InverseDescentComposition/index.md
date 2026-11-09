---
name: InverseDescentComposition
domain: Combinatorial maps
signature: InverseDescentComposition(ParkingFunction)
summary: The descents composition of the inverse of the parking function's diagonal reading word.
catalog:
  - system: findstat
    identity: Mp00054
    url: https://www.findstat.org/Mp00054
    on: ParkingFunction
mapOn:
  - ParkingFunction
signatures:
  - call: InverseDescentComposition(ParkingFunction)
    description: The descents composition of the inverse of the parking function's diagonal reading word.
    library: enumeratio-combinatorics
    type: (parking_function) -> composition
---

- Takes a `ParkingFunction` and returns a `IntegerComposition` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00054, Sage's diagonal_reading_word().inverse().descents_composition(). The word reads the cars of the Dyck path by diagonal, the largest area first, and each diagonal from the top row down. A surjection.
