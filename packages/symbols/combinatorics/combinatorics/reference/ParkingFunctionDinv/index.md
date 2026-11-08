---
name: ParkingFunctionDinv
domain: Parking function statistics
signature: ParkingFunctionDinv(parkingFunction)
summary: The primary and the secondary dinversion pairs.
catalog:
  - system: findstat
    identity: St000136
    url: https://www.findstat.org/St000136
    on: ParkingFunction
statOn:
  - ParkingFunction
signatures:
  - call: ParkingFunctionDinv(parkingFunction)
    description: The primary and the secondary dinversion pairs.
    library: enumeratio-combinatorics
    type: (parking_function) -> number
---

- Defined over `ParkingFunction` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `ParkingFunction` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000136, Haglund's dinv of the labeled Dyck path. Not Dinv, which reads a Dyck path without its labels.
