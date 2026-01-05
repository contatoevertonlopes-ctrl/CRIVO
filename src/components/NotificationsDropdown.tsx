import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useSharedHousehold } from "@/hooks/useSharedHousehold";
import { transactionKeys } from "@/hooks/useTransactions";
import { bankAccountKeys } from "@/hooks/useBankAccounts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UpcomingBill {
  id: string;
  description: string;
  amount: number;
  date: string;
  daysUntilDue: number;
  type: string;
}

const NotificationsDropdown = () => {
  const { user } = useAuth();
  const { isShared, householdId, loading: householdLoading } = useSharedHousehold();
  const queryClient = useQueryClient();
  const [upcomingBills, setUpcomingBills] = useState<UpcomingBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchUpcomingBills = useCallback(async () => {
    if (!user) return;
    if (householdLoading) return;
    if (isShared && !householdId) return;

    try {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      let query = supabase
        .from("transactions")
        .select("id, description, amount, date, type, status")
        .in("status", ["pending", "em_aberto", "a_vencer"])
        .gte("date", today.toISOString().split("T")[0])
        .lte("date", nextWeek.toISOString().split("T")[0])
        .order("date", { ascending: true });

      query = isShared && householdId ? query.eq("household_id", householdId) : query.eq("user_id", user.id);

      const { data, error } = await query;

      if (error) throw error;

      const bills = (data || []).map((t) => {
        const dueDate = new Date(t.date + "T00:00:00");
        const diffTime = dueDate.getTime() - today.getTime();
        const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          id: t.id,
          description: t.description,
          amount: t.amount,
          date: t.date,
          daysUntilDue,
          type: t.type,
        };
      });

      setUpcomingBills(bills);
    } catch (error) {
      console.error("Error fetching upcoming bills:", error);
    } finally {
      setLoading(false);
    }
  }, [user, isShared, householdId, householdLoading]);

  useEffect(() => {
    fetchUpcomingBills();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchUpcomingBills, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchUpcomingBills]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Send browser notification for bills due today or tomorrow - only once per session
  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    if (upcomingBills.length === 0) return;

    const urgentBills = upcomingBills.filter(b => b.daysUntilDue <= 1);
    
    if (urgentBills.length > 0) {
      const bill = urgentBills[0];
      const notificationKey = `notification-sent-${bill.id}-${new Date().toDateString()}`;
      
      // Check if we already sent this notification today
      if (sessionStorage.getItem(notificationKey)) return;
      
      const title = bill.daysUntilDue === 0 ? "Conta vence hoje!" : "Conta vence amanhã!";
      
      new Notification(title, {
        body: `${bill.description}: R$ ${bill.amount.toFixed(2)}`,
        icon: "/favicon.ico",
        tag: `bill-${bill.id}`,
      });
      
      // Mark as sent for this session
      sessionStorage.setItem(notificationKey, "true");
    }
  }, [upcomingBills]);

  const markAsPaid = async (id: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from("transactions")
        // Use DB-compatible status value. 'paid' caused check-constraint violations.
        .update({ status: "pagamento_concluido" })
        .eq("id", id);

      if (error) throw error;

      toast.success("Conta marcada como paga!");

      // Update dashboard immediately: the Dashboard derives its numbers from `useTransactions`
      // (React Query cache). Without this, it may stay stale until a refetch (or F5).
      queryClient.setQueriesData({ queryKey: transactionKeys.all }, (oldData) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map((t) => (t && typeof t === "object" && "id" in t && (t as { id: string }).id === id
          ? { ...t, status: "pagamento_concluido" }
          : t
        ));
      });
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });

      // bank_accounts balances are updated by DB trigger; invalidate so UI picks it up immediately.
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.all });

      fetchUpcomingBills();
    } catch (error: unknown) {
      console.error("Error marking as paid:", error);
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error !== null && "message" in error
            ? String((error as { message: unknown }).message)
            : null;
      toast.error(message ? `Erro: ${message}` : "Erro ao atualizar status");
    } finally {
      setProcessingId((cur) => (cur === id ? null : cur));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const getDueBadge = (days: number) => {
    if (days === 0)
      return {
        text: "Vence hoje",
        class: "bg-destructive/15 text-destructive font-semibold",
      };
    if (days === 1)
      return {
        text: "Amanhã",
        class: "bg-[hsl(var(--warning)_/_0.15)] text-[hsl(var(--warning))] font-medium",
      };
    if (days <= 3)
      return {
        text: `${days} dias`,
        class: "bg-[hsl(var(--warning)_/_0.1)] text-[hsl(var(--warning))]",
      };
    return { text: `${days} dias`, class: "bg-secondary text-muted-foreground" };
  };

  const getTypeLabel = (type: string) => {
    return type === "income" ? { text: "Receber", class: "text-primary" } : { text: "Pagar", class: "text-destructive" };
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {upcomingBills.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {upcomingBills.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="p-3 border-b border-border">
          <h3 className="font-semibold text-sm">Compromissos Pendentes</h3>
          <p className="text-xs text-muted-foreground">Próximos 7 dias • Contas a pagar e receber</p>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto pr-1">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : upcomingBills.length === 0 ? (
            <div className="p-6 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">
                Nenhuma conta pendente nos próximos 7 dias
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {upcomingBills.map((bill) => {
                const badge = getDueBadge(bill.daysUntilDue);
                const typeInfo = getTypeLabel(bill.type);
                const isDueToday = bill.daysUntilDue === 0;
                return (
                  <div 
                    key={bill.id} 
                    className={`p-3 hover:bg-secondary/20 transition-colors ${
                      isDueToday ? "bg-destructive/10 border-l-2 border-l-destructive" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className={`w-4 h-4 flex-shrink-0 ${
                            isDueToday ? "text-destructive animate-pulse" : bill.daysUntilDue <= 1 ? "text-destructive" : "text-muted-foreground"
                          }`} />
                          <span className={`text-sm font-medium truncate ${isDueToday ? "text-destructive" : ""}`}>
                            {bill.description}
                          </span>
                        </div>
                        <div className="ml-6 flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                          <span className={`${typeInfo.class} font-medium`}>{typeInfo.text}</span>
                          <span aria-hidden>•</span>
                          <span>{formatDate(bill.date)}</span>
                        </div>
                        <div className="ml-6 mt-1">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap ${badge.class}`}
                          >
                            {badge.text}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-semibold ${typeInfo.class}`}>
                          {formatCurrency(bill.amount)}
                        </p>
                        <div className="mt-2">
                          <Button
                            size="sm"
                            onClick={() => markAsPaid(bill.id)}
                            disabled={processingId === bill.id}
                            aria-label={`Marcar ${bill.type === "income" ? "recebido" : "pago"}`}
                            className={`h-7 px-3 text-xs whitespace-nowrap ${processingId === bill.id ? "opacity-70 cursor-wait" : ""}`}
                          >
                            {processingId === bill.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Marcar {bill.type === "income" ? "recebido" : "pago"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {"Notification" in window && Notification.permission !== "granted" && (
          <div className="p-3 border-t border-border bg-secondary/20">
            <button
              onClick={() => Notification.requestPermission()}
              className="text-xs text-primary hover:underline"
            >
              Ativar notificações do navegador
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsDropdown;
