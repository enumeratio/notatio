---
name: ParkingMajorIndex
domain: Parking function statistics
signature: ParkingMajorIndex(parkingFunction)
summary: The sum of the passes in which the cars are taken, scanning from the last car for a spot at most the cars taken so far plus one.
catalog:
  - system: findstat
    identity: St001209
    url: https://www.findstat.org/St001209
    on: ParkingFunction
statOn:
  - ParkingFunction
signatures:
  - call: ParkingMajorIndex(parkingFunction)
    description: The sum of the passes in which the cars are taken, scanning from the last car for a spot at most the cars taken so far plus one.
    library: enumeratio-combinatorics
    type: (parking_function) -> number
---

- Defined over `ParkingFunction` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `ParkingFunction` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001209, the pmaj statistic. Each pass marks the cars it takes with the number of passes before it, and the marks add up.
