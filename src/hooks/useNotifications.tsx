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

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refetch: () => Promise<void>;
  requestBrowserPermission: () => Promise<boolean>;
  browserPermission: NotificationPermission | "default";
}

export const useNotifications = (): UseNotificationsReturn => {
  const { user } = useAuth();
  const { isShared, householdId, loading: householdLoading } = useSharedHousehold();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | "default">("default");
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Check browser notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  const requestBrowserPermission = useCallback(async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      toast.error("Seu navegador não suporta notificações push.");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);

      if (permission === "granted") {
        toast.success("Notificações ativadas!");
        return true;
      } else if (permission === "denied") {
        toast.error("Permissão negada. Ative nas configurações do navegador.");
        return false;
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast.error("Erro ao solicitar permissão");
      return false;
    }
  }, []);

  const sendBrowserNotification = useCallback((notification: Notification) => {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    try {
      const browserNotification = new window.Notification(notification.title || "Nova notificação", {
        body: notification.message,
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        tag: notification.id,
        requireInteraction: false,
      });

      browserNotification.onclick = () => {
        window.focus();
        if (notification.link) {
          window.location.href = notification.link;
        }
        browserNotification.close();
      };
    } catch (error) {
      console.error("Error sending browser notification:", error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    if (householdLoading) return;

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

  // Fetch notifications on mount and when household changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Set up Supabase Realtime subscription
  useEffect(() => {
    if (!user || householdLoading) return;

    // Clean up existing channel
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
          const newNotification = payload.new as Notification;
          
          // Add to local state
          setNotifications((prev) => [newNotification, ...prev]);
          
          // Show in-app toast
          toast(newNotification.title || "Nova notificação", {
            description: newNotification.message,
            duration: 5000,
          });

          // Send browser notification if tab is not focused
          if (document.hidden) {
            sendBrowserNotification(newNotification);
          }
        }
      );

    // Also listen for household notifications if shared
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
          const newNotification = payload.new as Notification;
          
          // Avoid duplicates if user_id matches
          if (newNotification.user_id === user.id) return;
          
          setNotifications((prev) => [newNotification, ...prev]);
          
          toast(newNotification.title || "Nova notificação", {
            description: newNotification.message,
            duration: 5000,
          });

          if (document.hidden) {
            sendBrowserNotification(newNotification);
          }
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
  }, [user, isShared, householdId, householdLoading, sendBrowserNotification]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      
      toast.success("Todas as notificações marcadas como lidas");
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, [user]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }, []);

  const clearAll = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setNotifications([]);
      toast.success("Todas as notificações foram removidas");
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refetch: fetchNotifications,
    requestBrowserPermission,
    browserPermission,
  };
};
