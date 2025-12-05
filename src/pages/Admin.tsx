import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Users,
  CreditCard,
  TrendingUp,
  Shield,
  Search,
  Calendar,
  ArrowLeft,
  Crown,
  Ban,
  CheckCircle,
  XCircle,
  RefreshCw,
  DollarSign,
  Save,
  Loader2,
  Tag,
  Percent,
} from "lucide-react";

interface UserWithDetails {
  user_id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  subscription_status: string;
  subscription_plan: string;
  total_transactions: number;
  total_income: number;
  total_expenses: number;
}

interface RevenueData {
  total_users: number;
  active_subscriptions: number;
  total_revenue: number;
  monthly_revenue: number;
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [revenue, setRevenue] = useState<RevenueData>({
    total_users: 0,
    active_subscriptions: 0,
    total_revenue: 0,
    monthly_revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  // Pricing state
  const [monthlyPrice, setMonthlyPrice] = useState("29");
  const [annualPrice, setAnnualPrice] = useState("269");
  const [updatingMonthly, setUpdatingMonthly] = useState(false);
  const [updatingAnnual, setUpdatingAnnual] = useState(false);

  // Stripe product IDs
  const MONTHLY_PRODUCT_ID = "prod_TXoqM83X412xRF";
  const ANNUAL_PRODUCT_ID = "prod_TXoru4mtSgWkWf";

  // Coupon state
  const [couponName, setCouponName] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [couponDuration, setCouponDuration] = useState("once");
  const [durationMonths, setDurationMonths] = useState("");
  const [creatingCoupon, setCreatingCoupon] = useState(false);

  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isAdmin) {
        toast.error("Acesso negado. Você não tem permissão de administrador.");
        navigate("/");
      }
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  const fetchData = async () => {
    if (!isAdmin) return;

    setLoading(true);
    try {
      // Fetch all profiles with subscriptions
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) throw profilesError;

      const { data: subscriptions, error: subsError } = await supabase
        .from("subscriptions")
        .select("*");

      if (subsError) throw subsError;

      const { data: transactions, error: transError } = await supabase
        .from("transactions")
        .select("*");

      if (transError) throw transError;

      // Combine data
      const usersWithDetails: UserWithDetails[] = (profiles || []).map((profile) => {
        const userSub = subscriptions?.find((s) => s.user_id === profile.user_id);
        const userTransactions = transactions?.filter((t) => t.user_id === profile.user_id) || [];

        return {
          user_id: profile.user_id,
          full_name: profile.full_name,
          email: profile.user_id, // We'll need to get email from auth
          created_at: profile.created_at,
          subscription_status: userSub?.status || "inactive",
          subscription_plan: userSub?.plan || "free",
          total_transactions: userTransactions.length,
          total_income: userTransactions
            .filter((t) => t.type === "income")
            .reduce((sum, t) => sum + Number(t.amount), 0),
          total_expenses: userTransactions
            .filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + Number(t.amount), 0),
        };
      });

      setUsers(usersWithDetails);

      // Calculate revenue metrics
      const activeSubscriptions = subscriptions?.filter(
        (s) => s.status === "active" && s.plan !== "free"
      ).length || 0;

      // Assuming Pro plan is R$29/month
      const monthlyRevenue = activeSubscriptions * 29;

      setRevenue({
        total_users: profiles?.length || 0,
        active_subscriptions: activeSubscriptions,
        total_revenue: monthlyRevenue * 12, // Estimated annual
        monthly_revenue: monthlyRevenue,
      });
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const filteredUsers = users.filter((u) => {
    let matches = true;

    if (search) {
      const searchLower = search.toLowerCase();
      matches =
        matches &&
        (u.full_name?.toLowerCase().includes(searchLower) ||
          u.user_id.toLowerCase().includes(searchLower));
    }

    if (statusFilter !== "all") {
      matches = matches && u.subscription_status === statusFilter;
    }

    if (planFilter !== "all") {
      matches = matches && u.subscription_plan === planFilter;
    }

    if (dateFrom) {
      matches = matches && new Date(u.created_at) >= new Date(dateFrom);
    }

    if (dateTo) {
      matches = matches && new Date(u.created_at) <= new Date(dateTo);
    }

    return matches;
  });

  const updateSubscription = async (userId: string, status: string, plan: string) => {
    try {
      // Check if subscription exists
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (existingSub) {
        // Update existing subscription
        const { error } = await supabase
          .from("subscriptions")
          .update({ status, plan, updated_at: new Date().toISOString() })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Insert new subscription
        const { error } = await supabase
          .from("subscriptions")
          .insert({
            user_id: userId,
            status,
            plan,
            started_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      toast.success("Assinatura atualizada com sucesso!");
      fetchData();
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast.error("Erro ao atualizar assinatura");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const updatePrice = async (productId: string, amount: number, interval: "month" | "year") => {
    const setUpdating = interval === "month" ? setUpdatingMonthly : setUpdatingAnnual;
    setUpdating(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão não encontrada");

      const { data, error } = await supabase.functions.invoke("update-price", {
        body: { productId, newAmount: amount, interval },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success(`Preço ${interval === "month" ? "mensal" : "anual"} atualizado com sucesso!`);
    } catch (error) {
      console.error("Error updating price:", error);
      toast.error("Erro ao atualizar preço no Stripe");
    } finally {
      setUpdating(false);
    }
  };

  const createCoupon = async () => {
    if (!couponName || !discountValue) {
      toast.error("Preencha o nome e o valor do desconto");
      return;
    }

    setCreatingCoupon(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão não encontrada");

      const { data, error } = await supabase.functions.invoke("create-coupon", {
        body: { 
          name: couponName, 
          discountType, 
          discountValue: parseFloat(discountValue),
          duration: couponDuration,
          durationInMonths: couponDuration === "repeating" ? durationMonths : undefined,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success(`Cupom "${couponName}" criado com sucesso!`);
      setCouponName("");
      setDiscountValue("");
      setDurationMonths("");
    } catch (error) {
      console.error("Error creating coupon:", error);
      toast.error("Erro ao criar cupom no Stripe");
    } finally {
      setCreatingCoupon(false);
    }
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Verificando permissões...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Voltar</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Painel Administrativo</h1>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Gerencie usuários, planos e métricas
                </p>
              </div>
            </div>
          </div>
          <Button onClick={fetchData} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-card/80 to-background border border-secondary p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">Usuários</span>
            </div>
            <p className="text-xl sm:text-3xl font-bold">{revenue.total_users}</p>
          </div>

          <div className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-card/80 to-background border border-secondary p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">Assinaturas</span>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-primary">{revenue.active_subscriptions}</p>
          </div>

          <div className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-card/80 to-background border border-secondary p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">Receita/Mês</span>
            </div>
            <p className="text-lg sm:text-3xl font-bold text-green-400">{formatCurrency(revenue.monthly_revenue)}</p>
          </div>

          <div className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-card/80 to-background border border-secondary p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">Receita/Ano</span>
            </div>
            <p className="text-lg sm:text-3xl font-bold text-yellow-400">{formatCurrency(revenue.total_revenue)}</p>
          </div>
        </div>

        {/* Pricing Management */}
        <div className="rounded-xl sm:rounded-2xl bg-gradient-to-bl from-background to-black border border-secondary p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Gerenciar Preços da Assinatura</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Monthly Price */}
            <div className="space-y-3 p-4 rounded-xl bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-primary" />
                <Label className="font-medium">Plano Mensal</Label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">R$</span>
                <Input
                  type="number"
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(e.target.value)}
                  className="flex-1"
                  min="0"
                  step="0.01"
                />
              </div>
              <Button 
                onClick={() => updatePrice(MONTHLY_PRODUCT_ID, parseFloat(monthlyPrice), "month")}
                disabled={updatingMonthly}
                className="w-full gap-2"
                size="sm"
              >
                {updatingMonthly ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Atualizar Preço Mensal
              </Button>
            </div>

            {/* Annual Price */}
            <div className="space-y-3 p-4 rounded-xl bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-400" />
                <Label className="font-medium">Plano Anual</Label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">R$</span>
                <Input
                  type="number"
                  value={annualPrice}
                  onChange={(e) => setAnnualPrice(e.target.value)}
                  className="flex-1"
                  min="0"
                  step="0.01"
                />
              </div>
              <Button 
                onClick={() => updatePrice(ANNUAL_PRODUCT_ID, parseFloat(annualPrice), "year")}
                disabled={updatingAnnual}
                className="w-full gap-2"
                size="sm"
              >
                {updatingAnnual ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Atualizar Preço Anual
              </Button>
            </div>
          </div>
        </div>

        {/* Coupon Management */}
        <div className="rounded-xl sm:rounded-2xl bg-gradient-to-bl from-background to-black border border-secondary p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Criar Cupom de Desconto</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Nome do Cupom</Label>
              <Input
                placeholder="Ex: DESCONTO10"
                value={couponName}
                onChange={(e) => setCouponName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Desconto</Label>
              <Select value={discountType} onValueChange={setDiscountType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Porcentagem (%)</SelectItem>
                  <SelectItem value="amount">Valor Fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{discountType === "percent" ? "Desconto (%)" : "Desconto (R$)"}</Label>
              <div className="flex items-center gap-2">
                {discountType === "percent" ? (
                  <Percent className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <span className="text-muted-foreground">R$</span>
                )}
                <Input
                  type="number"
                  placeholder={discountType === "percent" ? "10" : "20.00"}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  min="0"
                  max={discountType === "percent" ? "100" : undefined}
                  step={discountType === "percent" ? "1" : "0.01"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Duração</Label>
              <Select value={couponDuration} onValueChange={setCouponDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Uma vez</SelectItem>
                  <SelectItem value="repeating">Repetir por X meses</SelectItem>
                  <SelectItem value="forever">Para sempre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {couponDuration === "repeating" && (
              <div className="space-y-2">
                <Label>Quantidade de Meses</Label>
                <Input
                  type="number"
                  placeholder="3"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  min="1"
                />
              </div>
            )}

            <div className="flex items-end">
              <Button 
                onClick={createCoupon}
                disabled={creatingCoupon || !couponName || !discountValue}
                className="w-full gap-2"
              >
                {creatingCoupon ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Tag className="w-4 h-4" />
                )}
                Criar Cupom
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl sm:rounded-2xl bg-gradient-to-bl from-background to-black border border-secondary p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            <div className="relative col-span-2 sm:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os planos</SelectItem>
                <SelectItem value="free">Gratuito</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Data inicial
              </Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
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
              />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-3xl bg-gradient-to-bl from-background to-black border border-secondary shadow-[0_18px_45px_rgba(3,7,18,0.65)] overflow-hidden">
          <div className="p-4 border-b border-secondary">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              Usuários ({filteredUsers.length})
            </h3>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Carregando...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum usuário encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-secondary bg-secondary/30">
                    <th className="text-left py-4 px-4 font-medium">Usuário</th>
                    <th className="text-left py-4 px-4 font-medium">Data Cadastro</th>
                    <th className="text-left py-4 px-4 font-medium">Plano</th>
                    <th className="text-left py-4 px-4 font-medium">Status</th>
                    <th className="text-left py-4 px-4 font-medium">Transações</th>
                    <th className="text-left py-4 px-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.user_id}
                      className="border-b border-secondary/50 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium">{u.full_name || "Sem nome"}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {u.user_id.substring(0, 8)}...
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">{formatDate(u.created_at)}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${
                            u.subscription_plan === "pro"
                              ? "bg-primary/14 text-green-200"
                              : "bg-secondary/50 text-muted-foreground"
                          }`}
                        >
                          {u.subscription_plan === "pro" && <Crown className="w-3 h-3" />}
                          {u.subscription_plan === "pro" ? "Pro" : "Gratuito"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${
                            u.subscription_status === "active"
                              ? "bg-primary/14 text-green-200"
                              : "bg-destructive/10 text-red-200"
                          }`}
                        >
                          {u.subscription_status === "active" ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {u.subscription_status === "active" ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="py-4 px-4">{u.total_transactions}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {u.subscription_plan === "free" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateSubscription(u.user_id, "active", "pro")}
                              className="text-xs gap-1"
                            >
                              <Crown className="w-3 h-3" />
                              Ativar Pro
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateSubscription(u.user_id, "active", "free")}
                              className="text-xs gap-1 text-destructive"
                            >
                              <Ban className="w-3 h-3" />
                              Remover Pro
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
