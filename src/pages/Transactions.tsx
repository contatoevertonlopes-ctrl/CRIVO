import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, Plus, Edit2, Trash2, ArrowLeft, Filter, Download } from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  status: "confirmed" | "pending" | "paid";
}

const Transactions = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    type: "expense" as "income" | "expense",
    status: "pending" as "confirmed" | "pending" | "paid",
    date: new Date().toISOString().split("T")[0],
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

    setFilteredTransactions(filtered);
  }, [transactions, search, typeFilter, statusFilter, categoryFilter]);

  const categories = [...new Set(transactions.map((t) => t.category))];

  const handleAdd = async () => {
    if (!user || !formData.description || !formData.amount || !formData.category) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        type: formData.type,
        status: formData.status,
        date: formData.date,
      });

      if (error) throw error;

      toast.success("Transação adicionada com sucesso!");
      setIsAddDialogOpen(false);
      resetForm();
      fetchTransactions();
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Erro ao adicionar transação");
    }
  };

  const handleEdit = async () => {
    if (!editingTransaction) return;

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
        })
        .eq("id", editingTransaction.id);

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

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      description: transaction.description,
      amount: transaction.amount.toString(),
      category: transaction.category,
      type: transaction.type,
      status: transaction.status,
      date: transaction.date,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      category: "",
      type: "expense",
      status: "pending",
      date: new Date().toISOString().split("T")[0],
    });
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
      t.status === "confirmed" ? "Confirmado" : t.status === "paid" ? "Pago" : "Pendente",
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "transacoes.csv";
    link.click();
    toast.success("Arquivo exportado com sucesso!");
  };

  const totals = {
    income: filteredTransactions.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0),
    expense: filteredTransactions.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amount, 0),
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const TransactionForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Descrição *</Label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Ex: Salário, Aluguel..."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valor *</Label>
          <Input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0,00"
          />
        </div>
        <div className="space-y-2">
          <Label>Categoria *</Label>
          <Input
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="Ex: Serviços"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as "income" | "expense" })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Entrada</SelectItem>
              <SelectItem value="expense">Saída</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as "confirmed" | "pending" | "paid" })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Data</Label>
        <Input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
      </div>
      <Button onClick={onSubmit} className="w-full bg-primary hover:bg-primary/90">
        {submitLabel}
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-4 lg:p-8 lg:ml-64">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <div>
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Voltar</span>
              </button>
              <h1 className="text-2xl lg:text-3xl font-bold">Transações</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Gerencie todas as suas entradas e saídas
              </p>
            </div>
            <div className="flex gap-2">
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
                  </DialogHeader>
                  <TransactionForm onSubmit={handleAdd} submitLabel="Adicionar" />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-2xl bg-gradient-to-bl from-background to-black border border-secondary p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Entradas</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totals.income)}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-bl from-background to-black border border-secondary p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Saídas</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(totals.expense)}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-bl from-background to-black border border-secondary p-4">
              <p className="text-sm text-muted-foreground mb-1">Saldo</p>
              <p className={`text-2xl font-bold ${totals.income - totals.expense >= 0 ? "text-primary" : "text-destructive"}`}>
                {formatCurrency(totals.income - totals.expense)}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-2xl bg-gradient-to-bl from-background to-black border border-secondary p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="income">Entradas</SelectItem>
                  <SelectItem value="expense">Saídas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="rounded-3xl bg-gradient-to-bl from-background to-black border border-secondary shadow-[0_18px_45px_rgba(3,7,18,0.65)] overflow-hidden">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Carregando...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma transação encontrada
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b border-secondary bg-secondary/30">
                      <th className="text-left py-4 px-4 font-medium">Data</th>
                      <th className="text-left py-4 px-4 font-medium">Descrição</th>
                      <th className="text-left py-4 px-4 font-medium">Categoria</th>
                      <th className="text-left py-4 px-4 font-medium">Tipo</th>
                      <th className="text-left py-4 px-4 font-medium">Valor</th>
                      <th className="text-left py-4 px-4 font-medium">Status</th>
                      <th className="text-left py-4 px-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-secondary/50 hover:bg-secondary/30 transition-colors"
                      >
                        <td className="py-4 px-4">{formatDate(transaction.date)}</td>
                        <td className="py-4 px-4 font-medium">{transaction.description}</td>
                        <td className="py-4 px-4">{transaction.category}</td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center justify-center text-xs px-2.5 py-1 rounded-full ${
                              transaction.type === "income"
                                ? "bg-primary/15 text-green-300"
                                : "bg-destructive/15 text-red-300"
                            }`}
                          >
                            {transaction.type === "income" ? "Entrada" : "Saída"}
                          </span>
                        </td>
                        <td className={`py-4 px-4 font-medium ${transaction.type === "income" ? "text-primary" : "text-destructive"}`}>
                          {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center justify-center text-xs px-2.5 py-1 rounded-full ${
                              transaction.status === "confirmed" || transaction.status === "paid"
                                ? "bg-primary/15 text-green-300"
                                : "bg-warning/15 text-yellow-300"
                            }`}
                          >
                            {transaction.status === "confirmed"
                              ? "Confirmado"
                              : transaction.status === "paid"
                              ? "Pago"
                              : "Pendente"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditDialog(transaction)}
                              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(transaction.id)}
                              className="p-2 rounded-lg hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Transação</DialogTitle>
              </DialogHeader>
              <TransactionForm onSubmit={handleEdit} submitLabel="Salvar Alterações" />
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
};

export default Transactions;
