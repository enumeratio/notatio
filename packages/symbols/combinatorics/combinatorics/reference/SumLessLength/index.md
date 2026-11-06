---
name: SumLessLength
domain: Parking function statistics
signature: SumLessLength(parkingFunction)
summary: The sum of the preferences less their number.
catalog:
  - system: findstat
    identity: St000540
    url: https://www.findstat.org/St000540
    on: ParkingFunction
statOn:
  - ParkingFunction
signatures:
  - call: SumLessLength(parkingFunction)
    description: The sum of the preferences less their number.
    library: enumeratio-combinatorics
    type: (parking_function) -> number
---

- Defined over `ParkingFunction` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `ParkingFunction` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000540.
