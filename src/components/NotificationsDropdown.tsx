import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, AlertCircle, CheckCircle2 } from "lucide-react";
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
  const [upcomingBills, setUpcomingBills] = useState<UpcomingBill[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUpcomingBills = async () => {
    if (!user) return;

    try {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const { data, error } = await supabase
        .from("transactions")
        .select("id, description, amount, date, type, status")
        .eq("user_id", user.id)
        .in("status", ["pending", "em_aberto", "a_vencer"])
        .gte("date", today.toISOString().split("T")[0])
        .lte("date", nextWeek.toISOString().split("T")[0])
        .order("date", { ascending: true });

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
  };

  useEffect(() => {
    fetchUpcomingBills();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchUpcomingBills, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

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
    try {
      const { error } = await supabase
        .from("transactions")
        // Use DB-compatible status value. 'paid' caused check-constraint violations.
        .update({ status: "pagamento_concluido" })
        .eq("id", id);

      if (error) throw error;

      toast.success("Conta marcada como paga!");
      fetchUpcomingBills();
    } catch (error) {
      console.error("Error marking as paid:", error);
      // show more info when available
      // Supabase returns an object with message/code/details
      if (error && typeof error === "object" && "message" in (error as any)) {
        toast.error(`Erro: ${(error as any).message}`);
      } else {
        toast.error("Erro ao atualizar status");
      }
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
    if (days === 0) return { text: "🔴 Vence Hoje!", class: "bg-destructive text-destructive-foreground font-bold animate-pulse" };
    if (days === 1) return { text: "⚠️ Amanhã", class: "bg-yellow-500/20 text-yellow-500 font-medium" };
    if (days <= 3) return { text: `${days} dias`, class: "bg-orange-500/20 text-orange-500" };
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
      <DropdownMenuContent align="end" className="w-80 p-0 bg-background border-border z-50">
        <div className="p-3 border-b border-border">
          <h3 className="font-semibold text-sm">Compromissos Pendentes</h3>
          <p className="text-xs text-muted-foreground">Próximos 7 dias • Contas a pagar e receber</p>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto">
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className={`w-4 h-4 flex-shrink-0 ${
                            isDueToday ? "text-destructive animate-pulse" : bill.daysUntilDue <= 1 ? "text-destructive" : "text-muted-foreground"
                          }`} />
                          <span className={`text-sm font-medium truncate ${isDueToday ? "text-destructive" : ""}`}>
                            {bill.description}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground ml-6">
                          <span className={`${typeInfo.class} font-medium`}>{typeInfo.text}</span>
                          <span>•</span>
                          <span>{formatDate(bill.date)}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${badge.class}`}>
                            {badge.text}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-semibold ${typeInfo.class}`}>
                          {formatCurrency(bill.amount)}
                        </p>
                        <button
                          onClick={() => markAsPaid(bill.id)}
                          className="text-[10px] text-primary hover:underline mt-1"
                        >
                          Marcar {bill.type === "income" ? "recebido" : "pago"}
                        </button>
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
