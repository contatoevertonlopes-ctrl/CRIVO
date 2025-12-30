import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  fullName: string;
  avatarUrl: string | null;
  email: string;
  initials: string;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    fullName: "",
    avatarUrl: null,
    email: "",
    initials: "U",
  });
  const [loading, setLoading] = useState(true);

  const resolveAvatarUrl = async (avatarValue: string | null) => {
    if (!user || !avatarValue) return null;
    // Back-compat: old data may store a full URL.
    if (/^https?:\/\//i.test(avatarValue)) return avatarValue;

    const { data, error } = await supabase.storage
      .from("avatars")
      .createSignedUrl(avatarValue, 60 * 60 * 24 * 7);

    if (error) {
      console.warn("Error creating signed avatar URL:", error);
      return null;
    }

    return (data as any)?.signedUrl || (data as any)?.signedURL || null;
  };

  const buildProfile = async (data: any) => {
    const fullName = data?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";
    const email = user?.email || "";
    const initials = fullName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const avatarUrl = await resolveAvatarUrl(data?.avatar_url || null);

    return {
      fullName,
      avatarUrl,
      email,
      initials,
    } as UserProfile;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", user.id)
          .maybeSingle();

        setProfile(await buildProfile(data));
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Allow other parts of the app (like Settings) to trigger a refresh
  useEffect(() => {
    const onProfileUpdated = () => {
      // re-run fetch by toggling user dependency or calling the same logic
      // We'll call the same fetch logic inline here for simplicity
      const refresh = async () => {
        if (!user) return;
        try {
          const { data } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("user_id", user.id)
            .maybeSingle();

          setProfile(await buildProfile(data));
        } catch (err) {
          console.error("Error refreshing profile:", err);
        }
      };

      refresh();
    };

    window.addEventListener("profileUpdated", onProfileUpdated);
    return () => window.removeEventListener("profileUpdated", onProfileUpdated);
  }, [user]);

  // Expose a manual refresh function as well
  const refresh = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      setProfile(await buildProfile(data));
    } catch (err) {
      console.error("Error refreshing profile:", err);
    }
  };

  return { profile, loading, refresh };
};
