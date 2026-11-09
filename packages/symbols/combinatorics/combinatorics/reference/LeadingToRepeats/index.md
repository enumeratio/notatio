---
name: LeadingToRepeats
domain: Combinatorial maps
signature: LeadingToRepeats(ParkingFunction)
summary: The running sums of the differences from the first entry, mod n + 1, shifted cyclically into a parking function.
catalog:
  - system: findstat
    identity: Mp00301
    url: https://www.findstat.org/Mp00301
    on: ParkingFunction
mapOn:
  - ParkingFunction
signatures:
  - call: LeadingToRepeats(ParkingFunction)
    description: The running sums of the differences from the first entry, mod n + 1, shifted cyclically into a parking function.
    library: enumeratio-combinatorics
    type: (parking_function) -> parking_function
---

- Takes a `ParkingFunction` and returns a `ParkingFunction` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00301, the inverse of RepeatsToLeading.
