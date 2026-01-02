import { useState, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useHouseholdId } from "@/hooks/useHouseholdId";
import { useHousehold } from "@/hooks/useHousehold";
import { useSharedHousehold } from "@/hooks/useSharedHousehold";
import { useAppMode } from "@/contexts/AppModeContext";
import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { supabase } from "@/integrations/supabase/client";
import AddTransactionCompactDialog from "./AddTransactionCompactDialog";
import StatusSelector from "./StatusSelector";
import TransactionCard from "./TransactionCard";
import TransactionTimeline from "./TransactionTimeline";
import TransactionPagination from "./TransactionPagination";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tag, LayoutList, Clock, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TransactionsTableProps {
  onRefresh?: () => void;
}

const TransactionsTable = ({ onRefresh }: TransactionsTableProps) => {
  const { user } = useAuth();
  const { householdId } = useHouseholdId();
  const { members } = useHousehold();
  const { isShared } = useSharedHousehold();
  const { mode } = useAppMode();
  const { transactions, isLoading, invalidateTransactions } = useTransactions();
  const [viewMode, setViewMode] = useState<"timeline" | "table">("timeline");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const isSurvival = mode === "survival";

  // Sort transactions by created_at for display
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [transactions]);

  const handleSuccess = useCallback(() => {
    invalidateTransactions();
    onRefresh?.();
  }, [invalidateTransactions, onRefresh]);

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

  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden card-shadow-soft",
      isSurvival 
        ? "bg-survival-card border-survival-border/50" 
        : "bg-prosperity-card border-prosperity-border/50"
    )}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 border-b border-border/30">
        <div>
          <h3 className="text-sm font-semibold">Últimas transações</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Entradas, saídas e recorrências
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-border/50 p-0.5">
            <button
              onClick={() => setViewMode("timeline")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "timeline" 
                  ? isSurvival ? "bg-survival-primary/15 text-survival-primary" : "bg-prosperity-emerald/15 text-prosperity-emerald"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Clock className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "table" 
                  ? isSurvival ? "bg-survival-primary/15 text-survival-primary" : "bg-prosperity-emerald/15 text-prosperity-emerald"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
          <AddTransactionCompactDialog
            onSuccess={handleSuccess}
            contentClassName="max-w-[95vw] sm:max-w-lg"
            trigger={
              <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4" />
                Nova Transação
              </Button>
            }
          />
        </div>
      </div>


      {/* Content */}
      <div className="p-3 md:p-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Carregando...
          </div>
        ) : sortedTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm mb-1">Nenhuma transação</p>
            <p className="text-xs">Adicione sua primeira transação</p>
          </div>
        ) : (
          <>
            {/* Timeline View */}
            {viewMode === "timeline" && (
              <TransactionTimeline
                transactions={paginatedTransactions}
                onEdit={() => {}}
                onDelete={() => {}}
                onDuplicate={handleDuplicate}
                onStatusChange={handleSuccess}
                getMemberInfo={getMemberInfo}
                showMember={isShared && members.length > 1}
              />
            )}

            {/* Table View - Mobile Cards */}
            {viewMode === "table" && (
              <div className="md:hidden space-y-2">
                {paginatedTransactions.map((transaction) => {
                  const memberInfo = getMemberInfo(transaction.user_id);
                  return (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      onEdit={() => {}}
                      onDelete={() => {}}
                      onDuplicate={handleDuplicate}
                      onStatusChange={handleSuccess}
                      memberInfo={memberInfo}
                      showMember={isShared && members.length > 1}
                    />
                  );
                })}
              </div>
            )}

            {/* Table View - Desktop */}
            {viewMode === "table" && (
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
                    {paginatedTransactions.map((transaction) => {
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
                              onStatusChange={handleSuccess}
                              size="sm"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-3">
              <TransactionPagination
                currentPage={currentPage}
                totalPages={Math.ceil(sortedTransactions.length / itemsPerPage)}
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
