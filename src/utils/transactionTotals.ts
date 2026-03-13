import { isPaidStatus, isPendingStatus } from "@/lib/statusUtils";

export type TransactionLike = {
  type: "income" | "expense";
  amount: number;
  status: string;
  category?: string | null;
  tag?: string | null;
};

// Re-export for backward compat
export { isPaidStatus, isPendingStatus };
export const PAID_STATUSES = ["paid", "pagamento_concluido", "confirmed"] as const;
export const PENDING_STATUSES = ["pending", "upcoming", "overdue", "em_aberto", "a_vencer", "vencido"] as const;

export const isTransferTransaction = (t: Pick<TransactionLike, "category" | "tag">) =>
  t.category === "Transferência" || t.tag === "transferencia";

type TotalsOptions = {
  excludeTransfers?: boolean;
};

export const calculateTransactionTotals = (
  transactions: TransactionLike[],
  options: TotalsOptions = {}
) => {
  const excludeTransfers = options.excludeTransfers ?? true;

  const base = excludeTransfers
    ? transactions.filter((t) => !isTransferTransaction(t))
    : transactions;

  const incomePaid = base
    .filter((t) => t.type === "income" && isPaidStatus(t.status))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expensePaid = base
    .filter((t) => t.type === "expense" && isPaidStatus(t.status))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const pendingIncome = base
    .filter((t) => t.type === "income" && isPendingStatus(t.status))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const pendingExpense = base
    .filter((t) => t.type === "expense" && isPendingStatus(t.status))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    incomePaid,
    expensePaid,
    balancePaid: incomePaid - expensePaid,
    pendingIncome,
    pendingExpense,
  };
};
