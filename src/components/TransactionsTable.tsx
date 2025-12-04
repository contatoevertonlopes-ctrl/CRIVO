import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AddTransactionDialog from "./AddTransactionDialog";

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  status: "confirmed" | "pending" | "paid";
}

const TransactionsTable = () => {
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
          <AddTransactionDialog onSuccess={fetchTransactions} />
          <button className="text-[13px] px-3 py-2 rounded-full border border-border/50 bg-secondary/60 text-muted-foreground hover:border-border hover:text-foreground transition-all">
            Filtrar período
          </button>
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
                    <span
                      className={`inline-flex items-center justify-center text-[11px] px-2 py-0.5 rounded-full ${
                        transaction.status === "confirmed" || transaction.status === "paid"
                          ? "bg-primary/14 text-green-200"
                          : "bg-warning/10 text-yellow-200"
                      }`}
                    >
                      {transaction.status === "confirmed"
                        ? "Confirmado"
                        : transaction.status === "paid"
                        ? "Pago"
                        : "Em aberto"}
                    </span>
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
