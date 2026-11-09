---
name: LeadingToOnes
domain: Combinatorial maps
signature: LeadingToOnes(ParkingFunction)
summary: The parking function whose Prüfer code is the entries less the first, mod n + 1, taken back through the Foata–Riordan map.
catalog:
  - system: findstat
    identity: Mp00300
    url: https://www.findstat.org/Mp00300
    on: ParkingFunction
mapOn:
  - ParkingFunction
signatures:
  - call: LeadingToOnes(ParkingFunction)
    description: The parking function whose Prüfer code is the entries less the first, mod n + 1, taken back through the Foata–Riordan map.
    library: enumeratio-combinatorics
    type: (parking_function) -> parking_function
---

- Takes a `ParkingFunction` and returns a `ParkingFunction` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00300, the inverse of OnesToLeading.
