import { parseISO, startOfDay, isBefore } from "date-fns";

type StatusPriority = "vencido" | "a_vencer" | "em_aberto" | "pago";

const getStatusPriority = (status: string, transactionDate: Date): StatusPriority => {
  const today = startOfDay(new Date());
  const txDate = startOfDay(transactionDate);
  
  // Pagos vão pro final
  if (["pagamento_concluido", "paid", "confirmed"].includes(status)) {
    return "pago";
  }
  
  // Vencido: data passou e não está pago
  if (isBefore(txDate, today)) {
    return "vencido";
  }
  
  // A vencer: status específico ou data futura próxima
  if (status === "a_vencer") {
    return "a_vencer";
  }
  
  // Em aberto: pendente
  return "em_aberto";
};

const statusOrder: Record<StatusPriority, number> = {
  vencido: 0,
  a_vencer: 1,
  em_aberto: 2,
  pago: 3,
};

export const sortTransactionsByPriority = <T extends { date: string; status: string }>(transactions: T[]): T[] => {
  return [...transactions].sort((a, b) => {
    const aDate = parseISO(a.date);
    const bDate = parseISO(b.date);
    
    const aPriority = getStatusPriority(a.status, aDate);
    const bPriority = getStatusPriority(b.status, bDate);
    
    // Primeiro ordena por status (vencido > a_vencer > em_aberto > pago)
    if (statusOrder[aPriority] !== statusOrder[bPriority]) {
      return statusOrder[aPriority] - statusOrder[bPriority];
    }
    
    // Dentro do mesmo status, ordena por data (mais próxima primeiro)
    return aDate.getTime() - bDate.getTime();
  });
};
