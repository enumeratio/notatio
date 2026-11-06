---
name: Ties
domain: Parking function statistics
signature: Ties(parkingFunction)
summary: Positions i with p(i) = p(i+1).
catalog:
  - system: findstat
    identity: St001947
    url: https://www.findstat.org/St001947
    on: ParkingFunction
statOn:
  - ParkingFunction
signatures:
  - call: Ties(parkingFunction)
    description: Positions i with p(i) = p(i+1).
    library: enumeratio-combinatorics
    type: (parking_function) -> number
---

- Defined over `ParkingFunction` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `ParkingFunction` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001947.
