import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Search, Plus, Edit2, Trash2, ArrowLeft, Filter, Download, Lock, Crown, RefreshCw, Calendar, Copy, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import TransactionForm from "@/components/TransactionForm";
import Sidebar from "@/components/Sidebar";
import ImportTransactionsDialog from "@/components/ImportTransactionsDialog";
import TransactionCard from "@/components/TransactionCard";
import StatusSelector from "@/components/StatusSelector";
import TransactionPagination from "@/components/TransactionPagination";
import { sortTransactionsByPriority } from "@/utils/transactionSort";
import { startOfMonth, endOfMonth, subMonths, addMonths, addWeeks, addDays, format } from "date-fns";

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
}

const Transactions = () => {
  const { user, loading: authLoading } = useAuth();
  const { subscribed, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [recurringOnly, setRecurringOnly] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showProFilters, setShowProFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc" | "priority">("priority");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    type: "expense" as "income" | "expense",
    status: "em_aberto",
    date: new Date().toISOString().split("T")[0],
    is_recurring: false,
    recurring_interval: "monthly",
    paid_date: "",
    tag: "",
    is_installment: false,
    installment_count: "2",
    installment_interval: "monthly",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const fetchTransactions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setTransactions((data as Transaction[]) || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Erro ao carregar transações");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

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

  const getNextInstallmentDate = (baseDate: Date, index: number, interval: string) => {
    switch (interval) {
      case "weekly":
        return addWeeks(baseDate, index);
      case "biweekly":
        return addDays(baseDate, index * 15);
      case "monthly":
      default:
        return addMonths(baseDate, index);
    }
  };

  const handleAdd = async () => {
    if (!user || !formData.description || !formData.amount || !formData.category) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Check if trying to add recurring without Pro
    if (formData.is_recurring && !subscribed) {
      toast.error("Transações recorrentes são exclusivas do Plano Pro");
      return;
    }

    try {
      if (formData.is_installment && parseInt(formData.installment_count) > 1) {
        // Create multiple transactions for installments
        const totalAmount = parseFloat(formData.amount);
        const numInstallments = parseInt(formData.installment_count);
        const installmentAmount = Math.round((totalAmount / numInstallments) * 100) / 100;
        const baseDate = new Date(formData.date);
        
        const transactions = [];
        for (let i = 0; i < numInstallments; i++) {
          const installmentDate = getNextInstallmentDate(baseDate, i, formData.installment_interval);
          transactions.push({
            user_id: user.id,
            description: `${formData.description} ${i + 1}/${numInstallments}`,
            category: formData.category,
            type: formData.type,
            amount: installmentAmount,
            status: i === 0 ? formData.status : "em_aberto",
            date: installmentDate.toISOString().split("T")[0],
            tag: formData.tag || null,
            is_recurring: false,
            recurring_interval: null,
            paid_date: i === 0 ? (formData.paid_date || null) : null,
          });
        }

        const { error } = await supabase.from("transactions").insert(transactions);
        if (error) throw error;

        toast.success(`${numInstallments} parcelas criadas com sucesso!`);
      } else {
        const { error } = await supabase.from("transactions").insert({
          user_id: user.id,
          description: formData.description,
          amount: parseFloat(formData.amount),
          category: formData.category,
          type: formData.type,
          status: formData.status,
          date: formData.date,
          is_recurring: subscribed ? formData.is_recurring : false,
          recurring_interval: formData.is_recurring ? formData.recurring_interval : null,
          tag: formData.tag || null,
          paid_date: formData.paid_date || null,
        });

        if (error) throw error;
        toast.success("Transação adicionada com sucesso!");
      }

      setIsAddDialogOpen(false);
      resetForm();
      fetchTransactions();
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Erro ao adicionar transação");
    }
  };

  const handleEdit = async () => {
    if (!editingTransaction || !user) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          description: formData.description,
          amount: parseFloat(formData.amount),
          category: formData.category,
          type: formData.type,
          status: formData.status,
          date: formData.date,
          is_recurring: subscribed ? formData.is_recurring : false,
          recurring_interval: formData.is_recurring ? formData.recurring_interval : null,
          paid_date: formData.paid_date || null,
          tag: formData.tag || null,
        })
        .eq("id", editingTransaction.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Transação atualizada com sucesso!");
      setIsEditDialogOpen(false);
      setEditingTransaction(null);
      resetForm();
      fetchTransactions();
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error("Erro ao atualizar transação");
    }
  };

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
        description: transaction.description,
        amount: transaction.amount,
        category: transaction.category,
        type: transaction.type,
        status: normalizeStatus(transaction.status),
        date: transaction.date,
        tag: transaction.tag || null,
        is_recurring: transaction.is_recurring || false,
        recurring_interval: transaction.recurring_interval || null,
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
    setFormData({
      description: transaction.description,
      amount: transaction.amount.toString(),
      category: transaction.category,
      type: transaction.type,
      status: transaction.status,
      date: transaction.date,
      is_recurring: transaction.is_recurring || false,
      recurring_interval: transaction.recurring_interval || "monthly",
      paid_date: transaction.paid_date || "",
      tag: transaction.tag || "",
      is_installment: false,
      installment_count: "2",
      installment_interval: "monthly",
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      category: "",
      type: "expense",
      status: "em_aberto",
      date: new Date().toISOString().split("T")[0],
      is_recurring: false,
      recurring_interval: "monthly",
      paid_date: "",
      tag: "",
      is_installment: false,
      installment_count: "2",
      installment_interval: "monthly",
    });
  };

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
        return "bg-primary/14 text-green-200";
      case "a_vencer":
        return "bg-warning/10 text-yellow-200";
      case "vencido":
        return "bg-destructive/10 text-red-200";
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
  };

  const pendingStatuses = ["em_aberto", "a_vencer", "vencido", "pending"];
  const paidStatuses = ["pagamento_concluido", "paid", "confirmed"];

  const totals = {
    income: filteredTransactions
      .filter((t) => t.type === "income" && paidStatuses.includes(t.status))
      .reduce((acc, t) => acc + t.amount, 0),
    expense: filteredTransactions
      .filter((t) => t.type === "expense" && paidStatuses.includes(t.status))
      .reduce((acc, t) => acc + t.amount, 0),
    pendingExpense: filteredTransactions
      .filter((t) => t.type === "expense" && pendingStatuses.includes(t.status))
      .reduce((acc, t) => acc + t.amount, 0),
    pendingIncome: filteredTransactions
      .filter((t) => t.type === "income" && pendingStatuses.includes(t.status))
      .reduce((acc, t) => acc + t.amount, 0),
  };

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
      
      <main className="flex-1 p-4 sm:p-5 lg:p-4 flex flex-col gap-4 sm:gap-5 min-w-0">
        <div className="max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col gap-4 mb-4 sm:mb-8 pl-12 lg:pl-0">
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
              {/* Mobile: only add button */}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 sm:hidden" onClick={resetForm}>
                    <Plus className="w-4 h-4" />
                    <span className="sr-only sm:not-sr-only">Nova</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Adicionar Transação</DialogTitle>
                    <DialogDescription>Preencha os campos para adicionar uma nova transação.</DialogDescription>
                  </DialogHeader>
                  <TransactionForm 
                    formData={formData} 
                    setFormData={setFormData} 
                    onSubmit={handleAdd} 
                    submitLabel="Adicionar" 
                    subscribed={subscribed} 
                  />
                </DialogContent>
              </Dialog>
            </div>
            {/* Desktop actions */}
            <div className="hidden sm:flex gap-2 flex-wrap">
              <ImportTransactionsDialog onSuccess={fetchTransactions} />
              <Button variant="outline" onClick={exportToCSV} className="gap-2">
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={resetForm}>
                    <Plus className="w-4 h-4" />
                    Nova Transação
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Transação</DialogTitle>
                    <DialogDescription>Preencha os campos para adicionar uma nova transação.</DialogDescription>
                  </DialogHeader>
                  <TransactionForm 
                    formData={formData} 
                    setFormData={setFormData} 
                    onSubmit={handleAdd} 
                    submitLabel="Adicionar" 
                    subscribed={subscribed} 
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="rounded-xl sm:rounded-2xl bg-gradient-to-bl from-background to-black border border-secondary p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Entradas</p>
              <p className="text-lg sm:text-2xl font-bold text-primary">{formatCurrency(totals.income)}</p>
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-gradient-to-bl from-background to-black border border-secondary p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Saídas</p>
              <p className="text-lg sm:text-2xl font-bold text-destructive">{formatCurrency(totals.expense)}</p>
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-gradient-to-bl from-background to-black border border-secondary p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Saldo</p>
              <p className={`text-lg sm:text-2xl font-bold ${totals.income - totals.expense >= 0 ? "text-primary" : "text-destructive"}`}>
                {formatCurrency(totals.income - totals.expense)}
              </p>
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-gradient-to-bl from-background to-black border border-blue-500/20 p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">A Receber</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-500">{formatCurrency(totals.pendingIncome)}</p>
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-gradient-to-bl from-background to-black border border-warning/20 p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">A Pagar</p>
              <p className="text-lg sm:text-2xl font-bold text-warning">{formatCurrency(totals.pendingExpense)}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-xl sm:rounded-2xl bg-gradient-to-bl from-background to-black border border-secondary p-3 sm:p-4 mb-4 sm:mb-6">
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
          <div className="rounded-xl sm:rounded-2xl lg:rounded-3xl bg-gradient-to-bl from-background to-black border border-secondary shadow-[0_18px_45px_rgba(3,7,18,0.65)] overflow-hidden">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Nenhuma transação encontrada
              </div>
            ) : (
              <>
                {/* Mobile: Card view with pagination */}
                <div className="md:hidden">
                  {filteredTransactions
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((transaction) => (
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
                </div>
                
                {/* Desktop: Table view */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-muted-foreground border-b border-secondary bg-secondary/30">
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
                      {filteredTransactions
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="border-b border-secondary/50 hover:bg-secondary/30 transition-colors"
                        >
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
                                  ? "bg-primary/14 text-green-200"
                                  : "bg-destructive/10 text-red-200"
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
                              onStatusChange={fetchTransactions}
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
                                onClick={() => handleDuplicate(transaction)}
                                className="p-1.5 rounded-lg hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                                title="Duplicar"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openEditDialog(transaction)}
                                className="p-1.5 rounded-lg hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(transaction.id)}
                                className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <TransactionPagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredTransactions.length / itemsPerPage)}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            )}
          </div>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-[95vw] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Editar Transação</DialogTitle>
                <DialogDescription>Modifique os campos da transação.</DialogDescription>
              </DialogHeader>
              <TransactionForm 
                formData={formData} 
                setFormData={setFormData} 
                onSubmit={handleEdit} 
                submitLabel="Salvar Alterações" 
                subscribed={subscribed}
                showInstallment={false}
              />
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
};

export default Transactions;
