// The child process of the interpreter sweep (`interpreter-sweep.ts`): one engine with every library declared
// and one bare engine, answering the parent's calls over IPC. Before each call it writes what it is about to run
// to `SWEEP_CURRENT`, synchronously, so a worker that dies (an out-of-memory abort, a kill) leaves its row named.

import { writeFileSync } from "node:fs";
import { makeExecutor, type Request } from "./interpreter-sweep.ts";

const current = process.env.SWEEP_CURRENT;
const executor = makeExecutor();

process.on("message", (request: Request) => {
  if (current !== undefined) writeFileSync(current, JSON.stringify(request));
  if (request.op === "subjects") process.send!({ id: request.id, subjects: executor.subjects(request.key) });
  else process.send!({ id: request.id, ...executor.run(request.task) });
});

// A worker outlives neither its parent nor the parent's connection.
process.on("disconnect", () => process.exit(0));

process.send!({ ready: true });
