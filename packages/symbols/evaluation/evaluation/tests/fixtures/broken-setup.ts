// A setup module whose configure raises: the worker must answer an error, not die.
export function configure(): void {
  throw new Error("setup could not declare its heads");
}
