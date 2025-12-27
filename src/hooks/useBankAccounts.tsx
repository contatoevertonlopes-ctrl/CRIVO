import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useSharedHousehold } from "@/hooks/useSharedHousehold";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BankAccount {
  id: string;
  user_id: string;
  household_id: string | null;
  name: string;
  bank_name: string;
  account_type: "checking" | "savings";
  balance: number;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type BankAccountInsert = Omit<BankAccount, "id" | "created_at" | "updated_at">;
export type BankAccountUpdate = Partial<Omit<BankAccount, "id" | "user_id" | "created_at" | "updated_at">>;

// Query key factory
export const bankAccountKeys = {
  all: ["bank-accounts"] as const,
  list: (userId: string | undefined, householdId: string | null | undefined, isShared: boolean) =>
    [...bankAccountKeys.all, "list", { userId, householdId, isShared }] as const,
};

// Bank presets with colors
export const BANK_PRESETS: Record<string, { color: string; icon: string }> = {
  "Nubank": { color: "#820AD1", icon: "credit-card" },
  "Inter": { color: "#FF7A00", icon: "landmark" },
  "Santander": { color: "#CC0000", icon: "landmark" },
  "Bradesco": { color: "#CC092F", icon: "landmark" },
  "Itaú": { color: "#003399", icon: "landmark" },
  "Banco do Brasil": { color: "#FFCC00", icon: "landmark" },
  "Caixa": { color: "#005CA9", icon: "landmark" },
  "C6 Bank": { color: "#1A1A1A", icon: "credit-card" },
  "PicPay": { color: "#21C25E", icon: "wallet" },
  "Mercado Pago": { color: "#009EE3", icon: "wallet" },
  "PagBank": { color: "#00AB4E", icon: "wallet" },
  "Neon": { color: "#00E5FF", icon: "credit-card" },
  "Next": { color: "#00FF87", icon: "credit-card" },
  "Original": { color: "#006B3F", icon: "landmark" },
  "Sicoob": { color: "#003641", icon: "landmark" },
  "Sicredi": { color: "#00AA4F", icon: "landmark" },
  "Outro": { color: "#6366f1", icon: "landmark" },
};

export const useBankAccounts = () => {
  const { user } = useAuth();
  const { isShared, householdId, loading: householdLoading } = useSharedHousehold();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = bankAccountKeys.list(user?.id, householdId, isShared);

  // Fetch accounts
  const accountsQuery = useQuery({
    queryKey,
    queryFn: async (): Promise<BankAccount[]> => {
      if (!user) return [];

      let query = supabase
        .from("bank_accounts")
        .select("*")
        .eq("is_active", true)
        .order("bank_name", { ascending: true });

      if (isShared && householdId) {
        query = query.eq("household_id", householdId);
      } else {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data as BankAccount[]) || [];
    },
    enabled: !!user && !householdLoading,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Calculate total patrimony
  const totalPatrimony = accountsQuery.data?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0;

  // Invalidate cache
  const invalidateAccounts = () => {
    queryClient.invalidateQueries({ queryKey: bankAccountKeys.all });
  };

  // Create account mutation
  const createAccountMutation = useMutation({
    mutationFn: async (account: Omit<BankAccountInsert, "user_id" | "household_id">) => {
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("bank_accounts")
        .insert({
          ...account,
          user_id: user.id,
          household_id: householdId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateAccounts();
      toast({
        title: "Conta criada",
        description: "A conta bancária foi adicionada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: error.message,
      });
    },
  });

  // Update account mutation
  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, ...updates }: BankAccountUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateAccounts();
      toast({
        title: "Conta atualizada",
        description: "Os dados da conta foram atualizados.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: error.message,
      });
    },
  });

  // Delete account mutation (soft delete)
  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bank_accounts")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAccounts();
      toast({
        title: "Conta removida",
        description: "A conta bancária foi desativada.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao remover",
        description: error.message,
      });
    },
  });

  return {
    accounts: accountsQuery.data || [],
    isLoading: accountsQuery.isLoading || householdLoading,
    isFetching: accountsQuery.isFetching,
    error: accountsQuery.error,
    totalPatrimony,
    invalidateAccounts,
    createAccount: createAccountMutation.mutateAsync,
    updateAccount: updateAccountMutation.mutateAsync,
    deleteAccount: deleteAccountMutation.mutateAsync,
    isCreating: createAccountMutation.isPending,
    isUpdating: updateAccountMutation.isPending,
    isDeleting: deleteAccountMutation.isPending,
  };
};
