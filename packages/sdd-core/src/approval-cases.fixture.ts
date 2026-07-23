// Shared truth table for the ONE approval rule (spec 024, R5). Both
// `isApprovedStatus` (sdd-core, board.ts) and its builder-bundle mirror
// `isApprovedStatusText` (builder/src/sections.ts) are asserted against this
// exact table, in their own test suites. Identical inputs → identical expected
// booleans: if the two copies ever diverge, one suite goes red. This file is
// the mechanical form of the "KEEP IN SYNC" comment the mirror carries.
//
// Excluded from the tsc build (see tsconfig.json) so it never ships in dist.

export interface ApprovalCase {
  status: string;
  approved: boolean;
  /** Why this case exists — the divergence it guards against. */
  note: string;
}

export const APPROVAL_CASES: ApprovalCase[] = [
  { status: "Aprobado", approved: true, note: "canonical masculine" },
  { status: "Aprobada", approved: true, note: "feminine — the word the UI prints; the gate's old copy missed it" },
  { status: "Approved", approved: true, note: "English" },
  { status: "aprobado", approved: true, note: "case-insensitive" },
  { status: "APPROVED", approved: true, note: "upper-case" },
  { status: "Approved ", approved: true, note: "trailing space, trimmed" },
  { status: " Aprobado", approved: true, note: "leading space, trimmed" },
  { status: "Aprobado / Approved", approved: true, note: "bilingual label — substring match" },
  { status: "Pendiente", approved: false, note: "pending ES" },
  { status: "Pending", approved: false, note: "pending EN" },
  { status: "", approved: false, note: "empty" },
  { status: "No aprobado", approved: false, note: "negation ES — must NOT count as approved" },
  { status: "Not approved", approved: false, note: "negation EN" },
  { status: "Sin aprobar", approved: false, note: "negation: sin aprobar" },
  { status: "Unapproved", approved: false, note: "negation: un-approved" },
  { status: "Non approved", approved: false, note: "negation: non approved" },
  { status: "Rechazado", approved: false, note: "rejected, unrelated word" }
];
