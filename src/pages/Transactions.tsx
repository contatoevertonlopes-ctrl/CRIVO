import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useHouseholdId } from "@/hooks/useHouseholdId";
import { useTransactions } from "@/hooks/useTransactions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Search, Plus, Edit2, Trash2, ArrowLeft, Filter, Download, Lock, Crown, RefreshCw, Calendar, Copy, ArrowUpDown, ChevronUp, ChevronDown, ChevronRight, CheckSquare } from "lucide-react";
import AddTransactionCompactDialog from "@/components/AddTransactionCompactDialog";
import Sidebar from "@/components/Sidebar";
import ImportTransactionsDialog from "@/components/ImportTransactionsDialog";
import TransactionCard from "@/components/TransactionCard";
import StatusSelector from "@/components/StatusSelector";
import TransactionPagination from "@/components/TransactionPagination";
import BulkEditDialog from "@/components/BulkEditDialog";
import ThemeToggle from "@/components/ThemeToggle";
import { sortTransactionsByPriority } from "@/utils/transactionSort";
import { startOfMonth, endOfMonth, subMonths, addMonths, format } from "date-fns";
import { calculateTransactionTotals } from "@/utils/transactionTotals";

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  status: string;
  is_recurring?: boolean;
  recurring_interval?: string;
  paid_date?: string;
  tag?: string;
  payment_method?: string;
  bank_account_id?: string | null;
  card_id?: string | null;
}

interface TransactionRowProps {
  transaction: Transaction;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onDuplicate: (t: Transaction) => void;
  onStatusChange: () => void;
  formatDate: (date: string) => string;
  formatCurrency: (value: number) => string;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  selectionMode?: boolean;
}

