/**
 * Canonical English status values used in Supabase:
 * - "pending"  (Em aberto)
 * - "upcoming" (A vencer)
 * - "overdue"  (Vencido)
 * - "paid"     (Pago / Pagamento concluído)
 */

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

/** Compute the unpaid status based on a date string vs today. */
export const computeUnpaidStatus = (dateStr: string): string => {
  const todayStr = new Date().toISOString().split("T")[0];
  if (dateStr > todayStr) return "upcoming";
  if (dateStr < todayStr) return "overdue";
  return "pending";
};
