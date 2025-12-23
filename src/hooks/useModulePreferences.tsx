import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import type { Json } from "@/integrations/supabase/types";

export interface ModulePreferences {
  bankAccounts: boolean;
  creditCards: boolean;
  budgets: boolean;
}

const DEFAULT_MODULES: ModulePreferences = {
  bankAccounts: true,
  creditCards: true,
  budgets: true,
};

const moduleKeys = {
  all: ["modules"] as const,
  preferences: () => [...moduleKeys.all, "preferences"] as const,
};

const toJson = (modules: ModulePreferences): Json => {
  return modules as unknown as Json;
};

const fromJson = (json: Json | null): ModulePreferences => {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return DEFAULT_MODULES;
  }
  return {
    bankAccounts: (json as Record<string, unknown>).bankAccounts === true,
    creditCards: (json as Record<string, unknown>).creditCards === true,
    budgets: (json as Record<string, unknown>).budgets === true,
  };
};

export const useModulePreferences = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: moduleKeys.preferences(),
    queryFn: async () => {
      if (!user) return DEFAULT_MODULES;

      const { data, error } = await supabase
        .from("user_preferences")
        .select("active_modules")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create default preferences if not exists
        const { data: newData, error: insertError } = await supabase
          .from("user_preferences")
          .insert([{ user_id: user.id, active_modules: toJson(DEFAULT_MODULES) }])
          .select("active_modules")
          .single();

        if (insertError) throw insertError;
        return fromJson(newData?.active_modules ?? null);
      }

      return fromJson(data.active_modules);
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const updateMutation = useMutation({
    mutationFn: async (modules: Partial<ModulePreferences>) => {
      if (!user) throw new Error("User not authenticated");

      const newModules = { ...data, ...modules } as ModulePreferences;

      const { error } = await supabase
        .from("user_preferences")
        .update({ active_modules: toJson(newModules) })
        .eq("user_id", user.id);

      if (error) throw error;
      return newModules;
    },
    onSuccess: (newModules) => {
      queryClient.setQueryData(moduleKeys.preferences(), newModules);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar preferências",
        description: error.message,
      });
    },
  });

  const toggleModule = async (module: keyof ModulePreferences, enabled: boolean) => {
    await updateMutation.mutateAsync({ [module]: enabled });
    
    const moduleNames: Record<keyof ModulePreferences, string> = {
      bankAccounts: "Contas Bancárias",
      creditCards: "Cartões de Crédito",
      budgets: "Planejamento Mensal",
    };

    toast({
      title: enabled ? "Módulo ativado" : "Módulo desativado",
      description: `${moduleNames[module]} ${enabled ? "ativado" : "desativado"} com sucesso!`,
    });
  };

  const modules = data || DEFAULT_MODULES;

  return {
    modules,
    isLoading,
    error,
    toggleModule,
    isUpdating: updateMutation.isPending,
    invalidate: () => queryClient.invalidateQueries({ queryKey: moduleKeys.preferences() }),
  };
};
