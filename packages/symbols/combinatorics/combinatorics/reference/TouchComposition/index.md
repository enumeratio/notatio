---
name: TouchComposition
domain: Combinatorial maps
signature: TouchComposition(DyckPath)
summary: The semilengths of the primitive pieces between a path's returns to the diagonal.
catalog:
  - system: findstat
    identity: Mp00100
    url: https://www.findstat.org/Mp00100
    on: DyckPath
  - system: findstat
    identity: Mp00057
    url: https://www.findstat.org/Mp00057
    on: ParkingFunction
mapOn:
  - DyckPath
  - ParkingFunction
signatures:
  - call: TouchComposition(DyckPath)
    description: The semilengths of the primitive pieces between a path's returns to the diagonal.
    library: enumeratio-combinatorics
    type: ((dyck_path) -> composition) & ((parking_function) -> composition)
laws:
  - surjection
  - graded:
      from: DyckPaths
      to: IntegerCompositions
    on: dyck_path
  - graded:
      from: ParkingFunctions
      to: IntegerCompositions
    on: parking_function
---

- Takes a `DyckPath` and returns a `IntegerComposition` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- Also takes a `ParkingFunction`, returning a `IntegerComposition`: The touch composition of the parking function's support Dyck path.
- FindStat's Mp00057. The support path returns to the diagonal at the positions k whose k-th smallest entry is k, so the parts are the gaps between those positions.
