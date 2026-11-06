---
name: LuckyCars
domain: Parking function statistics
signature: LuckyCars(parkingFunction)
summary: The cars that park in the spot they prefer.
catalog:
  - system: findstat
    identity: St000135
    url: https://www.findstat.org/St000135
    on: ParkingFunction
statOn:
  - ParkingFunction
signatures:
  - call: LuckyCars(parkingFunction)
    description: The cars that park in the spot they prefer.
    library: enumeratio-combinatorics
    type: (parking_function) -> number
---

- Defined over `ParkingFunction` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `ParkingFunction` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000135.
