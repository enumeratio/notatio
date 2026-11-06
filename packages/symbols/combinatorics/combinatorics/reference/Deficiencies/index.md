---
name: Deficiencies
domain: Parking function statistics
signature: Deficiencies(parkingFunction)
summary: Positions i with p(i) < i.
catalog:
  - system: findstat
    identity: St001905
    url: https://www.findstat.org/St001905
    on: ParkingFunction
statOn:
  - ParkingFunction
signatures:
  - call: Deficiencies(parkingFunction)
    description: Positions i with p(i) < i.
    library: enumeratio-combinatorics
    type: (parking_function) -> number
---

- Defined over `ParkingFunction` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `ParkingFunction` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001905.
