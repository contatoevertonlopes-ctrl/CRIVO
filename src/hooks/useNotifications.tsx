import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSharedHousehold } from "@/hooks/useSharedHousehold";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface Notification {
  id: string;
  user_id: string;
  household_id?: string | null;
  message: string;
  title?: string | null;
  type?: string | null;
  is_read: boolean;
  link?: string | null;
  created_at: string;
}

export interface UpcomingBill {
  id: string;
  description: string;
  amount: number;
  date: string;
  daysUntilDue: number;
  type: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  upcomingBills: UpcomingBill[];
  unreadCount: number;
  billsCount: number;
  loading: boolean;
  billsLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refetch: () => Promise<void>;
  markBillAsPaid: (id: string, type: string) => Promise<void>;
  processingBillId: string | null;
  // Push
  pushPermission: NotificationPermission | "default";
  isPushSupported: boolean;
  subscribeToPush: () => Promise<boolean>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const { user } = useAuth();
  const { isShared, householdId, loading: householdLoading } = useSharedHousehold();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [upcomingBills, setUpcomingBills] = useState<UpcomingBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [billsLoading, setBillsLoading] = useState(true);
  const [processingBillId, setProcessingBillId] = useState<string | null>(null);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "default">("default");
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isPushSupported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;

  // Check permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  // Register custom push SW
  useEffect(() => {
    if (!isPushSupported) return;
    navigator.serviceWorker.register("/sw-push.js", { scope: "/" }).catch((err) => {
      console.error("[Push SW] Registration failed:", err);
    });
  }, [isPushSupported]);

  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported || !user) {
      toast.error("Seu navegador não suporta notificações push.");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission !== "granted") {
        if (permission === "denied") {
          toast.error("Permissão negada. Ative nas configurações do navegador.");
        }
        return false;
      }

      // Get VAPID public key
      const vapidRes = await supabase.functions.invoke("get-vapid-key");
      if (vapidRes.error || !vapidRes.data?.publicKey) {
        toast.error("Erro ao obter chave de notificações.");
        return false;
      }

      const publicKey = vapidRes.data.publicKey;

      // Convert VAPID key to Uint8Array
      const padding = "=".repeat((4 - (publicKey.length % 4)) % 4);
      const base64 = (publicKey + padding).replace(/-/g, "+").replace(/_/g, "/");
      const rawData = atob(base64);
      const applicationServerKey = Uint8Array.from(rawData, (c) => c.charCodeAt(0));

      // Subscribe via service worker
      const registration = await navigator.serviceWorker.ready;
      const pushManager = (registration as any).pushManager;
      const subscription = await pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Send subscription to backend
      const { error } = await supabase.functions.invoke("subscribe-push", {
        body: { subscription: subscription.toJSON() },
      });

      if (error) throw error;

      toast.success("Notificações push ativadas! Você receberá alertas mesmo com o app fechado.");
      return true;
    } catch (error) {
      console.error("Error subscribing to push:", error);
      toast.error("Erro ao ativar notificações push.");
      return false;
    }
  }, [isPushSupported, user]);

  // Fetch notifications from DB
  const fetchNotifications = useCallback(async () => {
    if (!user || householdLoading) return;

    try {
      let query = supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (isShared && householdId) {
        query = query.or(`user_id.eq.${user.id},household_id.eq.${householdId}`);
      } else {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user, isShared, householdId, householdLoading]);

  // Fetch upcoming bills (7 days)
  const fetchUpcomingBills = useCallback(async () => {
    if (!user || householdLoading) return;
    if (isShared && !householdId) return;

    try {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      let query = supabase
        .from("transactions")
        .select("id, description, amount, date, type, status")
        .in("status", ["pending", "upcoming", "em_aberto", "a_vencer"])
        .gte("date", today.toISOString().split("T")[0])
        .lte("date", nextWeek.toISOString().split("T")[0])
        .order("date", { ascending: true });

      query = isShared && householdId
        ? query.eq("household_id", householdId)
        : query.eq("user_id", user.id);

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
      setBillsLoading(false);
    }
  }, [user, isShared, householdId, householdLoading]);

  useEffect(() => {
    fetchNotifications();
    fetchUpcomingBills();
  }, [fetchNotifications, fetchUpcomingBills]);

  // Realtime subscription for new notifications
  useEffect(() => {
    if (!user || householdLoading) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on<Notification>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as Notification;
          setNotifications((prev) => [n, ...prev]);
          toast(n.title || "Nova notificação", {
            description: n.message,
            duration: 5000,
          });
        }
      );

    if (isShared && householdId) {
      channel.on<Notification>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          const n = payload.new as Notification;
          if (n.user_id === user.id) return;
          setNotifications((prev) => [n, ...prev]);
          toast(n.title || "Nova notificação", {
            description: n.message,
            duration: 5000,
          });
        }
      );
    }

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, isShared, householdId, householdLoading]);

  const markAsRead = useCallback(async (id: string) => {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    if (!error) setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("Todas marcadas como lidas");
    }
  }, [user]);

  const deleteNotification = useCallback(async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (!error) setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase.from("notifications").delete().eq("user_id", user.id);
    if (!error) {
      setNotifications([]);
      toast.success("Todas as notificações removidas");
    }
  }, [user]);

  const markBillAsPaid = useCallback(async (id: string, type: string) => {
    setProcessingBillId(id);
    try {
      const { error } = await supabase
        .from("transactions")
        .update({ status: "paid" })
        .eq("id", id);
      if (error) throw error;
      toast.success(type === "income" ? "Recebimento confirmado!" : "Conta marcada como paga!");
      fetchUpcomingBills();
    } catch (error) {
      console.error("Error marking as paid:", error);
      toast.error("Erro ao atualizar status");
    } finally {
      setProcessingBillId(null);
    }
  }, [fetchUpcomingBills]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const billsCount = upcomingBills.length;

  return {
    notifications,
    upcomingBills,
    unreadCount,
    billsCount,
    loading,
    billsLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refetch: fetchNotifications,
    markBillAsPaid,
    processingBillId,
    pushPermission,
    isPushSupported,
    subscribeToPush,
  };
};
