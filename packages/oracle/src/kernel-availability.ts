/** What one wolframscript run amounts to. A kernel that never answered (the license caps concurrent
 * kernels, so another process can hold them all) is unavailable, not a wrong answer. */
export type KernelRun = { stdout: string | null; stderr?: string | null; error?: Error; timedOut?: boolean };

const KERNEL_REFUSED =
  /connection closed by wolframkernel|kernel limit|too many kernels|could not (?:start|launch|connect)|no (?:available )?kernels?|licen[cs]e/i;

export function kernelUnavailable(run: KernelRun): boolean {
  if (run.timedOut || run.error) return true;
  if (!run.stdout?.trim()) return true;
  return KERNEL_REFUSED.test(run.stdout) || KERNEL_REFUSED.test(run.stderr ?? "");
}
