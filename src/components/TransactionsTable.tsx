import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AddTransactionDialog from "./AddTransactionDialog";
import StatusSelector from "./StatusSelector";

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  status: string;
}

interface TransactionsTableProps {
  onRefresh?: () => void;
}

const TransactionsTable = ({ onRefresh }: TransactionsTableProps) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions((data as Transaction[]) || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const handleSuccess = () => {
    fetchTransactions();
    onRefresh?.();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      em_aberto: "Em aberto",
      a_vencer: "A vencer",
      vencido: "Vencido",
      pagamento_concluido: "Pagamento concluído",
      // Legacy support
      pending: "Em aberto",
      confirmed: "Pagamento concluído",
      paid: "Pagamento concluído",
    };
    return statusMap[status] || status;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pagamento_concluido":
      case "confirmed":
      case "paid":
        return "bg-primary/14 text-green-200";
      case "a_vencer":
        return "bg-warning/10 text-yellow-200";
      case "vencido":
        return "bg-destructive/10 text-red-200";
      default:
        return "bg-secondary/50 text-muted-foreground";
    }
  };

  return (
    <div className="rounded-3xl bg-gradient-to-bl from-background to-black border border-secondary shadow-[0_18px_45px_rgba(3,7,18,0.65)] p-5">
      <div className="flex justify-between items-center mb-3 flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-medium mb-0.5">Últimas transações</h3>
          <p className="text-[11px] text-muted-foreground">
            Resumo das entradas, saídas e recorrências mais recentes.
          </p>
        </div>
        <div className="flex gap-2">
          <AddTransactionDialog onSuccess={handleSuccess} />
        </div>
      </div>

      <div className="overflow-x-auto mt-3">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando...
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-2">Nenhuma transação encontrada</p>
            <p className="text-xs">Adicione sua primeira transação para começar</p>
          </div>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-muted-foreground border-b border-secondary">
                <th className="text-left py-2 px-2 font-normal">Data</th>
                <th className="text-left py-2 px-2 font-normal">Descrição</th>
                <th className="text-left py-2 px-2 font-normal">Categoria</th>
                <th className="text-left py-2 px-2 font-normal">Tipo</th>
                <th className="text-left py-2 px-2 font-normal">Valor</th>
                <th className="text-left py-2 px-2 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="border-b border-secondary/90 hover:bg-secondary/80 transition-colors"
                >
                  <td className="py-2 px-2">{formatDate(transaction.date)}</td>
                  <td className="py-2 px-2">{transaction.description}</td>
                  <td className="py-2 px-2">{transaction.category}</td>
                  <td className="py-2 px-2">
                    <span
                      className={`inline-flex items-center justify-center text-[11px] px-2 py-0.5 rounded-full ${
                        transaction.type === "income"
                          ? "bg-primary/14 text-green-200"
                          : "bg-destructive/10 text-red-200"
                      }`}
                    >
                      {transaction.type === "income" ? "Entrada" : "Saída"}
                    </span>
                  </td>
                  <td className="py-2 px-2">{formatCurrency(transaction.amount)}</td>
                  <td className="py-2 px-2">
                    <StatusSelector
                      transactionId={transaction.id}
                      currentStatus={transaction.status}
                      onStatusChange={fetchTransactions}
                      size="sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TransactionsTable;
