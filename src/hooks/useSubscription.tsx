import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionState {
  subscribed: boolean;
  planType: "monthly" | "annual" | null;
  subscriptionEnd: string | null;
  loading: boolean;
}

export const useSubscription = () => {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionState>({
    subscribed: false,
    planType: null,
    subscriptionEnd: null,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!user || !session) {
      setSubscription({
        subscribed: false,
        planType: null,
        subscriptionEnd: null,
        loading: false,
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setSubscription({
        subscribed: data.subscribed || false,
        planType: data.plan_type || null,
        subscriptionEnd: data.subscription_end || null,
        loading: false,
      });
    } catch (error) {
      console.error("Error checking subscription:", error);
      setSubscription(prev => ({ ...prev, loading: false }));
    }
  }, [user, session]);

  // Initial check
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Realtime listener for subscription changes
  useEffect(() => {
    if (!user) return;

    console.log("[useSubscription] Setting up realtime listener for user:", user.id);

    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("[useSubscription] Realtime update received:", payload);
          
          const newData = payload.new as {
            plan: string;
            status: string;
            expires_at: string | null;
          };

          // Update subscription state immediately
          setSubscription({
            subscribed: newData.status === "active" && newData.plan === "pro",
            planType: newData.plan === "pro" ? "monthly" : null, // Default to monthly for admin-granted
            subscriptionEnd: newData.expires_at,
            loading: false,
          });

          console.log("[useSubscription] Subscription updated via realtime:", {
            plan: newData.plan,
            status: newData.status,
          });
        }
      )
      .subscribe((status) => {
        console.log("[useSubscription] Realtime subscription status:", status);
      });

    return () => {
      console.log("[useSubscription] Removing realtime channel");
      supabase.removeChannel(channel);
    };
  }, [user]);

  const createCheckout = async (priceType: "monthly" | "annual") => {
    if (!session) return null;

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceType },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data.url;
    } catch (error) {
      console.error("Error creating checkout:", error);
      return null;
    }
  };

  const openCustomerPortal = async () => {
    if (!session) return null;

    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data.url;
    } catch (error) {
      console.error("Error opening customer portal:", error);
      return null;
    }
  };

  return {
    ...subscription,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
};
