// Spec 031, R4 — line diff for the AI proposal panel. A ~40-line LCS keeps
// the bundle free of a diff dependency: the fields under review are short
// spec sections, tasks and notes, never whole files.

export interface DiffRow {
  type: "same" | "add" | "del";
  text: string;
}

/** Line-level diff between the current field text and the proposed one. */
export function diffLines(current: string, proposed: string): DiffRow[] {
  const a = current === "" ? [] : current.split("\n");
  const b = proposed === "" ? [] : proposed.split("\n");

  // LCS table (small inputs: fields, not files).
  const m = a.length;
  const n = b.length;
  const lcs: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      rows.push({ type: "same", text: a[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      rows.push({ type: "del", text: a[i] });
      i++;
    } else {
      rows.push({ type: "add", text: b[j] });
      j++;
    }
  }
  while (i < m) rows.push({ type: "del", text: a[i++] });
  while (j < n) rows.push({ type: "add", text: b[j++] });
  return rows;
}
