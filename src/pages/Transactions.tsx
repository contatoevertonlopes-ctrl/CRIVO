import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useHouseholdId } from "@/hooks/useHouseholdId";
import { useTransactions } from "@/hooks/useTransactions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { toast } from "sonner";
import {
  Search, Plus, Edit2, Trash2, Filter, Download, Lock, Crown,
  RefreshCw, Calendar, Copy, ArrowUpDown, ChevronUp, ChevronDown,
  ChevronRight, CheckSquare, X, AlertCircle, CalendarClock,
} from "lucide-react";
import AddTransactionCompactDialog from "@/components/AddTransactionCompactDialog";
import Sidebar from "@/components/Sidebar";
import ImportTransactionsDialog from "@/components/ImportTransactionsDialog";
import TransactionCard from "@/components/TransactionCard";
import { useSharedHousehold } from "@/hooks/useSharedHousehold";
import { useHousehold } from "@/hooks/useHousehold";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import StatusSelector from "@/components/StatusSelector";
import TransactionPagination from "@/components/TransactionPagination";
import BulkEditDialog from "@/components/BulkEditDialog";
import ThemeToggle from "@/components/ThemeToggle";
import { sortTransactionsByPriority } from "@/utils/transactionSort";
import { startOfMonth, endOfMonth, subMonths, addMonths, addDays, format } from "date-fns";
import { calculateTransactionTotals } from "@/utils/transactionTotals";
import { useTransactionCategories } from "@/hooks/useTransactionCategories";
import { deleteRecurringSeries } from "@/hooks/useRecurringSeries";
import { normalizeStatus } from "@/lib/statusUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  status: string;
  user_id?: string;
  is_recurring?: boolean;
  recurring_interval?: string;
  paid_date?: string;
  due_date?: string;
  tag?: string;
  payment_method?: string;
  bank_account_id?: string | null;
  card_id?: string | null;
  recurring_series_id?: string | null;
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
  memberInfo?: { name: string; initials: string; avatar: string | null };
  showMember?: boolean;
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
  selectionMode,
  memberInfo,
  showMember,
}: TransactionRowProps) => (
  <tr className={`border-b border-border/40 hover:bg-secondary/25 transition-colors group ${isSelected ? "bg-primary/8" : ""}`}>
    {selectionMode && (
      <td className="py-3 px-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect?.(transaction.id)}
          className="data-[state=checked]:bg-primary"
        />
      </td>
    )}
    {showMember && (
      <td className="py-3 px-3">
        {memberInfo && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Avatar className="w-6 h-6 ring-1 ring-border/40">
                  <AvatarImage src={memberInfo.avatar || undefined} />
                  <AvatarFallback className="text-[9px] bg-primary/20 text-primary">
                    {memberInfo.initials}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent><p>{memberInfo.name}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </td>
    )}

    {/* Data */}
    <td className="py-3 px-4 whitespace-nowrap text-sm text-muted-foreground tabular-nums">
      {formatDate(transaction.date)}
    </td>

    {/* Descrição + tag inline */}
    <td className="py-3 px-4">
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm truncate max-w-[200px]">{transaction.description}</span>
        {transaction.is_recurring && (
          <RefreshCw className="w-3 h-3 text-muted-foreground/50 shrink-0" title="Recorrente" />
        )}
        {transaction.tag && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold tracking-wide shrink-0 ${
            transaction.tag === "fixa"
              ? "bg-primary/10 text-primary"
              : transaction.tag === "variavel"
              ? "bg-warning/15 text-warning-foreground"
              : "bg-muted text-muted-foreground"
          }`}>
            {transaction.tag === "fixa" ? "Fixa" : transaction.tag === "variavel" ? "Var" : "Esp"}
          </span>
        )}
      </div>
    </td>

    {/* Categoria */}
    <td className="py-3 px-4">
      <span className="text-xs text-muted-foreground">{transaction.category}</span>
    </td>

    {/* Valor */}
    <td className="py-3 px-4 whitespace-nowrap">
      <span className={`text-sm font-semibold finance-value tabular-nums ${
        transaction.type === "income" ? "text-income" : "text-destructive"
      }`}>
        {transaction.type === "income" ? "+" : "−"}{formatCurrency(transaction.amount)}
      </span>
    </td>

    {/* Status */}
    <td className="py-3 px-4">
      <StatusSelector
        transactionId={transaction.id}
        currentStatus={transaction.status}
        recurringSeriesId={transaction.recurring_series_id}
        onStatusChange={onStatusChange}
      />
    </td>

    {/* Ações — visíveis só no hover */}
    <td className="py-3 px-3">
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onDuplicate(transaction)}
          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-primary/15 text-muted-foreground hover:text-primary transition-colors"
          title="Duplicar"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onEdit(transaction)}
          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Editar"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(transaction.id)}
          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors"
          title="Excluir"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </td>
  </tr>
);

const Transactions = () => {
  const { user, loading: authLoading } = useAuth();
  const { subscribed, loading: subLoading } = useSubscription();
  const { householdId } = useHouseholdId();
  const { isShared } = useSharedHousehold();
  const { members } = useHousehold();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { transactions, isLoading: transactionsLoading, refetch: refetchTransactions, error: transactionsError } = useTransactions();
  const { categories: predefinedCategories } = useTransactionCategories();
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>(searchParams.get("type") ? [searchParams.get("type")!] : []);
  const [statusFilter, setStatusFilter] = useState<string[]>(searchParams.get("status") ? [searchParams.get("status")!] : []);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc" | "priority">("priority");
  const [groupBy, setGroupBy] = useState<"none" | "month" | "category">("none");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const filterKeyRef = React.useRef<string>("");
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [recurringDeleteTarget, setRecurringDeleteTarget] = useState<Transaction | null>(null);
  const itemsPerPage = 15;
  const loading = authLoading || transactionsLoading;

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const fetchTransactions = async () => { await refetchTransactions(); };

  useEffect(() => {
    let filtered = transactions;

    if (search) {
      filtered = filtered.filter((t) =>
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (typeFilter.length > 0) filtered = filtered.filter((t) => typeFilter.includes(t.type));
    if (statusFilter.length > 0) {
      filtered = filtered.filter((t) => statusFilter.includes(normalizeStatus(t.status)));
    }
    if (categoryFilter.length > 0) filtered = filtered.filter((t) => categoryFilter.includes(t.category));
    if (tagFilter.length > 0) filtered = filtered.filter((t) => t.tag != null && tagFilter.includes(t.tag));

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
          if (customDateFrom) filtered = filtered.filter((t) => t.date >= customDateFrom);
          if (customDateTo) filtered = filtered.filter((t) => t.date <= customDateTo);
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

    if (subscribed) {
      if (dateFrom) filtered = filtered.filter((t) => t.date >= dateFrom);
      if (dateTo) filtered = filtered.filter((t) => t.date <= dateTo);
      if (minAmount) filtered = filtered.filter((t) => t.amount >= parseFloat(minAmount));
      if (maxAmount) filtered = filtered.filter((t) => t.amount <= parseFloat(maxAmount));
      if (recurringOnly) filtered = filtered.filter((t) => t.is_recurring);
    }

    switch (sortOrder) {
      case "amount_desc": filtered = [...filtered].sort((a, b) => b.amount - a.amount); break;
      case "amount_asc":  filtered = [...filtered].sort((a, b) => a.amount - b.amount); break;
      case "date_asc":    filtered = [...filtered].sort((a, b) => a.date.localeCompare(b.date)); break;
      case "date_desc":   filtered = [...filtered].sort((a, b) => b.date.localeCompare(a.date)); break;
      default:            filtered = sortTransactionsByPriority(filtered); break;
    }

    const unique = Array.from(new Map(filtered.map((t) => [t.id, t])).values());
    setFilteredTransactions(unique);

    const newKey = JSON.stringify([search, typeFilter, statusFilter, categoryFilter, tagFilter, periodFilter, customDateFrom, customDateTo, dateFrom, dateTo, minAmount, maxAmount, recurringOnly, subscribed, sortOrder]);
    if (newKey !== filterKeyRef.current) {
      filterKeyRef.current = newKey;
      setCurrentPage(1);
    }
  }, [transactions, search, typeFilter, statusFilter, categoryFilter, tagFilter, periodFilter, customDateFrom, customDateTo, dateFrom, dateTo, minAmount, maxAmount, recurringOnly, subscribed, sortOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of predefinedCategories) map.set(c.name.toLowerCase(), c.name);
    for (const t of transactions) {
      const name = (t.category || "").trim();
      if (name) map.set(name.toLowerCase(), name);
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [transactions, predefinedCategories]);

  const groupedTransactions = useMemo(() => {
    if (groupBy === "none") return { all: filteredTransactions };
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((t) => {
      let key: string;
      if (groupBy === "month") {
        const d = new Date(t.date + "T00:00:00");
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      } else {
        key = t.category;
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    const sortedKeys = Object.keys(groups).sort((a, b) =>
      groupBy === "month" ? b.localeCompare(a) : a.localeCompare(b)
    );
    const sorted: Record<string, Transaction[]> = {};
    sortedKeys.forEach((k) => { sorted[k] = groups[k]; });
    return sorted;
  }, [filteredTransactions, groupBy]);

  const formatGroupHeader = (key: string) => {
    if (groupBy !== "month") return key;
    const [year, month] = key.split("-");
    const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const getGroupStats = (txs: Transaction[]) => {
    const t = calculateTransactionTotals(txs, { excludeTransfers: true });
    return { income: t.incomePaid, expense: t.expensePaid, balance: t.balancePaid };
  };

  const toggleGroupCollapse = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const paginatedTransactions = groupBy === "none"
    ? filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredTransactions;

  const handleDelete = (id: string) => {
    const tx = (transactions as Transaction[]).find((t) => t.id === id);
    if (tx?.recurring_series_id) setRecurringDeleteTarget(tx);
    else handleDeleteSingle(id);
  };

  const handleDeleteSingle = async (id: string) => {
    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
      toast.success("Transação excluída.");
      fetchTransactions();
    } catch {
      toast.error("Erro ao excluir transação");
    }
  };

  const handleDeleteSeries = async (seriesId: string) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      await deleteRecurringSeries(seriesId, today);
      toast.success("Série e ocorrências futuras excluídas.");
      fetchTransactions();
    } catch {
      toast.error("Erro ao excluir série");
    }
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
        status: transaction.status,
        date: transaction.date,
        tag: transaction.tag || null,
        is_recurring: transaction.is_recurring || false,
        recurring_interval: transaction.recurring_interval || null,
        payment_method: transaction.payment_method || null,
      });
      if (error) throw error;
      toast.success("Transação duplicada!");
      fetchTransactions();
    } catch {
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
      frequency: editingTransaction.recurring_interval || "monthly",
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
    return Number.isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const exportToCSV = () => {
    const sanitize = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);
    const csvField = (v: string) => `"${sanitize(v).replace(/"/g, '""')}"`;
    const headers = ["Data", "Descrição", "Categoria", "Tipo", "Valor", "Status"];
    const rows = filteredTransactions.map((t) => [
      formatDate(t.date), t.description, t.category,
      t.type === "income" ? "Entrada" : "Saída",
      t.amount.toString(),
      normalizeStatus(t.status),
    ]);
    const csv = [headers, ...rows].map((r) => r.map(csvField).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "transacoes.csv";
    a.click();
    toast.success("Arquivo exportado!");
  };

  const clearProFilters = () => {
    setDateFrom(""); setDateTo(""); setMinAmount(""); setMaxAmount("");
    setRecurringOnly(false); setCustomDateFrom(""); setCustomDateTo("");
    setPeriodFilter("all");
  };

  const showMember = isShared && members.length > 1;
  const getMemberInfo = (userId: string) => {
    const m = members.find((m) => m.user_id === userId);
    if (!m) return { name: "Usuário", initials: "U", avatar: null };
    const name = m.full_name || "Usuário";
    return { name, initials: name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2), avatar: m.avatar_url };
  };

  const totals = calculateTransactionTotals(filteredTransactions, { excludeTransfers: true });

  const predictability = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const sevenDaysStr = format(addDays(today, 7), "yyyy-MM-dd");
    const overdue = transactions.filter((t) => normalizeStatus(t.status) === "overdue" && t.type === "expense");
    const dueToday = transactions.filter((t) => t.date === todayStr && normalizeStatus(t.status) !== "paid" && t.type === "expense");
    const next7 = transactions.filter((t) => t.type === "expense" && t.date > todayStr && t.date <= sevenDaysStr && normalizeStatus(t.status) !== "paid");
    return {
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((s, t) => s + t.amount, 0),
      dueTodayCount: dueToday.length,
      dueTodayAmount: dueToday.reduce((s, t) => s + t.amount, 0),
      next7DaysCount: next7.length,
      next7DaysAmount: next7.reduce((s, t) => s + t.amount, 0),
    };
  }, [transactions]);

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }

  const colSpanBase = (selectionMode ? 1 : 0) + (showMember ? 1 : 0) + 6;

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar />

      <main className="flex-1 min-w-0 pt-16 pb-nav-safe lg:pt-0 lg:pb-0">
        <div className="px-4 py-5 lg:px-8 lg:py-8 flex flex-col gap-5">

          {/* ─── Header ──────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-bold tracking-tight">Transações</h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="hidden sm:flex items-center gap-2">
                <ImportTransactionsDialog onSuccess={fetchTransactions} />
                <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Exportar</span>
                </Button>
                <AddTransactionCompactDialog
                  onSuccess={fetchTransactions}
                  trigger={
                    <Button size="sm" className="gap-1.5">
                      <Plus className="w-4 h-4" />
                      Nova
                    </Button>
                  }
                />
              </div>
            </div>
          </div>

          {/* ─── Stats inline ────────────────────────────────────── */}
          <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Entradas</p>
              <p className="text-lg font-bold text-income finance-value">{formatCurrency(totals.incomePaid)}</p>
            </div>
            <div className="w-px h-8 bg-border self-center hidden sm:block" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Saídas</p>
              <p className="text-lg font-bold text-destructive finance-value">{formatCurrency(totals.expensePaid)}</p>
            </div>
            <div className="w-px h-8 bg-border self-center hidden sm:block" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Saldo</p>
              <p className={`text-lg font-bold finance-value ${totals.balancePaid >= 0 ? "text-income" : "text-destructive"}`}>
                {formatCurrency(totals.balancePaid)}
              </p>
            </div>
            <div className="w-px h-8 bg-border self-center hidden sm:block" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">A Receber</p>
              <p className="text-lg font-bold text-foreground finance-value">{formatCurrency(totals.pendingIncome)}</p>
            </div>
            <div className="w-px h-8 bg-border self-center hidden sm:block" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">A Pagar</p>
              <p className="text-lg font-bold text-warning finance-value">{formatCurrency(totals.pendingExpense)}</p>
            </div>
          </div>

          {/* ─── Alertas (só quando existem) ─────────────────────── */}
          {(predictability.overdueCount > 0 || predictability.dueTodayCount > 0) && (
            <div className="flex flex-wrap gap-2">
              {predictability.overdueCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/8 border border-destructive/20 text-sm text-destructive">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    <strong>{predictability.overdueCount}</strong>{" "}
                    {predictability.overdueCount === 1 ? "despesa atrasada" : "despesas atrasadas"}
                    {" — "}{formatCurrency(predictability.overdueAmount)}
                  </span>
                </div>
              )}
              {predictability.dueTodayCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-warning/8 border border-warning/20 text-sm text-warning-foreground">
                  <CalendarClock className="w-3.5 h-3.5 shrink-0 text-warning" />
                  <span>
                    <strong>{predictability.dueTodayCount}</strong>{" "}
                    {predictability.dueTodayCount === 1 ? "vence hoje" : "vencem hoje"}
                    {" — "}{formatCurrency(predictability.dueTodayAmount)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ─── Filtros (desktop) ─────────────────────────────── */}
          <div className="hidden sm:block glass-card rounded-xl px-5 py-4 space-y-3">

            {/* Linha 1: Busca · Período · Tipo · Status */}
            <div className="grid grid-cols-[1fr_170px_130px_170px] gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Descrição ou categoria..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Período</Label>
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="h-9 w-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os períodos</SelectItem>
                    <SelectItem value="last_month">Mês passado</SelectItem>
                    <SelectItem value="this_month">Este mês</SelectItem>
                    <SelectItem value="next_month">Próximo mês</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Tipo</Label>
                <MultiSelect
                  options={[{ value: "income", label: "Entradas" }, { value: "expense", label: "Saídas" }]}
                  selected={typeFilter}
                  onChange={setTypeFilter}
                  allLabel="Todos"
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</Label>
                <MultiSelect
                  options={[
                    { value: "pending", label: "Em aberto" },
                    { value: "upcoming", label: "A vencer" },
                    { value: "overdue", label: "Vencido" },
                    { value: "paid", label: "Pago" },
                  ]}
                  selected={statusFilter}
                  onChange={setStatusFilter}
                  allLabel="Todos"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Data customizada (só quando período = personalizado) */}
            {periodFilter === "custom" && (
              <div className="flex items-center gap-2 pl-px">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">De</Label>
                <Input type="date" value={customDateFrom} onChange={(e) => setCustomDateFrom(e.target.value)} className="h-9 text-sm w-36" />
                <Label className="text-xs text-muted-foreground whitespace-nowrap">até</Label>
                <Input type="date" value={customDateTo} onChange={(e) => setCustomDateTo(e.target.value)} className="h-9 text-sm w-36" />
                {(customDateFrom || customDateTo) && (
                  <Button variant="ghost" size="icon" onClick={() => { setCustomDateFrom(""); setCustomDateTo(""); }} className="h-9 w-9">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}

            {/* Linha 2: Categoria · Tag · Agrupar · Ordenar · ações */}
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Categoria</Label>
                <MultiSelect
                  options={categories.map((c) => ({ value: c, label: c }))}
                  selected={categoryFilter}
                  onChange={setCategoryFilter}
                  allLabel="Todas"
                  className="h-9 text-sm"
                />
              </div>

              <div className="w-[130px] space-y-1">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Tag</Label>
                <MultiSelect
                  options={[
                    { value: "fixa", label: "Fixa" },
                    { value: "variavel", label: "Variável" },
                    { value: "esporadica", label: "Esporádica" },
                  ]}
                  selected={tagFilter}
                  onChange={setTagFilter}
                  allLabel="Todas"
                  className="h-9 text-sm"
                />
              </div>

              <div className="w-[140px] space-y-1">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Agrupar</Label>
                <Select value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
                  <SelectTrigger className="h-9 w-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem grupo</SelectItem>
                    <SelectItem value="month">Por mês</SelectItem>
                    <SelectItem value="category">Por categoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-[140px] space-y-1">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Ordenar</Label>
                <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as typeof sortOrder)}>
                  <SelectTrigger className="h-9 w-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="priority">Prioridade</SelectItem>
                    <SelectItem value="date_desc">Data ↓</SelectItem>
                    <SelectItem value="date_asc">Data ↑</SelectItem>
                    <SelectItem value="amount_desc">Valor ↓</SelectItem>
                    <SelectItem value="amount_asc">Valor ↑</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Selecionar em massa */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground invisible">_</Label>
                <Button
                  variant={selectionMode ? "default" : "outline"}
                  size="sm"
                  className="h-9 gap-1.5"
                  onClick={() => { setSelectionMode(!selectionMode); if (selectionMode) setSelectedTransactions(new Set()); }}
                  title="Seleção em massa"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  {selectionMode && selectedTransactions.size > 0 ? <span>{selectedTransactions.size}</span> : <span className="hidden md:inline">Selecionar</span>}
                </Button>
              </div>

              {/* Pro */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground invisible">_</Label>
                <button
                  onClick={() => setShowProFilters(!showProFilters)}
                  className={`flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs border transition-colors ${
                    subscribed
                      ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                      : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {subscribed ? <Crown className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  Pro
                </button>
              </div>
            </div>

            {/* Filtros Pro expandidos */}
            {showProFilters && (
              <div className="relative pt-3 border-t border-border">
                {!subscribed && (
                  <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-2 rounded-lg">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Filtros exclusivos Pro</p>
                    <Button size="sm" onClick={() => navigate("/plans")} className="gap-1.5">
                      <Crown className="w-3.5 h-3.5" /> Assinar Pro
                    </Button>
                  </div>
                )}
                <div className={`flex flex-wrap gap-3 items-end ${!subscribed ? "filter blur-sm" : ""}`}>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">De</Label>
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} disabled={!subscribed} className="h-9 text-sm w-36" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Até</Label>
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} disabled={!subscribed} className="h-9 text-sm w-36" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Valor mín.</Label>
                    <Input type="number" placeholder="0,00" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} disabled={!subscribed} className="h-9 text-sm w-28" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Valor máx.</Label>
                    <Input type="number" placeholder="9.999,00" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} disabled={!subscribed} className="h-9 text-sm w-28" />
                  </div>
                  <label className="flex items-center gap-2 h-9 px-3 border border-input rounded-lg text-sm cursor-pointer self-end">
                    <Checkbox checked={recurringOnly} onCheckedChange={(c) => setRecurringOnly(!!c)} disabled={!subscribed} />
                    <RefreshCw className="w-3.5 h-3.5" />
                    Recorrentes
                  </label>
                  {subscribed && (dateFrom || dateTo || minAmount || maxAmount || recurringOnly) && (
                    <Button variant="ghost" size="sm" onClick={clearProFilters} className="h-9 self-end">Limpar</Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ─── Filtros mobile ───────────────────────────────────── */}
          <div className="sm:hidden glass-card rounded-xl p-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-10" />
              </div>
              <Drawer open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <DrawerTrigger asChild>
                  <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0">
                    <Filter className="w-4 h-4" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="max-h-[90vh]">
                  <DrawerHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <DrawerTitle>Filtros</DrawerTitle>
                      <DrawerClose asChild>
                        <Button type="button" variant="ghost" size="icon"><X className="w-5 h-5" /></Button>
                      </DrawerClose>
                    </div>
                  </DrawerHeader>
                  <div className="px-4 pb-4 overflow-auto space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Período</Label>
                        <Select value={periodFilter} onValueChange={setPeriodFilter}>
                          <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="last_month">Mês passado</SelectItem>
                            <SelectItem value="this_month">Este mês</SelectItem>
                            <SelectItem value="next_month">Próximo mês</SelectItem>
                            <SelectItem value="custom">Personalizado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Tipo</Label>
                        <MultiSelect options={[{ value: "income", label: "Entradas" }, { value: "expense", label: "Saídas" }]} selected={typeFilter} onChange={setTypeFilter} allLabel="Todos" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Status</Label>
                        <MultiSelect options={[{ value: "pending", label: "Em aberto" }, { value: "upcoming", label: "A vencer" }, { value: "overdue", label: "Vencido" }, { value: "paid", label: "Pago" }]} selected={statusFilter} onChange={setStatusFilter} allLabel="Todos" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Agrupar</Label>
                        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
                          <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sem grupo</SelectItem>
                            <SelectItem value="month">Por mês</SelectItem>
                            <SelectItem value="category">Por categoria</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <Label className="text-xs text-muted-foreground">Categoria</Label>
                        <MultiSelect options={categories.map((c) => ({ value: c, label: c }))} selected={categoryFilter} onChange={setCategoryFilter} allLabel="Todas" />
                      </div>
                    </div>
                    {periodFilter === "custom" && (
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="date" value={customDateFrom} onChange={(e) => setCustomDateFrom(e.target.value)} className="h-10 text-sm" />
                        <Input type="date" value={customDateTo} onChange={(e) => setCustomDateTo(e.target.value)} className="h-10 text-sm" />
                      </div>
                    )}
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </div>

          {/* ─── Barra de seleção em massa ───────────────────────── */}
          {selectionMode && selectedTransactions.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary/8 border border-primary/20 text-sm">
              <span className="text-primary font-semibold">{selectedTransactions.size} selecionadas</span>
              <Button size="sm" className="h-8 gap-1.5" onClick={() => setIsBulkEditOpen(true)}>
                <Edit2 className="w-3.5 h-3.5" /> Editar em massa
              </Button>
              <Button variant="ghost" size="sm" className="h-8 ml-auto" onClick={() => { setSelectionMode(false); setSelectedTransactions(new Set()); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* ─── Lista de transações ──────────────────────────────── */}
          <div className="glass-card rounded-2xl overflow-hidden">
            {loading ? (
              <div className="text-center py-16 text-muted-foreground text-sm">Carregando...</div>
            ) : transactionsError ? (
              <div className="text-center py-16 space-y-3">
                <p className="text-destructive text-sm">Erro ao carregar transações.</p>
                <Button variant="outline" size="sm" onClick={fetchTransactions}>Recarregar</Button>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">Nenhuma transação encontrada</div>
            ) : (
              <>
                {/* Mobile */}
                <div className="md:hidden">
                  {groupBy === "none" ? (
                    <>
                      {paginatedTransactions.map((t) => (
                        <TransactionCard key={t.id} transaction={t} onEdit={openEditDialog} onDelete={handleDelete} onDuplicate={handleDuplicate} onStatusChange={fetchTransactions} memberInfo={getMemberInfo(t.user_id || "")} showMember={showMember} />
                      ))}
                      <TransactionPagination currentPage={currentPage} totalPages={Math.ceil(filteredTransactions.length / itemsPerPage)} onPageChange={setCurrentPage} />
                    </>
                  ) : (
                    Object.entries(groupedTransactions).map(([key, grpTxs]) => {
                      const stats = getGroupStats(grpTxs);
                      const collapsed = collapsedGroups.has(key);
                      return (
                        <div key={key} className="border-b border-border/40 last:border-0">
                          <button onClick={() => toggleGroupCollapse(key)} className="w-full flex items-center justify-between p-3 bg-secondary/20 hover:bg-secondary/40 transition-colors">
                            <div className="flex items-center gap-2">
                              <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? "" : "rotate-90"}`} />
                              <span className="font-medium text-sm">{formatGroupHeader(key)}</span>
                              <span className="text-xs text-muted-foreground">({grpTxs.length})</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-income">+{formatCurrency(stats.income)}</span>
                              <span className="text-destructive">−{formatCurrency(stats.expense)}</span>
                            </div>
                          </button>
                          {!collapsed && grpTxs.map((t) => (
                            <TransactionCard key={t.id} transaction={t} onEdit={openEditDialog} onDelete={handleDelete} onDuplicate={handleDuplicate} onStatusChange={fetchTransactions} memberInfo={getMemberInfo(t.user_id || "")} showMember={showMember} />
                          ))}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Desktop — tabela enxuta */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/40">
                        {selectionMode && (
                          <th className="py-3 px-3 w-10">
                            <Checkbox
                              checked={paginatedTransactions.length > 0 && paginatedTransactions.every((t) => selectedTransactions.has(t.id))}
                              onCheckedChange={(checked) => {
                                const next = new Set(selectedTransactions);
                                paginatedTransactions.forEach((t) => checked ? next.add(t.id) : next.delete(t.id));
                                setSelectedTransactions(next);
                              }}
                              className="data-[state=checked]:bg-primary"
                            />
                          </th>
                        )}
                        {showMember && <th className="py-3 px-3 w-10" />}
                        <th
                          className="text-left py-3 px-4 text-[11px] uppercase tracking-widest text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors select-none"
                          onClick={() => setSortOrder(sortOrder === "date_desc" ? "date_asc" : "date_desc")}
                        >
                          <span className="flex items-center gap-1">
                            Data
                            {sortOrder === "date_desc" ? <ChevronDown className="w-3.5 h-3.5 text-primary" /> : sortOrder === "date_asc" ? <ChevronUp className="w-3.5 h-3.5 text-primary" /> : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                          </span>
                        </th>
                        <th className="text-left py-3 px-4 text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Descrição</th>
                        <th className="text-left py-3 px-4 text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Categoria</th>
                        <th
                          className="text-left py-3 px-4 text-[11px] uppercase tracking-widest text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors select-none"
                          onClick={() => setSortOrder(sortOrder === "amount_desc" ? "amount_asc" : "amount_desc")}
                        >
                          <span className="flex items-center gap-1">
                            Valor
                            {sortOrder === "amount_desc" ? <ChevronDown className="w-3.5 h-3.5 text-primary" /> : sortOrder === "amount_asc" ? <ChevronUp className="w-3.5 h-3.5 text-primary" /> : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                          </span>
                        </th>
                        <th className="text-left py-3 px-4 text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Status</th>
                        <th className="py-3 px-3 w-28" />
                      </tr>
                    </thead>
                    <tbody>
                      {groupBy === "none" ? (
                        paginatedTransactions.map((t) => (
                          <TransactionRow
                            key={t.id}
                            transaction={t}
                            onEdit={openEditDialog}
                            onDelete={handleDelete}
                            onDuplicate={handleDuplicate}
                            onStatusChange={fetchTransactions}
                            formatDate={formatDate}
                            formatCurrency={formatCurrency}
                            isSelected={selectedTransactions.has(t.id)}
                            onToggleSelect={(id) => {
                              const next = new Set(selectedTransactions);
                              next.has(id) ? next.delete(id) : next.add(id);
                              setSelectedTransactions(next);
                            }}
                            selectionMode={selectionMode}
                            memberInfo={getMemberInfo(t.user_id || "")}
                            showMember={showMember}
                          />
                        ))
                      ) : (
                        Object.entries(groupedTransactions).map(([key, grpTxs]) => {
                          const stats = getGroupStats(grpTxs);
                          const collapsed = collapsedGroups.has(key);
                          return (
                            <React.Fragment key={key}>
                              <tr className="bg-secondary/20 border-b border-border/40 cursor-pointer hover:bg-secondary/40 transition-colors" onClick={() => toggleGroupCollapse(key)}>
                                <td colSpan={colSpanBase} className="py-2.5 px-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? "" : "rotate-90"}`} />
                                      <span className="font-semibold text-sm">{formatGroupHeader(key)}</span>
                                      <span className="text-xs text-muted-foreground">({grpTxs.length})</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs">
                                      <span className="text-income font-medium">+{formatCurrency(stats.income)}</span>
                                      <span className="text-destructive font-medium">−{formatCurrency(stats.expense)}</span>
                                      <span className={`font-bold ${stats.balance >= 0 ? "text-income" : "text-destructive"}`}>= {formatCurrency(stats.balance)}</span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                              {!collapsed && grpTxs.map((t) => (
                                <TransactionRow
                                  key={t.id}
                                  transaction={t}
                                  onEdit={openEditDialog}
                                  onDelete={handleDelete}
                                  onDuplicate={handleDuplicate}
                                  onStatusChange={fetchTransactions}
                                  formatDate={formatDate}
                                  formatCurrency={formatCurrency}
                                  isSelected={selectedTransactions.has(t.id)}
                                  onToggleSelect={(id) => {
                                    const next = new Set(selectedTransactions);
                                    next.has(id) ? next.delete(id) : next.add(id);
                                    setSelectedTransactions(next);
                                  }}
                                  selectionMode={selectionMode}
                                  memberInfo={getMemberInfo(t.user_id || "")}
                                  showMember={showMember}
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
        </div>
      </main>

      {/* Mobile FAB */}
      <AddTransactionCompactDialog
        onSuccess={fetchTransactions}
        contentClassName="max-w-[95vw] sm:max-w-lg"
        trigger={
          <Button
            size="icon"
            className="fixed bottom-28 right-4 z-50 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-float hover:scale-105 active:scale-95 transition-all duration-200 sm:hidden"
          >
            <Plus className="h-6 w-6" />
            <span className="sr-only">Nova transação</span>
          </Button>
        }
      />

      {/* Edit dialog */}
      <AddTransactionCompactDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setEditingTransaction(null); }}
        mode="edit"
        transactionId={editingTransaction?.id}
        initialFormData={editInitialFormData}
        contentClassName="max-w-[95vw] sm:max-w-lg"
        showInstallment={false}
        onSuccess={fetchTransactions}
      />

      {/* Bulk edit dialog */}
      <BulkEditDialog
        open={isBulkEditOpen}
        onOpenChange={setIsBulkEditOpen}
        selectedIds={Array.from(selectedTransactions)}
        categories={categories}
        onSuccess={() => { fetchTransactions(); setSelectedTransactions(new Set()); setSelectionMode(false); }}
      />

      {/* Recurring delete dialog */}
      <AlertDialog open={!!recurringDeleteTarget} onOpenChange={(open) => { if (!open) setRecurringDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transação recorrente</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>"{recurringDeleteTarget?.description}"</strong> faz parte de uma série recorrente. Como deseja excluir?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive/80 hover:bg-destructive text-white"
              onClick={() => { if (recurringDeleteTarget) handleDeleteSingle(recurringDeleteTarget.id); setRecurringDeleteTarget(null); }}
            >
              Apenas esta ocorrência
            </AlertDialogAction>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() => { if (recurringDeleteTarget?.recurring_series_id) handleDeleteSeries(recurringDeleteTarget.recurring_series_id); setRecurringDeleteTarget(null); }}
            >
              Esta e futuras não pagas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Transactions;
