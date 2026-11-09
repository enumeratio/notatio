---
name: NonDecreasingParkingFunction
domain: Combinatorial maps
signature: NonDecreasingParkingFunction(ParkingFunction)
summary: The entries sorted into increasing order.
catalog:
  - system: findstat
    identity: Mp00052
    url: https://www.findstat.org/Mp00052
    on: ParkingFunction
mapOn:
  - ParkingFunction
signatures:
  - call: NonDecreasingParkingFunction(ParkingFunction)
    description: The entries sorted into increasing order.
    library: enumeratio-combinatorics
    type: (parking_function) -> parking_function
---

- Takes a `ParkingFunction` and returns a `ParkingFunction` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00052. Lossy: the order of the cars is forgotten.
