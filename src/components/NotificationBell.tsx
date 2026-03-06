import { useState } from "react";
import {
  Bell, Check, CheckCheck, Trash2, ExternalLink,
  AlertCircle, Loader2, BellRing
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, Notification, UpcomingBill } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/formatCurrency";

// ── Notification Item ──
const NotificationItem = ({
  notification,
  onMarkAsRead,
  onDelete,
  onNavigate,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (link: string) => void;
}) => {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <div
      className={cn(
        "p-3 border-b border-border/50 hover:bg-secondary/30 transition-colors",
        !notification.is_read && "bg-primary/5 border-l-2 border-l-primary"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {notification.title && (
            <p className="text-sm font-medium truncate">{notification.title}</p>
          )}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">{timeAgo}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {notification.link && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onNavigate(notification.link!)}>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
          {!notification.is_read && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMarkAsRead(notification.id)}>
              <Check className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(notification.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Bill Item ──
const BillItem = ({
  bill,
  onMarkPaid,
  processing,
}: {
  bill: UpcomingBill;
  onMarkPaid: (id: string, type: string) => void;
  processing: boolean;
}) => {
  const isDueToday = bill.daysUntilDue === 0;
  const typeLabel = bill.type === "income" ? "Receber" : "Pagar";
  const typeColor = bill.type === "income" ? "text-primary" : "text-destructive";

  const formatDate = (d: string) => {
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const badge = isDueToday
    ? { text: "Vence hoje", cls: "bg-destructive/15 text-destructive font-semibold" }
    : bill.daysUntilDue === 1
    ? { text: "Amanhã", cls: "bg-[hsl(var(--warning)_/_0.15)] text-[hsl(var(--warning))] font-medium" }
    : bill.daysUntilDue <= 3
    ? { text: `${bill.daysUntilDue} dias`, cls: "bg-[hsl(var(--warning)_/_0.1)] text-[hsl(var(--warning))]" }
    : { text: `${bill.daysUntilDue} dias`, cls: "bg-secondary text-muted-foreground" };

  return (
    <div
      className={cn(
        "p-3 border-b border-border/50 hover:bg-secondary/30 transition-colors",
        isDueToday && "bg-destructive/10 border-l-2 border-l-destructive"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle
              className={cn(
                "w-4 h-4 flex-shrink-0",
                isDueToday ? "text-destructive animate-pulse" : "text-muted-foreground"
              )}
            />
            <span className={cn("text-sm font-medium truncate", isDueToday && "text-destructive")}>
              {bill.description}
            </span>
          </div>
          <div className="ml-6 flex items-center gap-2 text-xs text-muted-foreground">
            <span className={cn(typeColor, "font-medium")}>{typeLabel}</span>
            <span>•</span>
            <span>{formatDate(bill.date)}</span>
          </div>
          <div className="ml-6 mt-1">
            <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px]", badge.cls)}>
              {badge.text}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={cn("text-sm font-semibold", typeColor)}>{formatCurrency(bill.amount)}</p>
          <Button
            size="sm"
            onClick={() => onMarkPaid(bill.id, bill.type)}
            disabled={processing}
            className="h-7 px-3 text-xs mt-1"
          >
            {processing && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
            {bill.type === "income" ? "Recebido" : "Pago"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Unified Bell Component ──
const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const {
    notifications,
    upcomingBills,
    unreadCount,
    billsCount,
    loading,
    billsLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    markBillAsPaid,
    processingBillId,
    pushPermission,
    isPushSupported,
    subscribeToPush,
  } = useNotifications();

  const totalBadge = unreadCount + billsCount;

  const handleNavigate = (link: string) => {
    setOpen(false);
    if (link.startsWith("http")) {
      window.open(link, "_blank");
    } else {
      navigate(link);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalBadge > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {totalBadge > 99 ? "99+" : totalBadge}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[340px] p-0" sideOffset={8}>
        <Tabs defaultValue="alerts" className="w-full">
          <div className="border-b border-border px-3 pt-3 pb-0">
            <TabsList className="w-full h-9 bg-secondary/50">
              <TabsTrigger value="alerts" className="flex-1 text-xs gap-1.5">
                <BellRing className="h-3.5 w-3.5" />
                Alertas
                {unreadCount > 0 && (
                  <span className="ml-1 bg-destructive text-destructive-foreground text-[10px] rounded-full px-1.5 min-w-[18px] text-center">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="bills" className="flex-1 text-xs gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Compromissos
                {billsCount > 0 && (
                  <span className="ml-1 bg-destructive text-destructive-foreground text-[10px] rounded-full px-1.5 min-w-[18px] text-center">
                    {billsCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Alerts Tab ── */}
          <TabsContent value="alerts" className="mt-0">
            {unreadCount > 0 && (
              <div className="px-3 py-2 border-b border-border flex justify-end">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllAsRead}>
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                  Marcar todas
                </Button>
              </div>
            )}
            <ScrollArea className="max-h-[300px]">
              {loading ? (
                <div className="p-6 text-center text-sm text-muted-foreground">Carregando...</div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    onNavigate={handleNavigate}
                  />
                ))
              )}
            </ScrollArea>
          </TabsContent>

          {/* ── Bills Tab ── */}
          <TabsContent value="bills" className="mt-0">
            <ScrollArea className="max-h-[300px]">
              {billsLoading ? (
                <div className="p-6 text-center text-sm text-muted-foreground">Carregando...</div>
              ) : upcomingBills.length === 0 ? (
                <div className="p-6 text-center">
                  <Check className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma conta pendente nos próximos 7 dias
                  </p>
                </div>
              ) : (
                upcomingBills.map((bill) => (
                  <BillItem
                    key={bill.id}
                    bill={bill}
                    onMarkPaid={markBillAsPaid}
                    processing={processingBillId === bill.id}
                  />
                ))
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Push CTA */}
        {isPushSupported && pushPermission !== "granted" && (
          <div className="p-3 border-t border-border bg-secondary/20">
            <button onClick={subscribeToPush} className="text-xs text-primary hover:underline flex items-center gap-1.5">
              <BellRing className="h-3.5 w-3.5" />
              Ativar notificações push (mesmo com o app fechado)
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
