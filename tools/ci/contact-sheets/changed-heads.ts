// Which reference heads' pages a change touches, from `git diff --name-only`. Pure: no files, no git.
//
// A head's record is a folder, `packages/<package>/reference/<Head>/` (or `packages/reference/entries/<Head>/`
// for compute-engine's own heads), holding `index.md`, `examples.tsv` and each kernel's
// `examples.values.<system>.tsv`. The site serves it at `/reference/symbol/<Head>/`.

/** Most heads shot in one run; a change to more is reported as capped. An examples slice changes about fifteen
 *  heads, and a WebGL head costs about a minute of SwiftShader frames on a runner (twelve took twelve minutes). */
export const MAX_HEADS = 24;

const RECORD_FILE =
  /^packages\/(?:[^/]+\/reference|reference\/entries)\/([^/]+)\/(?:index\.md|examples\.tsv|examples\.values\.[^/]+\.tsv)$/;

export interface ChangedHeads {
  /** The heads to shoot, sorted by name, at most `limit`. */
  heads: string[];
  /** How many heads changed in all. */
  total: number;
  /** True when `total` is more than `heads` holds. */
  capped: boolean;
}

/** The heads whose record files are among `paths` (repository-relative, `/` separated). */
export function changedHeads(paths: readonly string[], limit: number = MAX_HEADS): ChangedHeads {
  const names = new Set<string>();
  for (const path of paths) {
    const match = RECORD_FILE.exec(path.trim().replaceAll("\\", "/"));
    if (match) names.add(match[1]);
  }
  const all = [...names].toSorted();
  return { heads: all.slice(0, limit), total: all.length, capped: all.length > limit };
}

/** The built page's path on the site. */
export function headPath(head: string): string {
  return `/reference/symbol/${encodeURIComponent(head)}/`;
}

/** One line for the step summary saying what was selected. */
export function describeSelection(selection: ChangedHeads): string {
  if (selection.total === 0) return "No reference head's records changed.";
  const shown = `${selection.heads.length} of ${selection.total}`;
  return selection.capped
    ? `${selection.total} reference heads changed; capped, so only ${shown} are shot: ${selection.heads.join(", ")}.`
    : `${selection.total} reference head${selection.total === 1 ? "" : "s"} changed: ${selection.heads.join(", ")}.`;
}
