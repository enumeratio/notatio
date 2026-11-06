---
name: MaximalParkingDisplacement
domain: Parking function statistics
signature: MaximalParkingDisplacement(parkingFunction)
summary: The most spots any car drives past its preferred spot.
catalog:
  - system: findstat
    identity: St000943
    url: https://www.findstat.org/St000943
    on: ParkingFunction
statOn:
  - ParkingFunction
signatures:
  - call: MaximalParkingDisplacement(parkingFunction)
    description: The most spots any car drives past its preferred spot.
    library: enumeratio-combinatorics
    type: (parking_function) -> number
---

- Defined over `ParkingFunction` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `ParkingFunction` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000943.
