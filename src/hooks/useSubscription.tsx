import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

type SubscriptionRow = {
  plan: string;
  status: string;
  expires_at: string | null;
};

let sharedUserId: string | null = null;
let sharedChannel: ReturnType<typeof supabase.channel> | null = null;
let sharedRefCount = 0;
const sharedHandlers = new Set<(newData: SubscriptionRow) => void>();

const ensureSharedChannel = (userId: string) => {
  if (sharedChannel && sharedUserId === userId) return;

  if (sharedChannel) {
    supabase.removeChannel(sharedChannel);
    sharedChannel = null;
  }

  sharedUserId = userId;
  sharedChannel = supabase
    .channel(`subscription-changes:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "subscriptions",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const newData = payload.new as SubscriptionRow;
        sharedHandlers.forEach((handler) => handler(newData));
      },
    )
    .subscribe();
};

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
    } catch {
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

    ensureSharedChannel(user.id);
    sharedRefCount += 1;

    const handler = (newData: SubscriptionRow) => {
      setSubscription({
        subscribed: newData.status === "active" && newData.plan === "pro",
        planType: newData.plan === "pro" ? "monthly" : null,
        subscriptionEnd: newData.expires_at,
        loading: false,
      });
    };

    sharedHandlers.add(handler);

    return () => {
      sharedHandlers.delete(handler);
      sharedRefCount = Math.max(0, sharedRefCount - 1);

      if (sharedRefCount === 0 && sharedChannel) {
        supabase.removeChannel(sharedChannel);
        sharedChannel = null;
        sharedUserId = null;
      }
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
    } catch {
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
    } catch {
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