const TransactionRow = ({ 
  transaction, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onStatusChange,
  formatDate,
  formatCurrency,
  isSelected,
  onToggleSelect,
  selectionMode
}: TransactionRowProps) => (
  <tr className={`border-b border-secondary/50 hover:bg-secondary/30 transition-colors ${isSelected ? "bg-primary/10" : ""}`}>
    {selectionMode && (
      <td className="py-4 px-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect?.(transaction.id)}
          className="data-[state=checked]:bg-primary"
        />
      </td>
    )}
    <td className="py-4 px-4 whitespace-nowrap">{formatDate(transaction.date)}</td>
    <td className="py-4 px-4 font-medium">
      <div className="flex items-center gap-2">
        <span className="truncate max-w-[200px]">{transaction.description}</span>
        {transaction.is_recurring && (
          <span title="Recorrente">
            <RefreshCw className="w-3 h-3 text-primary shrink-0" />
          </span>
        )}
      </div>
    </td>
    <td className="py-4 px-4">{transaction.category}</td>
    <td className="py-4 px-4">
      <span
        className={`inline-flex items-center justify-center text-[11px] px-2 py-0.5 rounded-full ${
          transaction.type === "income"
            ? "bg-primary/10 text-primary"
            : "bg-destructive/10 text-destructive"
        }`}
      >
        {transaction.type === "income" ? "Entrada" : "Saída"}
      </span>
    </td>
    <td className="py-4 px-4 whitespace-nowrap">{formatCurrency(transaction.amount)}</td>
    <td className="py-4 px-4">
      <StatusSelector
        transactionId={transaction.id}
        currentStatus={transaction.status}
        onStatusChange={onStatusChange}
      />
    </td>
    <td className="py-4 px-4">
      {transaction.tag && (
        <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full ${
          transaction.tag === "fixa" 
            ? "bg-blue-500/20 text-blue-300"
            : transaction.tag === "variavel"
            ? "bg-orange-500/20 text-orange-300"
            : "bg-purple-500/20 text-purple-300"
        }`}>
          {transaction.tag === "fixa" ? "Fixa" : transaction.tag === "variavel" ? "Variável" : "Esporádica"}
        </span>
      )}
    </td>
    <td className="py-4 px-4 whitespace-nowrap text-muted-foreground">
      {transaction.paid_date ? formatDate(transaction.paid_date) : "-"}
    </td>
    <td className="py-4 px-4">
      <div className="flex items-center gap-1">
        <button
          onClick={() => onDuplicate(transaction)}
          className="p-1.5 rounded-lg hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
          title="Duplicar"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={() => onEdit(transaction)}
          className="p-1.5 rounded-lg hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
          title="Editar"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(transaction.id)}
          className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
          title="Excluir"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </td>
  </tr>
);

const Transactions = () => {
  const { user, loading: authLoading } = useAuth();
  const { subscribed, loading: subLoading } = useSubscription();
  const { householdId } = useHouseholdId();
  const navigate = useNavigate();
  const { transactions, isLoading: transactionsLoading, refetch: refetchTransactions } = useTransactions();
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("this_month");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [recurringOnly, setRecurringOnly] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showProFilters, setShowProFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc" | "priority">("priority");
  const [groupBy, setGroupBy] = useState<"none" | "month" | "category">("none");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const itemsPerPage = 10;
  const loading = authLoading || subLoading || transactionsLoading;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const fetchTransactions = async () => {
    await refetchTransactions();
  };

  useEffect(() => {
    let filtered = transactions;

    if (search) {
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(search.toLowerCase()) ||
          t.category.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.type === typeFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((t) => t.category === categoryFilter);
    }

    if (tagFilter !== "all") {
      filtered = filtered.filter((t) => t.tag === tagFilter);
    }

    // Period filter
    if (periodFilter !== "all") {
      const now = new Date();
      let periodStart: Date;
      let periodEnd: Date;

      switch (periodFilter) {
        case "last_month":
          periodStart = startOfMonth(subMonths(now, 1));
          periodEnd = endOfMonth(subMonths(now, 1));
          break;
        case "this_month":
          periodStart = startOfMonth(now);
          periodEnd = endOfMonth(now);
          break;
        case "next_month":
          periodStart = startOfMonth(addMonths(now, 1));
          periodEnd = endOfMonth(addMonths(now, 1));
          break;
        case "custom":
          if (customDateFrom && customDateTo) {
            filtered = filtered.filter((t) => t.date >= customDateFrom && t.date <= customDateTo);
          }
          break;
        default:
          periodStart = new Date(0);
          periodEnd = new Date(9999, 11, 31);
      }

      if (periodFilter !== "custom") {
        const startStr = format(periodStart!, "yyyy-MM-dd");
        const endStr = format(periodEnd!, "yyyy-MM-dd");
        filtered = filtered.filter((t) => t.date >= startStr && t.date <= endStr);
      }
    }

    // Pro filters
    if (subscribed) {
      if (dateFrom) {
        filtered = filtered.filter((t) => t.date >= dateFrom);
      }
      if (dateTo) {
        filtered = filtered.filter((t) => t.date <= dateTo);
      }
      if (minAmount) {
        filtered = filtered.filter((t) => t.amount >= parseFloat(minAmount));
      }
      if (maxAmount) {
        filtered = filtered.filter((t) => t.amount <= parseFloat(maxAmount));
      }
      if (recurringOnly) {
        filtered = filtered.filter((t) => t.is_recurring);
      }
    }

    // Apply sorting
    switch (sortOrder) {
      case "amount_desc":
        filtered = [...filtered].sort((a, b) => b.amount - a.amount);
        break;
      case "amount_asc":
        filtered = [...filtered].sort((a, b) => a.amount - b.amount);
        break;
      case "date_asc":
        filtered = [...filtered].sort((a, b) => a.date.localeCompare(b.date));
        break;
      case "date_desc":
        filtered = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
        break;
      case "priority":
      default:
        filtered = sortTransactionsByPriority(filtered);
        break;
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [transactions, search, typeFilter, statusFilter, categoryFilter, tagFilter, periodFilter, customDateFrom, customDateTo, dateFrom, dateTo, minAmount, maxAmount, recurringOnly, subscribed, sortOrder]);

  const categories = [...new Set(transactions.map((t) => t.category))];

  // Group transactions by month or category
  const groupedTransactions = useMemo(() => {
    if (groupBy === "none") {
      return { "all": filteredTransactions };
    }

    const groups: Record<string, Transaction[]> = {};
    
    filteredTransactions.forEach((t) => {
      let key: string;
      if (groupBy === "month") {
        const date = new Date(t.date + "T00:00:00");
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = t.category;
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(t);
    });

    // Sort keys
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (groupBy === "month") {
        return b.localeCompare(a); // Most recent first
      }
      return a.localeCompare(b); // Alphabetical
    });

    const sortedGroups: Record<string, Transaction[]> = {};
    sortedKeys.forEach(key => {
      sortedGroups[key] = groups[key];
    });

    return sortedGroups;
  }, [filteredTransactions, groupBy]);

  const formatGroupHeader = (key: string) => {
    if (groupBy === "month") {
      const [year, month] = key.split("-");
      const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
                          "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    }
    return key;
  };

  const getGroupStats = (transactions: Transaction[]) => {
    const groupTotals = calculateTransactionTotals(transactions, { excludeTransfers: true });
    return {
      income: groupTotals.incomePaid,
      expense: groupTotals.expensePaid,
      balance: groupTotals.balancePaid,
    };
  };

  const toggleGroupCollapse = (key: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(key)) {
      newCollapsed.delete(key);
    } else {
      newCollapsed.add(key);
    }
    setCollapsedGroups(newCollapsed);
  };

  // Flatten for pagination when not grouping
  const paginatedTransactions = groupBy === "none" 
    ? filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredTransactions;
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return;

    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id);

      if (error) throw error;

      toast.success("Transação excluída com sucesso!");
      fetchTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Erro ao excluir transação");
    }
  };

  // Normalize legacy status values to valid constraint values
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
        recurring_interval: transaction.recurring_interval || null,
        payment_method: transaction.payment_method || null,
      });

      if (error) throw error;

      toast.success("Transação duplicada com sucesso!");
      fetchTransactions();
    } catch (error) {
      console.error("Error duplicating transaction:", error);
      toast.error("Erro ao duplicar transação");
    }
  };

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  const editInitialFormData = useMemo(() => {
    if (!editingTransaction) return undefined;
    return {
      description: editingTransaction.description,
      amount: editingTransaction.amount.toString(),
      category: editingTransaction.category,
      type: editingTransaction.type,
      status: editingTransaction.status,
      date: editingTransaction.date,
      is_recurring: editingTransaction.is_recurring || false,
      recurring_interval: editingTransaction.recurring_interval || "monthly",
      paid_date: editingTransaction.paid_date || "",
      tag: editingTransaction.tag || "",
      is_installment: false,
      installment_count: "2",
      installment_interval: "monthly",
      payment_method: editingTransaction.payment_method || "",
      bank_account_id: editingTransaction.bank_account_id || "",
      card_id: editingTransaction.card_id || "",
    };
  }, [editingTransaction]);

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      em_aberto: "Em aberto",
      a_vencer: "A vencer",
      vencido: "Vencido",
      pagamento_concluido: "Pagamento concluído",
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
        return "bg-primary/10 text-primary";
      case "a_vencer":
        return "bg-warning/10 text-warning";
      case "vencido":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-secondary/50 text-muted-foreground";
    }
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

  const exportToCSV = () => {
    const headers = ["Data", "Descrição", "Categoria", "Tipo", "Valor", "Status"];
    const rows = filteredTransactions.map((t) => [
      formatDate(t.date),
      t.description,
      t.category,
      t.type === "income" ? "Entrada" : "Saída",
      t.amount.toString(),
      getStatusLabel(t.status),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "transacoes.csv";
    link.click();
    toast.success("Arquivo exportado com sucesso!");
  };

  const clearProFilters = () => {
    setDateFrom("");
    setDateTo("");
    setMinAmount("");
    setMaxAmount("");
    setRecurringOnly(false);
    setCustomDateFrom("");
    setCustomDateTo("");
    setPeriodFilter("this_month");
  };

  const toggleTransactionSelect = (id: string) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTransactions.size === filteredTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(filteredTransactions.map(t => t.id)));
    }
  };

  const handleBulkEditSuccess = () => {
    setSelectedTransactions(new Set());
    setSelectionMode(false);
    fetchTransactions();
  };

  const totals = calculateTransactionTotals(filteredTransactions, { excludeTransfers: true });

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 min-w-0 pt-16 pb-24 lg:pt-0 lg:pb-0">
        <div className="max-w-6xl mx-auto px-4 py-4 lg:px-6 lg:py-6 flex flex-col gap-4 lg:gap-5">
          {/* Header */}
          <div className="flex flex-col gap-4 lg:pl-0">
            <div className="flex items-start justify-between">
              <div>
                <button
                  onClick={() => navigate("/")}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm">Voltar</span>
                </button>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Transações</h1>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1 hidden sm:block">
                  Gerencie suas entradas e saídas
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                {/* Mobile: only add button */}
                <AddTransactionCompactDialog
                  onSuccess={fetchTransactions}
                  contentClassName="max-w-[95vw] sm:max-w-lg"
                  trigger={
                    <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 sm:hidden">
                      <Plus className="w-4 h-4" />
                      <span className="sr-only sm:not-sr-only">Nova</span>
                    </Button>
                  }
                />
              </div>
            </div>
            {/* Desktop actions */}
            <div className="hidden sm:flex gap-2 flex-wrap">
              <Button 
                variant={selectionMode ? "default" : "outline"} 
                size="sm" 
                className="gap-2"
                onClick={() => {
                  setSelectionMode(!selectionMode);
                  if (selectionMode) setSelectedTransactions(new Set());
                }}
              >
                <CheckSquare className="w-4 h-4" />
                {selectionMode ? `${selectedTransactions.size} selecionadas` : "Selecionar"}
              </Button>
              {selectionMode && selectedTransactions.size > 0 && (
                <Button size="sm" className="gap-2" onClick={() => setIsBulkEditOpen(true)}>
                  <Edit2 className="w-4 h-4" />
                  Editar em Massa
                </Button>
              )}
              <ImportTransactionsDialog onSuccess={fetchTransactions} />
              <Button variant="outline" onClick={exportToCSV} className="gap-2">
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
              <AddTransactionCompactDialog
                onSuccess={fetchTransactions}
                trigger={
                  <Button className="gap-2 bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4" />
                    Nova Transação
                  </Button>
                }
              />
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="rounded-xl sm:rounded-2xl bg-card/50 backdrop-blur border border-border/50 p-3 sm:p-4 card-shadow-soft">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Entradas</p>
              <p className="text-lg sm:text-2xl font-bold text-primary">{formatCurrency(totals.incomePaid)}</p>
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-card/50 backdrop-blur border border-border/50 p-3 sm:p-4 card-shadow-soft">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Saídas</p>
              <p className="text-lg sm:text-2xl font-bold text-destructive">{formatCurrency(totals.expensePaid)}</p>
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-card/50 backdrop-blur border border-border/50 p-3 sm:p-4 card-shadow-soft">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Saldo</p>
              <p className={`text-lg sm:text-2xl font-bold ${totals.balancePaid >= 0 ? "text-primary" : "text-destructive"}`}>
                {formatCurrency(totals.balancePaid)}
              </p>
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-card/50 backdrop-blur border border-border/50 p-3 sm:p-4 card-shadow-soft">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">A Receber</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-500">{formatCurrency(totals.pendingIncome)}</p>
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-card/50 backdrop-blur border border-border/50 p-3 sm:p-4 card-shadow-soft">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">A Pagar</p>
              <p className="text-lg sm:text-2xl font-bold text-warning">{formatCurrency(totals.pendingExpense)}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-xl sm:rounded-2xl bg-card/50 backdrop-blur border border-border/50 p-3 sm:p-4 mb-4 sm:mb-6 card-shadow-soft">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm font-medium">Filtros</span>
              </div>
              <button
                onClick={() => setShowProFilters(!showProFilters)}
                className={`flex items-center gap-1.5 text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border transition-colors ${
                  subscribed 
                    ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20" 
                    : "border-border bg-secondary/50 text-muted-foreground"
                }`}
              >
                {subscribed ? <Crown className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                <span className="hidden sm:inline">Filtros</span> Pro
              </button>
            </div>
            
            {/* Basic Filters */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-6 md:gap-4">
              <div className="col-span-2 md:col-span-1 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-9 sm:h-10 text-sm"
                  />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Agrupar</Label>
                <Select value={groupBy} onValueChange={(v) => setGroupBy(v as "none" | "month" | "category")}>
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="Agrupar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem agrupamento</SelectItem>
                    <SelectItem value="month">Por mês</SelectItem>
                    <SelectItem value="category">Por categoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Período</Label>
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="last_month">Mês passado</SelectItem>
                    <SelectItem value="this_month">Este mês</SelectItem>
                    <SelectItem value="next_month">Próximo mês</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tipo</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="income">Entradas</SelectItem>
                    <SelectItem value="expense">Saídas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
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
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Categoria</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tag</Label>
                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
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
            </div>
            
            {/* Custom period dates */}
            {periodFilter === "custom" && (
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:gap-4 mt-3 items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground hidden sm:block" />
                  <Input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="h-9 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="h-9 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
                {(customDateFrom || customDateTo) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCustomDateFrom("");
                      setCustomDateTo("");
                    }}
                    className="col-span-2 sm:col-auto text-muted-foreground hover:text-foreground h-9"
                  >
                    Limpar
                  </Button>
                )}
              </div>
            )}

            {/* Pro Filters */}
            {showProFilters && (
              <div className="relative mt-4 pt-4 border-t border-border">
                {!subscribed && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3 rounded-xl">
                    <Lock className="w-6 h-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Filtros exclusivos do Plano Pro</p>
                    <Button
                      size="sm"
                      onClick={() => navigate("/plans")}
                      className="gap-2 bg-primary hover:bg-primary/90"
                    >
                      <Crown className="w-4 h-4" />
                      Assinar Pro
                    </Button>
                  </div>
                )}
                <div className={`grid grid-cols-1 md:grid-cols-5 gap-4 ${!subscribed ? "filter blur-sm" : ""}`}>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Data inicial
                    </Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      disabled={!subscribed}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Data final
                    </Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      disabled={!subscribed}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Valor mínimo</Label>
                    <Input
                      type="number"
                      placeholder="R$ 0,00"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      disabled={!subscribed}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Valor máximo</Label>
                    <Input
                      type="number"
                      placeholder="R$ 0,00"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      disabled={!subscribed}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-background">
                      <Checkbox
                        id="recurring-filter"
                        checked={recurringOnly}
                        onCheckedChange={(checked) => setRecurringOnly(!!checked)}
                        disabled={!subscribed}
                      />
                      <Label htmlFor="recurring-filter" className="text-xs cursor-pointer flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        Recorrentes
                      </Label>
                    </div>
                    {subscribed && (dateFrom || dateTo || minAmount || maxAmount || recurringOnly) && (
                      <Button variant="ghost" size="sm" onClick={clearProFilters} className="h-10">
                        Limpar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Transactions List */}
          <div className="rounded-xl sm:rounded-2xl lg:rounded-2xl bg-card/50 backdrop-blur border border-border/50 card-shadow-soft overflow-hidden">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Nenhuma transação encontrada
              </div>
            ) : (
              <>
                {/* Mobile: Card view with grouping */}
                <div className="md:hidden">
                  {groupBy === "none" ? (
                    <>
                      {paginatedTransactions.map((transaction) => (
                        <TransactionCard
                          key={transaction.id}
                          transaction={transaction}
                          onEdit={openEditDialog}
                          onDelete={handleDelete}
                          onDuplicate={handleDuplicate}
                          onStatusChange={fetchTransactions}
                        />
                      ))}
                      <TransactionPagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(filteredTransactions.length / itemsPerPage)}
                        onPageChange={setCurrentPage}
                      />
                    </>
                  ) : (
                    Object.entries(groupedTransactions).map(([key, groupTransactions]) => {
                      const stats = getGroupStats(groupTransactions);
                      const isCollapsed = collapsedGroups.has(key);
                      return (
                        <div key={key} className="border-b border-secondary last:border-0">
                          <button
                            onClick={() => toggleGroupCollapse(key)}
                            className="w-full flex items-center justify-between p-3 sm:p-4 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <ChevronRight className={`w-4 h-4 transition-transform ${isCollapsed ? "" : "rotate-90"}`} />
                              <span className="font-medium text-sm">{formatGroupHeader(key)}</span>
                              <span className="text-xs text-muted-foreground">({groupTransactions.length})</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-primary">+{formatCurrency(stats.income)}</span>
                              <span className="text-destructive">-{formatCurrency(stats.expense)}</span>
                            </div>
                          </button>
                          {!isCollapsed && groupTransactions.map((transaction) => (
                            <TransactionCard
                              key={transaction.id}
                              transaction={transaction}
                              onEdit={openEditDialog}
                              onDelete={handleDelete}
                              onDuplicate={handleDuplicate}
                              onStatusChange={fetchTransactions}
                            />
                          ))}
                        </div>
                      );
                    })
                  )}
                </div>
                
                {/* Desktop: Table view with grouping */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-muted-foreground border-b border-secondary bg-secondary/30">
                        {selectionMode && (
                          <th className="py-4 px-2 w-10">
                            <Checkbox
                              checked={paginatedTransactions.length > 0 && paginatedTransactions.every(t => selectedTransactions.has(t.id))}
                              onCheckedChange={(checked) => {
                                const newSelected = new Set(selectedTransactions);
                                paginatedTransactions.forEach(t => {
                                  if (checked) {
                                    newSelected.add(t.id);
                                  } else {
                                    newSelected.delete(t.id);
                                  }
                                });
                                setSelectedTransactions(newSelected);
                              }}
                              className="data-[state=checked]:bg-primary"
                            />
                          </th>
                        )}
                        <th 
                          className="text-left py-4 px-4 font-medium cursor-pointer hover:text-foreground transition-colors select-none"
                          onClick={() => setSortOrder(sortOrder === "date_desc" ? "date_asc" : "date_desc")}
                        >
                          <div className="flex items-center gap-1">
                            Data
                            {sortOrder === "date_desc" ? (
                              <ChevronDown className="w-4 h-4 text-primary" />
                            ) : sortOrder === "date_asc" ? (
                              <ChevronUp className="w-4 h-4 text-primary" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                            )}
                          </div>
                        </th>
                        <th className="text-left py-4 px-4 font-medium">Descrição</th>
                        <th className="text-left py-4 px-4 font-medium">Categoria</th>
                        <th className="text-left py-4 px-4 font-medium">Tipo</th>
                        <th 
                          className="text-left py-4 px-4 font-medium cursor-pointer hover:text-foreground transition-colors select-none"
                          onClick={() => setSortOrder(sortOrder === "amount_desc" ? "amount_asc" : "amount_desc")}
                        >
                          <div className="flex items-center gap-1">
                            Valor
                            {sortOrder === "amount_desc" ? (
                              <ChevronDown className="w-4 h-4 text-primary" />
                            ) : sortOrder === "amount_asc" ? (
                              <ChevronUp className="w-4 h-4 text-primary" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                            )}
                          </div>
                        </th>
                        <th className="text-left py-4 px-4 font-medium">Status</th>
                        <th className="text-left py-4 px-4 font-medium">Tag</th>
                        <th className="text-left py-4 px-4 font-medium">Data Pgto</th>
                        <th className="text-left py-4 px-4 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupBy === "none" ? (
                        paginatedTransactions.map((transaction) => (
                          <TransactionRow
                            key={transaction.id}
                            transaction={transaction}
                            onEdit={openEditDialog}
                            onDelete={handleDelete}
                            onDuplicate={handleDuplicate}
                            onStatusChange={fetchTransactions}
                            formatDate={formatDate}
                            formatCurrency={formatCurrency}
                            isSelected={selectedTransactions.has(transaction.id)}
                            onToggleSelect={(id) => {
                              const newSelected = new Set(selectedTransactions);
                              if (newSelected.has(id)) {
                                newSelected.delete(id);
                              } else {
                                newSelected.add(id);
                              }
                              setSelectedTransactions(newSelected);
                            }}
                            selectionMode={selectionMode}
                          />
                        ))
                      ) : (
                        Object.entries(groupedTransactions).map(([key, groupTransactions]) => {
                          const stats = getGroupStats(groupTransactions);
                          const isCollapsed = collapsedGroups.has(key);
                          return (
                            <React.Fragment key={key}>
                              <tr 
                                className="bg-secondary/40 border-b border-secondary cursor-pointer hover:bg-secondary/60 transition-colors"
                                onClick={() => toggleGroupCollapse(key)}
                              >
                                <td colSpan={9} className="py-3 px-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <ChevronRight className={`w-4 h-4 transition-transform ${isCollapsed ? "" : "rotate-90"}`} />
                                      <span className="font-semibold">{formatGroupHeader(key)}</span>
                                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                                        {groupTransactions.length} transações
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                      <span className="text-primary font-medium">+{formatCurrency(stats.income)}</span>
                                      <span className="text-destructive font-medium">-{formatCurrency(stats.expense)}</span>
                                      <span className={`font-bold ${stats.balance >= 0 ? "text-primary" : "text-destructive"}`}>
                                        = {formatCurrency(stats.balance)}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                              {!isCollapsed && groupTransactions.map((transaction) => (
                                <TransactionRow
                                  key={transaction.id}
                                  transaction={transaction}
                                  onEdit={openEditDialog}
                                  onDelete={handleDelete}
                                  onDuplicate={handleDuplicate}
                                  onStatusChange={fetchTransactions}
                                  formatDate={formatDate}
                                  formatCurrency={formatCurrency}
                                  isSelected={selectedTransactions.has(transaction.id)}
                                  onToggleSelect={(id) => {
                                    const newSelected = new Set(selectedTransactions);
                                    if (newSelected.has(id)) {
                                      newSelected.delete(id);
                                    } else {
                                      newSelected.add(id);
                                    }
                                    setSelectedTransactions(newSelected);
                                  }}
                                  selectionMode={selectionMode}
                                />
                              ))}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                  {groupBy === "none" && (
                    <TransactionPagination
                      currentPage={currentPage}
                      totalPages={Math.ceil(filteredTransactions.length / itemsPerPage)}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </div>
              </>
            )}
          </div>

          {/* Edit Dialog (same component as "Nova Transação") */}
          <AddTransactionCompactDialog
            open={isEditDialogOpen}
            onOpenChange={(nextOpen) => {
              setIsEditDialogOpen(nextOpen);
              if (!nextOpen) setEditingTransaction(null);
            }}
            mode="edit"
            transactionId={editingTransaction?.id}
            initialFormData={editInitialFormData}
            contentClassName="max-w-[95vw] sm:max-w-lg"
            showInstallment={false}
            onSuccess={fetchTransactions}
          />

          {/* Bulk Edit Dialog */}
          <BulkEditDialog
            open={isBulkEditOpen}
            onOpenChange={setIsBulkEditOpen}
            selectedIds={Array.from(selectedTransactions)}
            categories={categories}
            onSuccess={() => {
              fetchTransactions();
              setSelectedTransactions(new Set());
              setSelectionMode(false);
            }}
          />
        </div>
      </main>
    </div>
  );
};

export default Transactions;
