import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AddTransactionDialog from "./AddTransactionDialog";
import StatusSelector from "./StatusSelector";
import TransactionCard from "./TransactionCard";
import TransactionPagination from "./TransactionPagination";
import { sortTransactionsByPriority } from "@/utils/transactionSort";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Tag } from "lucide-react";

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  status: string;
  paid_date?: string | null;
  tag?: string | null;
  is_recurring?: boolean;
}

interface TransactionsTableProps {
  onRefresh?: () => void;
}

const TransactionsTable = ({ onRefresh }: TransactionsTableProps) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchTransactions = async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter);
      }

      if (tagFilter !== "all") {
        query = query.eq("tag", tagFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Apply priority sorting
      const sortedData = sortTransactionsByPriority((data as Transaction[]) || []);
      setTransactions(sortedData);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    setCurrentPage(1);
  }, [user, statusFilter, typeFilter, tagFilter]);

  const handleSuccess = () => {
    fetchTransactions();
    onRefresh?.();
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getTagLabel = (tag: string | null | undefined) => {
    if (!tag) return null;
    const tagMap: Record<string, string> = {
      fixa: "Fixa",
      variavel: "Variável",
      esporadica: "Esporádica",
    };
    return tagMap[tag] || tag;
  };

  const getTagStyle = (tag: string | null | undefined) => {
    switch (tag) {
      case "fixa":
        return "bg-blue-500/20 text-blue-300";
      case "variavel":
        return "bg-purple-500/20 text-purple-300";
      case "esporadica":
        return "bg-orange-500/20 text-orange-300";
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

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="em_aberto">Em aberto</SelectItem>
            <SelectItem value="a_vencer">A vencer</SelectItem>
            <SelectItem value="vencido">Vencido</SelectItem>
            <SelectItem value="pagamento_concluido">Pago</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Tipos</SelectItem>
            <SelectItem value="income">Entrada</SelectItem>
            <SelectItem value="expense">Saída</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Tags</SelectItem>
            <SelectItem value="fixa">Fixa</SelectItem>
            <SelectItem value="variavel">Variável</SelectItem>
            <SelectItem value="esporadica">Esporádica</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
          <>
            {/* Mobile: Card view */}
            <div className="md:hidden">
              {transactions
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    onDuplicate={() => {}}
                    onStatusChange={fetchTransactions}
                  />
                ))}
              <TransactionPagination
                currentPage={currentPage}
                totalPages={Math.ceil(transactions.length / itemsPerPage)}
                onPageChange={setCurrentPage}
              />
            </div>

            {/* Desktop: Table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-muted-foreground border-b border-secondary">
                    <th className="text-left py-2 px-2 font-normal">Vencimento</th>
                    <th className="text-left py-2 px-2 font-normal">Pagamento</th>
                    <th className="text-left py-2 px-2 font-normal">Descrição</th>
                    <th className="text-left py-2 px-2 font-normal">Categoria</th>
                    <th className="text-left py-2 px-2 font-normal">Tag</th>
                    <th className="text-left py-2 px-2 font-normal">Tipo</th>
                    <th className="text-left py-2 px-2 font-normal">Valor</th>
                    <th className="text-left py-2 px-2 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-secondary/90 hover:bg-secondary/80 transition-colors"
                    >
                      <td className="py-2 px-2">{formatDate(transaction.date)}</td>
                      <td className="py-2 px-2 text-muted-foreground">
                        {formatDate(transaction.paid_date)}
                      </td>
                      <td className="py-2 px-2">{transaction.description}</td>
                      <td className="py-2 px-2">{transaction.category}</td>
                      <td className="py-2 px-2">
                        {transaction.tag && (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${getTagStyle(
                              transaction.tag
                            )}`}
                          >
                            <Tag className="w-3 h-3" />
                            {getTagLabel(transaction.tag)}
                          </span>
                        )}
                      </td>
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
              <TransactionPagination
                currentPage={currentPage}
                totalPages={Math.ceil(transactions.length / itemsPerPage)}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
    </div>
  );
};

export default TransactionsTable;
