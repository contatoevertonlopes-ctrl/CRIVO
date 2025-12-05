import { startOfMonth, endOfMonth, addMonths, isWithinInterval, parseISO } from "date-fns";

const isPaidStatus = (status: string): boolean => {
  return ["pagamento_concluido", "paid", "confirmed"].includes(status);
};

export const sortTransactionsByPriority = <T extends { date: string; status: string }>(transactions: T[]): T[] => {
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const nextMonthStart = startOfMonth(addMonths(now, 1));
  const nextMonthEnd = endOfMonth(addMonths(now, 1));

  return [...transactions].sort((a, b) => {
    const aIsPaid = isPaidStatus(a.status);
    const bIsPaid = isPaidStatus(b.status);

    // Paid transactions go to the end
    if (aIsPaid && !bIsPaid) return 1;
    if (!aIsPaid && bIsPaid) return -1;

    // If both are paid or both are unpaid, sort by date priority
    const aDate = parseISO(a.date);
    const bDate = parseISO(b.date);

    const aInCurrentMonth = isWithinInterval(aDate, { start: currentMonthStart, end: currentMonthEnd });
    const bInCurrentMonth = isWithinInterval(bDate, { start: currentMonthStart, end: currentMonthEnd });
    const aInNextMonth = isWithinInterval(aDate, { start: nextMonthStart, end: nextMonthEnd });
    const bInNextMonth = isWithinInterval(bDate, { start: nextMonthStart, end: nextMonthEnd });

    // Current month comes before next month
    if (aInCurrentMonth && !bInCurrentMonth) return -1;
    if (!aInCurrentMonth && bInCurrentMonth) return 1;

    // Next month comes before other months
    if (aInNextMonth && !bInNextMonth && !bInCurrentMonth) return -1;
    if (!aInNextMonth && !aInCurrentMonth && bInNextMonth) return 1;

    // Within the same priority, sort by day of month (ascending)
    return aDate.getDate() - bDate.getDate();
  });
};
