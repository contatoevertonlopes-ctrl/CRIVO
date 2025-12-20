import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useHouseholdId } from "@/hooks/useHouseholdId";
import { useHousehold } from "@/hooks/useHousehold";
import { useSharedHousehold } from "@/hooks/useSharedHousehold";
import { supabase } from "@/integrations/supabase/client";
import AddTransactionDialog from "./AddTransactionDialog";
import StatusSelector from "./StatusSelector";
import TransactionCard from "./TransactionCard";
import TransactionPagination from "./TransactionPagination";
import { sortTransactionsByPriority } from "@/utils/transactionSort";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Tag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  user_id: string;
}

interface TransactionsTableProps {
  onRefresh?: () => void;
}

const TransactionsTable = ({ onRefresh }: TransactionsTableProps) => {
  const { user } = useAuth();
  const { householdId } = useHouseholdId();
  const { members } = useHousehold();
  const { isShared, loading: householdLoading } = useSharedHousehold();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchTransactions = async () => {
    if (!user || householdLoading) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase.from("transactions").select("*");

      // Filter based on shared status
      if (!isShared) {
        query = query.eq("user_id", user.id);
      } else if (householdId) {
        query = query.eq("household_id", householdId);
      }

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
  }, [user, statusFilter, typeFilter, tagFilter, isShared, householdId, householdLoading]);

  const handleSuccess = () => {
    fetchTransactions();
    onRefresh?.();
  };

  const normalizeStatus = (status: string) => {
    const legacyMap: Record<string, string> = {
      pending: "em_aberto",
      confirmed: "pagamento_concluido",
      paid: "pagamento_concluido",
    };
    return legacyMap[status] || status;
  };

  const handleDuplicate = async (transaction: Transaction) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        household_id: householdId,
        description: transaction.description,
        amount: transaction.amount,
        category: transaction.category,
        type: transaction.type,
        status: normalizeStatus(transaction.status),
        date: transaction.date,
        tag: transaction.tag || null,
        is_recurring: transaction.is_recurring || false,
      });

      if (error) throw error;

      toast.success("Transação duplicada!");
      handleSuccess();
    } catch (error) {
      console.error("Error duplicating transaction:", error);
      toast.error("Erro ao duplicar");
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
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
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "variavel":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      case "esporadica":
        return "bg-orange-500/15 text-orange-400 border-orange-500/30";
      default:
        return "bg-secondary text-muted-foreground border-border/30";
    }
  };

  const getMemberInfo = (userId: string) => {
    const member = members.find((m) => m.user_id === userId);
    if (!member) return { name: "Usuário", initials: "U", avatar: null };

    const name = member.full_name || "Usuário";
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return { name, initials, avatar: member.avatar_url };
  };

  return (
    <div className="rounded-xl bg-card border border-border/50 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-border/50">
        <div>
          <h3 className="text-sm font-medium">Últimas transações</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Entradas, saídas e recorrências recentes
          </p>
        </div>
        <AddTransactionDialog onSuccess={handleSuccess} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 p-3 border-b border-border/30 bg-secondary/30">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px] h-7 text-xs bg-background border-border/50">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="em_aberto">Em aberto</SelectItem>
            <SelectItem value="a_vencer">A vencer</SelectItem>
            <SelectItem value="vencido">Vencido</SelectItem>
            <SelectItem value="pagamento_concluido">Pago</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[100px] h-7 text-xs bg-background border-border/50">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="income">Entrada</SelectItem>
            <SelectItem value="expense">Saída</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-[110px] h-7 text-xs bg-background border-border/50">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="fixa">Fixa</SelectItem>
            <SelectItem value="variavel">Variável</SelectItem>
            <SelectItem value="esporadica">Esporádica</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <div className="p-3">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Carregando...
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm mb-1">Nenhuma transação</p>
            <p className="text-xs">Adicione sua primeira transação</p>
          </div>
        ) : (
          <>
            {/* Mobile: Card view */}
            <div className="md:hidden space-y-2">
              {transactions
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((transaction) => {
                  const memberInfo = getMemberInfo(transaction.user_id);
                  return (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      onEdit={() => {}}
                      onDelete={() => {}}
                      onDuplicate={handleDuplicate}
                      onStatusChange={fetchTransactions}
                      memberInfo={memberInfo}
                      showMember={isShared && members.length > 1}
                    />
                  );
                })}
            </div>

            {/* Desktop: Table view */}
            <div className="hidden md:block">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border/30">
                    {isShared && members.length > 1 && (
                      <th className="text-left py-2 px-2 font-normal w-8"></th>
                    )}
                    <th className="text-left py-2 px-2 font-normal">Venc.</th>
                    <th className="text-left py-2 px-2 font-normal">Pago</th>
                    <th className="text-left py-2 px-2 font-normal">Descrição</th>
                    <th className="text-left py-2 px-2 font-normal">Categoria</th>
                    <th className="text-left py-2 px-2 font-normal">Tag</th>
                    <th className="text-left py-2 px-2 font-normal">Tipo</th>
                    <th className="text-right py-2 px-2 font-normal">Valor</th>
                    <th className="text-left py-2 px-2 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((transaction) => {
                      const memberInfo = getMemberInfo(transaction.user_id);
                      return (
                        <tr
                          key={transaction.id}
                          className="border-b border-border/20 hover:bg-secondary/50 transition-colors"
                        >
                          {isShared && members.length > 1 && (
                            <td className="py-2 px-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Avatar className="w-5 h-5">
                                      <AvatarImage src={memberInfo.avatar || undefined} />
                                      <AvatarFallback className="text-[9px] bg-primary/15 text-primary">
                                        {memberInfo.initials}
                                      </AvatarFallback>
                                    </Avatar>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{memberInfo.name}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </td>
                          )}
                          <td className="py-2 px-2 text-muted-foreground">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="py-2 px-2 text-muted-foreground">
                            {formatDate(transaction.paid_date)}
                          </td>
                          <td className="py-2 px-2 font-medium">{transaction.description}</td>
                          <td className="py-2 px-2 text-muted-foreground">
                            {transaction.category}
                          </td>
                          <td className="py-2 px-2">
                            {transaction.tag && (
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${getTagStyle(
                                  transaction.tag
                                )}`}
                              >
                                <Tag className="w-2.5 h-2.5" />
                                {getTagLabel(transaction.tag)}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2">
                            <span
                              className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded ${
                                transaction.type === "income"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-destructive/10 text-destructive"
                              }`}
                            >
                              {transaction.type === "income" ? "Entrada" : "Saída"}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right font-medium">
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="py-2 px-2">
                            <StatusSelector
                              transactionId={transaction.id}
                              currentStatus={transaction.status}
                              onStatusChange={fetchTransactions}
                              size="sm"
                            />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="mt-3">
              <TransactionPagination
                currentPage={currentPage}
                totalPages={Math.ceil(transactions.length / itemsPerPage)}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionsTable;
