import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | "default";
  isSubscribed: boolean;
}

export const usePushNotifications = () => {
  const { toast } = useToast();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: "default",
    isSubscribed: false,
  });

  useEffect(() => {
    const isSupported = "Notification" in window && "serviceWorker" in navigator;
    setState(prev => ({
      ...prev,
      isSupported,
      permission: isSupported ? Notification.permission : "default",
    }));
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      toast({
        title: "Não suportado",
        description: "Seu navegador não suporta notificações push.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));

      if (permission === "granted") {
        toast({
          title: "Notificações ativadas!",
          description: "Você receberá o resumo semanal aos domingos às 20h.",
        });
        return true;
      } else if (permission === "denied") {
        toast({
          title: "Permissão negada",
          description: "Você pode ativar nas configurações do navegador.",
          variant: "destructive",
        });
        return false;
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast({
        title: "Erro ao solicitar permissão",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
      return false;
    }
  }, [state.isSupported, toast]);

  const sendTestNotification = useCallback((mode: "survival" | "prosperity") => {
    if (!state.isSupported || Notification.permission !== "granted") {
      toast({
        title: "Permissão necessária",
        description: "Ative as notificações primeiro.",
        variant: "destructive",
      });
      return;
    }

    const survivalMessage = {
      title: "📊 Resumo Semanal - Modo Sobrevivência",
      body: "Você resistiu! Esta semana suas reservas aumentaram em 2 dias. Estamos chegando lá. Bom descanso!",
      icon: "/pwa-192x192.png",
    };

    const prosperityMessage = {
      title: "🚀 Resumo Semanal - Modo Prosperidade",
      body: "Semana de crescimento! Você aportou R$ 1.250,00 rumo à sua liberdade financeira. Seu patrimônio agradece. Bom descanso!",
      icon: "/pwa-192x192.png",
    };

    const message = mode === "survival" ? survivalMessage : prosperityMessage;

    try {
      const notification = new Notification(message.title, {
        body: message.body,
        icon: message.icon,
        badge: "/pwa-192x192.png",
        tag: "sunday-summary",
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      toast({
        title: "Notificação enviada!",
        description: "Confira a notificação que apareceu.",
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      toast({
        title: "Erro ao enviar notificação",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  }, [state.isSupported, toast]);

  return {
    ...state,
    requestPermission,
    sendTestNotification,
  };
};
