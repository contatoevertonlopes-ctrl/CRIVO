import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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

export const useHousehold = () => {
  const { user } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [invites, setInvites] = useState<HouseholdInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHousehold = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get user's household_id from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("household_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.household_id) {
        setLoading(false);
        return;
      }

      // Get household details
      const { data: householdData } = await supabase
        .from("households")
        .select("*")
        .eq("id", profile.household_id)
        .single();

      if (householdData) {
        setHousehold(householdData);
      }

      // Get all members of the household
      const { data: membersData } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .eq("household_id", profile.household_id);

      if (membersData) {
        // Private avatars: only the owner can read their own object.
        // For other members, keep avatar_url only if it's an actual URL (legacy/public setup).
        const hydrated = await Promise.all(
          membersData.map(async (member) => {
            const raw = member.avatar_url;

            if (!raw) return member;

            // Legacy/back-compat
            if (/^https?:\/\//i.test(raw)) return member;

            // Only sign current user's avatar (others won't have permission under private policy)
            if (member.user_id !== user.id) return { ...member, avatar_url: null };

            const { data: signed, error } = await supabase.storage
              .from("avatars")
              .createSignedUrl(raw, 60 * 60 * 24 * 7);

            if (error) return { ...member, avatar_url: null };

            const signedUrl = (signed as any)?.signedUrl || (signed as any)?.signedURL || null;
            return { ...member, avatar_url: signedUrl };
          })
        );

        setMembers(hydrated);
      }

      // Get active invites
      const { data: invitesData } = await supabase
        .from("household_invites")
        .select("*")
        .eq("household_id", profile.household_id)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString());

      if (invitesData) {
        setInvites(invitesData);
      }
    } catch (error) {
      console.error("Error fetching household:", error);
    } finally {
      setLoading(false);
    }
  };

  const createInvite = async () => {
    if (!user || !household) return null;

    try {
      const { data, error } = await supabase
        .from("household_invites")
        .insert({
          household_id: household.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchHousehold();
      return data;
    } catch (error) {
      console.error("Error creating invite:", error);
      return null;
    }
  };

  const acceptInvite = async (inviteCode: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "Usuário não autenticado" };

    try {
      // Normaliza o código: remove espaços e converte para lowercase
      const normalizedCode = inviteCode.trim().toLowerCase();
      
      const { data, error } = await supabase.rpc("accept_household_invite", {
        p_invite_code: normalizedCode,
      });


      if (error) throw error;

      const result = data as { success: boolean; error?: string };

      if (result.success) {
        await fetchHousehold();
      }

      return result;
    } catch (error: any) {
      console.error("Error accepting invite:", error);
      return { success: false, error: error.message };
    }
  };

  const updateHouseholdName = async (name: string) => {
    if (!household) return false;

    try {
      const { error } = await supabase
        .from("households")
        .update({ name })
        .eq("id", household.id);

      if (error) throw error;

      await fetchHousehold();
      return true;
    } catch (error) {
      console.error("Error updating household name:", error);
      return false;
    }
  };

  const leaveHousehold = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "Usuário não autenticado" };

    try {
      const { data, error } = await supabase.rpc("leave_household");

      if (error) throw error;

      const result = data as { success: boolean; error?: string };

      if (result.success) {
        await fetchHousehold();
      }

      return result;
    } catch (error: any) {
      console.error("Error leaving household:", error);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    fetchHousehold();
  }, [user]);

  return {
    household,
    members,
    invites,
    loading,
    createInvite,
    acceptInvite,
    updateHouseholdName,
    leaveHousehold,
    refetch: fetchHousehold,
  };
};
