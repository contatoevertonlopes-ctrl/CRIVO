import { parseISO, startOfDay, isBefore } from "date-fns";
import { isPaidStatus } from "@/lib/statusUtils";

type StatusPriority = "overdue" | "upcoming" | "pending" | "paid";

const getStatusPriority = (status: string, transactionDate: Date): StatusPriority => {
  const today = startOfDay(new Date());
  const txDate = startOfDay(transactionDate);
  
  if (isPaidStatus(status)) return "paid";
  if (isBefore(txDate, today)) return "overdue";
  if (status === "upcoming" || status === "a_vencer") return "upcoming";
  return "pending";
};

const statusOrder: Record<StatusPriority, number> = {
  overdue: 0,
  upcoming: 1,
  pending: 2,
  paid: 3,
};

export const sortTransactionsByPriority = <T extends { date: string; status: string }>(transactions: T[]): T[] => {
  return [...transactions].sort((a, b) => {
    const aDate = parseISO(a.date);
    const bDate = parseISO(b.date);
    
    const aPriority = getStatusPriority(a.status, aDate);
    const bPriority = getStatusPriority(b.status, bDate);
    
    if (statusOrder[aPriority] !== statusOrder[bPriority]) {
      return statusOrder[aPriority] - statusOrder[bPriority];
    }
    
    return aDate.getTime() - bDate.getTime();
  });
};
