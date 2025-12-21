import { useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useHouseholdId } from "@/hooks/useHouseholdId";
import { useSharedHousehold } from "@/hooks/useSharedHousehold";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Card {
  id: string;
  user_id: string;
  household_id: string | null;
  name: string;
  last_four_digits: string | null;
  brand: string;
  color: string;
  credit_limit: number;
  closing_day: number;
  due_day: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CardTransaction {
  id: string;
  card_id: string;
  transaction_id: string | null;
  user_id: string;
  household_id: string | null;
  description: string;
  amount: number;
  purchase_date: string;
  installment_number: number;
  total_installments: number;
  parent_card_transaction_id: string | null;
  billing_month: string;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface CardBill {
  id: string;
  card_id: string;
  user_id: string;
  household_id: string | null;
  billing_month: string;
  total_amount: number;
  due_date: string;
  status: "open" | "closed" | "paid";
  transaction_id: string | null;
  closed_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CardWithBill extends Card {
  currentBill: number;
  availableLimit: number;
  nextDueDate: Date | null;
  isBestDayToBuy: boolean;
}

// Query key factory for consistent cache keys
export const cardKeys = {
  all: ["cards"] as const,
  list: (userId: string | undefined, householdId: string | null | undefined, isShared: boolean) =>
    [...cardKeys.all, "list", { userId, householdId, isShared }] as const,
  transactions: (userId: string | undefined, householdId: string | null | undefined, isShared: boolean) =>
    [...cardKeys.all, "transactions", { userId, householdId, isShared }] as const,
};

/**
 * Centralized hook for fetching cards with React Query caching.
 * - Caches cards for 5 minutes (staleTime)
 * - Keeps cache for 30 minutes (gcTime)
 * - Automatically refetches when user/household changes
 * - Provides invalidation method for mutations
 */
export const useCards = () => {
  const { user } = useAuth();
  const { householdId } = useHouseholdId();
  const { isShared, loading: householdLoading } = useSharedHousehold();
  const queryClient = useQueryClient();

  const cardsQueryKey = cardKeys.list(user?.id, householdId, isShared);
  const transactionsQueryKey = cardKeys.transactions(user?.id, householdId, isShared);

  // Fetch cards
  const cardsQuery = useQuery({
    queryKey: cardsQueryKey,
    queryFn: async (): Promise<Card[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("cards")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return (data as Card[]) || [];
    },
    enabled: !!user && !householdLoading,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch card transactions
  const transactionsQuery = useQuery({
    queryKey: transactionsQueryKey,
    queryFn: async (): Promise<CardTransaction[]> => {
      if (!user) return [];

      const today = new Date();
      const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const { data, error } = await supabase
        .from("card_transactions")
        .select("*")
        .gte("billing_month", currentMonth.toISOString().split("T")[0])
        .order("billing_month");

      if (error) throw error;
      return (data as CardTransaction[]) || [];
    },
    enabled: !!user && !householdLoading,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Calculate cards with bill info
  const cards: CardWithBill[] = useMemo(() => {
    const rawCards = cardsQuery.data || [];
    const rawTransactions = transactionsQuery.data || [];
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return rawCards.map((card: Card) => {
      const cardTxs = rawTransactions.filter(
        (tx: CardTransaction) => tx.card_id === card.id && !tx.is_paid
      );

      const currentMonthTxs = cardTxs.filter((tx: CardTransaction) => {
        const txMonth = new Date(tx.billing_month);
        return (
          txMonth.getMonth() === currentMonth.getMonth() &&
          txMonth.getFullYear() === currentMonth.getFullYear()
        );
      });

      const currentBill = currentMonthTxs.reduce(
        (sum: number, tx: CardTransaction) => sum + Number(tx.amount),
        0
      );
      const availableLimit = card.credit_limit - currentBill;

      const dueDate = new Date(today.getFullYear(), today.getMonth(), card.due_day);
      if (today.getDate() > card.due_day) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }

      const dayAfterClosing = (card.closing_day % 31) + 1;
      const isBestDayToBuy =
        today.getDate() === dayAfterClosing ||
        today.getDate() === dayAfterClosing + 1 ||
        today.getDate() === dayAfterClosing + 2;

      return {
        ...card,
        currentBill,
        availableLimit,
        nextDueDate: dueDate,
        isBestDayToBuy,
      };
    });
  }, [cardsQuery.data, transactionsQuery.data]);

  const cardTransactions = transactionsQuery.data || [];

  // Invalidate all card-related cache
  const invalidateCards = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: cardKeys.all });
  }, [queryClient]);

  // Create card mutation
  const createCardMutation = useMutation({
    mutationFn: async (
      cardData: Omit<Card, "id" | "user_id" | "household_id" | "created_at" | "updated_at">
    ) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("cards")
        .insert({
          ...cardData,
          user_id: user.id,
          household_id: householdId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Cartão cadastrado com sucesso!");
      invalidateCards();
    },
    onError: (error) => {
      console.error("Error creating card:", error);
      toast.error("Erro ao cadastrar cartão");
    },
  });

  // Update card mutation
  const updateCardMutation = useMutation({
    mutationFn: async ({ id, cardData }: { id: string; cardData: Partial<Card> }) => {
      const { error } = await supabase.from("cards").update(cardData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cartão atualizado com sucesso!");
      invalidateCards();
    },
    onError: (error) => {
      console.error("Error updating card:", error);
      toast.error("Erro ao atualizar cartão");
    },
  });

  // Delete card mutation (soft delete)
  const deleteCardMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cards").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cartão removido com sucesso!");
      invalidateCards();
    },
    onError: (error) => {
      console.error("Error deleting card:", error);
      toast.error("Erro ao remover cartão");
    },
  });

  // Add card expense mutation
  const addCardExpenseMutation = useMutation({
    mutationFn: async ({
      cardId,
      description,
      amount,
      purchaseDate,
      installments,
    }: {
      cardId: string;
      description: string;
      amount: number;
      purchaseDate: Date;
      installments: number;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const card = cards.find((c) => c.id === cardId);
      if (!card) throw new Error("Cartão não encontrado");

      const purchaseDay = purchaseDate.getDate();
      let billingMonth = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), 1);

      if (purchaseDay > card.closing_day) {
        billingMonth.setMonth(billingMonth.getMonth() + 1);
      }

      const installmentAmount = amount / installments;
      const descriptionWithInstallment =
        installments > 1 ? `${description} (1/${installments})` : description;

      const { data, error } = await supabase
        .from("card_transactions")
        .insert({
          card_id: cardId,
          user_id: user.id,
          household_id: householdId,
          description: descriptionWithInstallment,
          amount: installmentAmount,
          purchase_date: purchaseDate.toISOString().split("T")[0],
          installment_number: 1,
          total_installments: installments,
          billing_month: billingMonth.toISOString().split("T")[0],
        })
        .select()
        .single();

      if (error) throw error;
      return { data, installments, installmentAmount };
    },
    onSuccess: (result) => {
      toast.success(
        `Gasto registrado com sucesso!${
          result.installments > 1
            ? ` (${result.installments}x de R$ ${result.installmentAmount.toFixed(2)})`
            : ""
        }`
      );
      invalidateCards();
    },
    onError: (error) => {
      console.error("Error adding card expense:", error);
      toast.error("Erro ao registrar gasto no cartão");
    },
  });

  // Wrapper functions to maintain backward compatibility
  const createCard = async (
    cardData: Omit<Card, "id" | "user_id" | "household_id" | "created_at" | "updated_at">
  ) => {
    try {
      const result = await createCardMutation.mutateAsync(cardData);
      return result;
    } catch {
      return null;
    }
  };

  const updateCard = async (id: string, cardData: Partial<Card>) => {
    await updateCardMutation.mutateAsync({ id, cardData });
  };

  const deleteCard = async (id: string) => {
    await deleteCardMutation.mutateAsync(id);
  };

  const addCardExpense = async (
    cardId: string,
    description: string,
    amount: number,
    purchaseDate: Date,
    installments: number
  ) => {
    try {
      const result = await addCardExpenseMutation.mutateAsync({
        cardId,
        description,
        amount,
        purchaseDate,
        installments,
      });
      return result.data;
    } catch {
      return null;
    }
  };

  // Calculate future commitments (next 6 months)
  const getFutureCommitments = useCallback(() => {
    const today = new Date();
    const months: { month: string; amount: number }[] = [];

    for (let i = 0; i < 6; i++) {
      const targetMonth = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthKey = targetMonth.toISOString().split("T")[0].substring(0, 7);

      const monthlyTotal = cardTransactions
        .filter((tx) => {
          const txMonth = tx.billing_month.substring(0, 7);
          return txMonth === monthKey && !tx.is_paid;
        })
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

      months.push({
        month: targetMonth.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        amount: monthlyTotal,
      });
    }

    return months;
  }, [cardTransactions]);

  // Calculate total open bills
  const getTotalOpenBills = useCallback(() => {
    return cardTransactions
      .filter((tx) => !tx.is_paid)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
  }, [cardTransactions]);

  const loading = cardsQuery.isLoading || transactionsQuery.isLoading || householdLoading;

  // Alias for backward compatibility
  const fetchCards = invalidateCards;

  return {
    cards,
    cardTransactions,
    loading,
    fetchCards,
    createCard,
    updateCard,
    deleteCard,
    addCardExpense,
    getFutureCommitments,
    getTotalOpenBills,
    // New React Query specific exports
    invalidateCards,
    isLoading: loading,
    isFetching: cardsQuery.isFetching || transactionsQuery.isFetching,
    error: cardsQuery.error || transactionsQuery.error,
  };
};
