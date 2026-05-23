import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { householdKeys } from "@/hooks/useHouseholdContext";

interface HouseholdMember {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Household {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
}

interface HouseholdInvite {
  id: string;
  invite_code: string;
  expires_at: string;
  used_at: string | null;
}

interface HouseholdData {
  household: Household | null;
  members: HouseholdMember[];
  invites: HouseholdInvite[];
}

const householdDetailKey = (userId: string | undefined) =>
  [...householdKeys.all, "detail", userId] as const;

export const useHousehold = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<HouseholdData>({
    queryKey: householdDetailKey(user?.id),
    queryFn: async (): Promise<HouseholdData> => {
      if (!user) return { household: null, members: [], invites: [] };

      const { data: profile } = await supabase
        .from("profiles")
        .select("household_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.household_id) {
        return { household: null, members: [], invites: [] };
      }

      const householdId = profile.household_id;

      // Fetch household details, members and active invites in parallel
      const [{ data: householdData }, { data: membersData }, { data: invitesData }] =
        await Promise.all([
          supabase.from("households").select("*").eq("id", householdId).single(),
          supabase
            .from("profiles")
            .select("user_id, full_name, avatar_url")
            .eq("household_id", householdId),
          supabase
            .from("household_invites")
            .select("*")
            .eq("household_id", householdId)
            .is("used_at", null)
            .gt("expires_at", new Date().toISOString()),
        ]);

      // Generate signed URLs for member avatars (policy allows same-household reads)
      const members = await Promise.all(
        (membersData ?? []).map(async (member) => {
          const raw = member.avatar_url;
          if (!raw || /^https?:\/\//i.test(raw)) return member;

          const { data: signed, error } = await supabase.storage
            .from("avatars")
            .createSignedUrl(raw, 60 * 60 * 24 * 7);

          if (error) return { ...member, avatar_url: null };
          const signedUrl = signed?.signedUrl ?? null;
          return { ...member, avatar_url: signedUrl };
        })
      );

      return {
        household: householdData ?? null,
        members,
        invites: invitesData ?? [],
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Invalidates the full household cache tree (detail + context)
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: householdKeys.all });

  const createInvite = async () => {
    if (!user || !data?.household) return null;
    try {
      const { data: invite, error } = await supabase
        .from("household_invites")
        .insert({ household_id: data.household.id, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      await invalidate();
      return invite;
    } catch (error) {
      console.error("Error creating invite:", error);
      return null;
    }
  };

  const acceptInvite = async (inviteCode: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "Usuário não autenticado" };
    try {
      const normalizedCode = inviteCode.trim().toLowerCase();
      const { data: result, error } = await supabase.rpc("accept_household_invite", {
        p_invite_code: normalizedCode,
      });
      if (error) throw error;
      const res = result as { success: boolean; error?: string };
      if (res.success) await invalidate();
      return res;
    } catch (error: any) {
      console.error("Error accepting invite:", error);
      return { success: false, error: error.message };
    }
  };

  const updateHouseholdName = async (name: string) => {
    if (!data?.household) return false;
    try {
      const { error } = await supabase
        .from("households")
        .update({ name })
        .eq("id", data.household.id);
      if (error) throw error;
      await invalidate();
      return true;
    } catch (error) {
      console.error("Error updating household name:", error);
      return false;
    }
  };

  const leaveHousehold = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "Usuário não autenticado" };
    try {
      const { data: result, error } = await supabase.rpc("leave_household");
      if (error) throw error;
      const res = result as { success: boolean; error?: string };
      if (res.success) await invalidate();
      return res;
    } catch (error: any) {
      console.error("Error leaving household:", error);
      return { success: false, error: error.message };
    }
  };

  return {
    household: data?.household ?? null,
    members: data?.members ?? [],
    invites: data?.invites ?? [],
    loading: isLoading,
    createInvite,
    acceptInvite,
    updateHouseholdName,
    leaveHousehold,
    refetch,
  };
};
