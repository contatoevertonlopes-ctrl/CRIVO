export type TransactionLike = {
  type: "income" | "expense";
  amount: number;
  status: string;
  category?: string | null;
  tag?: string | null;
};

export const PAID_STATUSES = ["pagamento_concluido", "paid", "confirmed"] as const;
export const PENDING_STATUSES = ["em_aberto", "a_vencer", "vencido", "pending"] as const;

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
    .filter((t) => t.type === "income" && PAID_STATUSES.includes(t.status as (typeof PAID_STATUSES)[number]))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expensePaid = base
    .filter((t) => t.type === "expense" && PAID_STATUSES.includes(t.status as (typeof PAID_STATUSES)[number]))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const pendingIncome = base
    .filter((t) => t.type === "income" && PENDING_STATUSES.includes(t.status as (typeof PENDING_STATUSES)[number]))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const pendingExpense = base
    .filter((t) => t.type === "expense" && PENDING_STATUSES.includes(t.status as (typeof PENDING_STATUSES)[number]))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    incomePaid,
    expensePaid,
    balancePaid: incomePaid - expensePaid,
    pendingIncome,
    pendingExpense,
  };
};
