/**
 * The Supabase database has a CHECK constraint that only accepts these
 * Portuguese strings for the status column:
 *   "em_aberto"            (pending / Em aberto)
 *   "a_vencer"             (upcoming / A vencer)
 *   "vencido"              (overdue / Vencido)
 *   "pagamento_concluido"  (paid / Pagamento concluído)
 *
 * Internally (UI / filters / sort) we use short English keys for convenience.
 * `toDbStatus`   converts English → Portuguese  (write path)
 * `normalizeStatus` converts Portuguese → English (read path)
 */

// ── Read path: DB → UI ─────────────────────────────────────────────
const LEGACY_MAP: Record<string, string> = {
  em_aberto: "pending",
  a_vencer: "upcoming",
  vencido: "overdue",
  pagamento_concluido: "paid",
  confirmed: "paid",
};

/** Normalizes any legacy Portuguese status value to canonical English. */
export const normalizeStatus = (status: string): string =>
  LEGACY_MAP[status] || status;

// ── Write path: UI → DB ────────────────────────────────────────────
const TO_DB_MAP: Record<string, string> = {
  pending: "em_aberto",
  upcoming: "a_vencer",
  overdue: "vencido",
  paid: "pagamento_concluido",
};

/**
 * Converts an English status key to the Portuguese string accepted by
 * the Supabase CHECK constraint.  If the value is already Portuguese
 * it is returned as-is.
 */
export const toDbStatus = (status: string): string =>
  TO_DB_MAP[status] || status;

export const STATUS_LABEL: Record<string, string> = {
  pending: "Em aberto",
  upcoming: "A vencer",
  overdue: "Vencido",
  paid: "Pagamento concluído",
};

export const getStatusLabel = (status: string): string =>
  STATUS_LABEL[normalizeStatus(status)] || status;

export const getStatusStyle = (status: string): string => {
  switch (normalizeStatus(status)) {
    case "paid":
      return "bg-primary/10 text-primary";
    case "upcoming":
      return "bg-warning/10 text-warning";
    case "overdue":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-secondary/50 text-muted-foreground";
  }
};

export const PAID_STATUSES = ["paid", "pagamento_concluido", "confirmed"] as const;
export const PENDING_STATUSES = ["pending", "upcoming", "overdue", "em_aberto", "a_vencer", "vencido"] as const;

export const isPaidStatus = (status: string): boolean =>
  PAID_STATUSES.includes(status as any) || normalizeStatus(status) === "paid";

export const isPendingStatus = (status: string): boolean =>
  !isPaidStatus(status);

/**
 * Compute the unpaid status based on a date string vs today (returns DB-ready Portuguese).
 * For new transactions, set status based on due date:
 * - Before today: vencido
 * - Today to next 5 days: a_vencer
 * - After 5 days: em_aberto
 */
export const computeUnpaidStatus = (dateStr: string): string => {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const fiveDaysFromNow = new Date(today);
  fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
  const fiveDaysFromNowStr = fiveDaysFromNow.toISOString().split("T")[0];

  if (dateStr < todayStr) return "vencido";
  if (dateStr <= fiveDaysFromNowStr) return "a_vencer";
  return "em_aberto";
};
