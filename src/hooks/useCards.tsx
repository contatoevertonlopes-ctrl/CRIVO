import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useHouseholdId } from "@/hooks/useHouseholdId";
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

export const useCards = () => {
  const { user } = useAuth();
  const { householdId } = useHouseholdId();
  const [cards, setCards] = useState<CardWithBill[]>([]);
  const [cardTransactions, setCardTransactions] = useState<CardTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch cards
      const { data: cardsData, error: cardsError } = await supabase
        .from("cards")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (cardsError) throw cardsError;

      // Fetch all card transactions for current and future months
      const today = new Date();
      const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("card_transactions")
        .select("*")
        .gte("billing_month", currentMonth.toISOString().split("T")[0])
        .order("billing_month");

      if (transactionsError) throw transactionsError;

      setCardTransactions(transactionsData || []);

      // Calculate current bill and available limit for each card
      const cardsWithBills: CardWithBill[] = (cardsData || []).map((card: Card) => {
        const cardTxs = (transactionsData || []).filter(
          (tx: CardTransaction) => tx.card_id === card.id && !tx.is_paid
        );
        
        // Get current month transactions
        const currentMonthTxs = cardTxs.filter((tx: CardTransaction) => {
          const txMonth = new Date(tx.billing_month);
          return txMonth.getMonth() === currentMonth.getMonth() && 
                 txMonth.getFullYear() === currentMonth.getFullYear();
        });

        const currentBill = currentMonthTxs.reduce((sum: number, tx: CardTransaction) => sum + Number(tx.amount), 0);
        const availableLimit = card.credit_limit - currentBill;

        // Calculate next due date
        const dueDate = new Date(today.getFullYear(), today.getMonth(), card.due_day);
        if (today.getDate() > card.due_day) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }

        // Check if it's the best day to buy (day after closing)
        const dayAfterClosing = (card.closing_day % 31) + 1;
        const isBestDayToBuy = today.getDate() === dayAfterClosing || 
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

      setCards(cardsWithBills);
    } catch (error) {
      console.error("Error fetching cards:", error);
      toast.error("Erro ao carregar cartões");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createCard = async (cardData: Omit<Card, "id" | "user_id" | "household_id" | "created_at" | "updated_at">) => {
    if (!user) return null;

    try {
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

      toast.success("Cartão cadastrado com sucesso!");
      await fetchCards();
      return data;
    } catch (error) {
      console.error("Error creating card:", error);
      toast.error("Erro ao cadastrar cartão");
      return null;
    }
  };

  const updateCard = async (id: string, cardData: Partial<Card>) => {
    try {
      const { error } = await supabase
        .from("cards")
        .update(cardData)
        .eq("id", id);

      if (error) throw error;

      toast.success("Cartão atualizado com sucesso!");
      await fetchCards();
    } catch (error) {
      console.error("Error updating card:", error);
      toast.error("Erro ao atualizar cartão");
    }
  };

  const deleteCard = async (id: string) => {
    try {
      const { error } = await supabase
        .from("cards")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;

      toast.success("Cartão removido com sucesso!");
      await fetchCards();
    } catch (error) {
      console.error("Error deleting card:", error);
      toast.error("Erro ao remover cartão");
    }
  };

  const addCardExpense = async (
    cardId: string,
    description: string,
    amount: number,
    purchaseDate: Date,
    installments: number
  ) => {
    if (!user) return null;

    try {
      const card = cards.find((c) => c.id === cardId);
      if (!card) throw new Error("Cartão não encontrado");

      // Calculate billing month based on purchase date and closing day
      const purchaseDay = purchaseDate.getDate();
      let billingMonth = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), 1);
      
      if (purchaseDay > card.closing_day) {
        billingMonth.setMonth(billingMonth.getMonth() + 1);
      }

      const installmentAmount = amount / installments;
      const descriptionWithInstallment = installments > 1 
        ? `${description} (1/${installments})`
        : description;

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

      toast.success(`Gasto registrado com sucesso!${installments > 1 ? ` (${installments}x de R$ ${installmentAmount.toFixed(2)})` : ""}`);
      await fetchCards();
      return data;
    } catch (error) {
      console.error("Error adding card expense:", error);
      toast.error("Erro ao registrar gasto no cartão");
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

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

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
  };
};
