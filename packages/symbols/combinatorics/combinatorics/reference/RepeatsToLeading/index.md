---
name: RepeatsToLeading
domain: Combinatorial maps
signature: RepeatsToLeading(ParkingFunction)
summary: Pollak's Prüfer code of the successive differences mod n + 1, behind a 0 and shifted cyclically into a parking function.
catalog:
  - system: findstat
    identity: Mp00298
    url: https://www.findstat.org/Mp00298
    on: ParkingFunction
mapOn:
  - ParkingFunction
signatures:
  - call: RepeatsToLeading(ParkingFunction)
    description: Pollak's Prüfer code of the successive differences mod n + 1, behind a 0 and shifted cyclically into a parking function.
    library: enumeratio-combinatorics
    type: (parking_function) -> parking_function
---

- Takes a `ParkingFunction` and returns a `ParkingFunction` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00298, a bijection; the inverse is LeadingToRepeats. It sends the number of repeated entries to the number of occurrences of the first entry.
