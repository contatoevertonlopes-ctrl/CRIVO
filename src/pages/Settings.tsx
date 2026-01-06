import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUserProfile } from "@/hooks/useUserProfile";
import ImageCropper from "@/components/ImageCropper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HouseholdSection from "@/components/HouseholdSection";
import ModeSelector from "@/components/settings/ModeSelector";
import GoalsSection from "@/components/settings/GoalsSection";
import CategoryManager from "@/components/settings/CategoryManager";
import NotificationTriggers from "@/components/settings/NotificationTriggers";
import DataManagement from "@/components/settings/DataManagement";
import ModuleSettings from "@/components/settings/ModuleSettings";
import { User, Wallet, Bell, LogOut, MessageSquare, Sparkles } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const Settings = () => {
  const { user, signOut } = useAuth();
  const { profile, refresh: refreshProfile } = useUserProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarRemoveRequested, setAvatarRemoveRequested] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchProfile();
    fetchSubscription();
  }, [user, navigate]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    if (data) {
      setFullName(data.full_name || "");
      setPhone(data.phone || "");
    }
  };

  const fetchSubscription = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    if (data) {
      setSubscription(data);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      // Read current avatar path (needed for delete / cleanup)
      const { data: currentProfile, error: currentProfileError } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (currentProfileError) throw currentProfileError;

      const currentAvatar = currentProfile?.avatar_url || null;

      let nextAvatarPath: string | null | undefined = undefined;

      // If a new avatar was selected, upload it and store the object path.
      if (avatarFile) {
        const path = `${user.id}/${Date.now()}_${avatarFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;
        nextAvatarPath = path;
      } else if (avatarRemoveRequested) {
        // Remove requested: clear the avatar path.
        nextAvatarPath = null;
      }

      const updatePayload: Record<string, any> = { full_name: fullName };
      if (nextAvatarPath !== undefined) updatePayload.avatar_url = nextAvatarPath;

      const { error } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("user_id", user.id);

      if (error) throw error;

      // Cleanup old avatar object if we replaced or removed it.
      const shouldCleanupOld =
        currentAvatar &&
        typeof currentAvatar === "string" &&
        !/^https?:\/\//i.test(currentAvatar) &&
        (nextAvatarPath === null || (typeof nextAvatarPath === "string" && nextAvatarPath !== currentAvatar));

      if (shouldCleanupOld) {
        const { error: removeError } = await supabase.storage
          .from("avatars")
          .remove([currentAvatar]);

        if (removeError) console.warn("Could not remove old avatar object:", removeError);
      }

      // Clear local pending avatar state
      setAvatarFile(null);
      setAvatarPreview(null);
      setAvatarRemoveRequested(false);
      window.dispatchEvent(new Event("profileUpdated"));
      refreshProfile();

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setPhoneLoading(true);
    try {
      const formattedPhone = phone.replace(/\D/g, "");
      
      const { error } = await supabase
        .from("profiles")
        .update({ phone: formattedPhone })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "WhatsApp vinculado",
        description: "Seu número foi salvo com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao vincular",
        description: error.message,
      });
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSelectedImageSrc(url);
    setSelectedFileName(file.name);
    setShowCropper(true);
    // allow re-selecting the same file
    e.target.value = "";
  };

  const handleCropComplete = async (blob: Blob) => {
    // convert blob to File to preserve name/type
    const name = selectedFileName || `avatar_${Date.now()}.jpg`;
    const file = new File([blob], name, { type: blob.type || "image/jpeg" });
    // revoke previous preview
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    const previewUrl = URL.createObjectURL(file);
    setAvatarFile(file);
    setAvatarPreview(previewUrl);
    setAvatarRemoveRequested(false);
    setShowCropper(false);
    if (selectedImageSrc) URL.revokeObjectURL(selectedImageSrc);
    setSelectedImageSrc(null);
    setSelectedFileName(null);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    if (selectedImageSrc) URL.revokeObjectURL(selectedImageSrc);
    setSelectedImageSrc(null);
    setSelectedFileName(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case "monthly":
        return "Pro (Mensal)";
      case "annual":
        return "Pro (Anual)";
      case "pro":
        return "Pro";
      default:
        return "Gratuito";
    }
  };

  const isPro = subscription?.plan && subscription.plan !== "free";

  if (!user) return null;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      
      <main className="flex-1 min-w-0 pt-16 pb-24 lg:pt-0 lg:pb-0">
        <div className="max-w-6xl mx-auto px-4 py-4 lg:px-6 lg:py-6 flex flex-col gap-4 lg:gap-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold mb-1">Configurações</h1>
              <p className="text-sm text-muted-foreground">
                Personalize sua experiência e gerencie suas preferências
              </p>
            </div>
            <ThemeToggle />
          </div>

          <Tabs defaultValue="general" className="max-w-4xl">
          <TabsList className="mb-6 bg-card/50 border border-border/50 p-1">
            <TabsTrigger value="general" className="data-[state=active]:bg-background gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="experience" className="data-[state=active]:bg-background gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Experiência</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="data-[state=active]:bg-background gap-2">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">Financeiro</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-background gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            {/* Mode Selector */}
            <section className="rounded-2xl bg-card/50 backdrop-blur border border-border/50 card-shadow-soft p-5 sm:p-6">
              <ModeSelector />
            </section>

            {/* Profile Section */}
            <section className="rounded-2xl bg-card/50 backdrop-blur border border-border/50 card-shadow-soft p-5 sm:p-6">
              <h3 className="text-sm font-medium mb-4">Perfil</h3>
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-16 h-16">
                    {avatarPreview ? (
                      <AvatarImage src={avatarPreview} />
                    ) : avatarRemoveRequested ? (
                      <AvatarFallback className="text-xl">{profile?.initials}</AvatarFallback>
                    ) : profile?.avatarUrl ? (
                      <AvatarImage src={profile.avatarUrl || undefined} />
                    ) : (
                      <AvatarFallback className="text-xl">{profile?.initials}</AvatarFallback>
                    )}
                  </Avatar>

                  <div className="flex flex-col gap-2">
                    <input id="avatar" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    <label htmlFor="avatar" className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-border/50 bg-secondary cursor-pointer text-sm">
                      Escolher foto
                    </label>
                    {avatarFile && <div className="text-xs text-muted-foreground">{avatarFile.name}</div>}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAvatarFile(null);
                          setAvatarPreview(null);
                          setAvatarRemoveRequested(true);
                        }}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                </div>
                {showCropper && selectedImageSrc && (
                  <ImageCropper src={selectedImageSrc} aspect={1} onCancel={handleCropCancel} onComplete={handleCropComplete} />
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user.email || ""}
                      disabled
                      className="bg-secondary/30 border-border/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome completo</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome"
                      className="bg-secondary/50 border-border/50"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  size="sm"
                >
                  {loading ? "Salvando..." : "Salvar perfil"}
                </Button>
              </form>
            </section>

            {/* Subscription Section */}
            <section className={`rounded-2xl bg-card/50 backdrop-blur border card-shadow-soft p-5 sm:p-6 ${
              isPro ? "border-primary/40" : "border-border/50"
            }`}>
              <h3 className="text-sm font-medium mb-4">Assinatura</h3>
              
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Plano atual</p>
                  <p className={`font-semibold ${isPro ? "text-primary" : ""}`}>
                    {subscription ? getPlanLabel(subscription.plan) : "Carregando..."}
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full ${
                  isPro
                    ? "bg-primary/20 border border-primary/50 text-primary"
                    : "bg-secondary/50 text-muted-foreground"
                }`}>
                  {subscription?.status === "active" ? "Ativo" : "Inativo"}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/plans")}
              >
                {isPro ? "Gerenciar plano" : "Fazer upgrade"}
              </Button>
            </section>

            {/* Household Section */}
            <HouseholdSection />

            {/* WhatsApp Section */}
            <section className="rounded-2xl bg-card/50 backdrop-blur border border-border/50 card-shadow-soft p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-4 h-4 text-green-500" />
                <h3 className="text-sm font-medium">WhatsApp</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Vincule seu número para receber notificações e enviar comandos via WhatsApp.
              </p>
              
              <form onSubmit={handleUpdatePhone} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Número do WhatsApp</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="5511999999999"
                    className="bg-secondary/50 border-border/50 max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite com código do país (ex: 5511999999999)
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={phoneLoading}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {phoneLoading ? "Salvando..." : "Vincular WhatsApp"}
                </Button>
              </form>

              {phone && (
                <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="text-xs text-green-400">
                    ✓ WhatsApp vinculado: {phone}
                  </p>
                </div>
              )}
            </section>

            {/* Data Management */}
            <section className="rounded-2xl bg-card/50 backdrop-blur border border-border/50 card-shadow-soft p-5 sm:p-6">
              <DataManagement />
            </section>

            {/* Logout Section */}
            <section className="rounded-2xl bg-card/50 backdrop-blur border border-border/50 card-shadow-soft p-5 sm:p-6">
              <h3 className="text-sm font-medium mb-4">Conta</h3>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair da conta
              </Button>
            </section>
          </TabsContent>

          {/* Experience Tab - Module Settings */}
          <TabsContent value="experience" className="space-y-6">
            <section className="rounded-2xl bg-card/50 backdrop-blur border border-border/50 card-shadow-soft p-5 sm:p-6">
              <ModuleSettings />
            </section>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            {/* Goals Section */}
            <section className="rounded-2xl bg-card/50 backdrop-blur border border-border/50 card-shadow-soft p-5 sm:p-6">
              <GoalsSection />
            </section>

            {/* Category Manager */}
            <section className="rounded-2xl bg-card/50 backdrop-blur border border-border/50 card-shadow-soft p-5 sm:p-6">
              <CategoryManager />
            </section>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <section className="rounded-2xl bg-card/50 backdrop-blur border border-border/50 card-shadow-soft p-5 sm:p-6">
              <NotificationTriggers />
            </section>
          </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Settings;
