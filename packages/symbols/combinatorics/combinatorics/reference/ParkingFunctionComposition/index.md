---
name: ParkingFunctionComposition
domain: Combinatorial maps
signature: ParkingFunctionComposition(ParkingFunction)
summary: The entries read as the parts of an integer composition.
catalog:
  - system: findstat
    identity: Mp00319
    url: https://www.findstat.org/Mp00319
    on: ParkingFunction
mapOn:
  - ParkingFunction
signatures:
  - call: ParkingFunctionComposition(ParkingFunction)
    description: The entries read as the parts of an integer composition.
    library: enumeratio-combinatorics
    type: (parking_function) -> composition
---

- Takes a `ParkingFunction` and returns a `IntegerComposition` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00319. Injective.
