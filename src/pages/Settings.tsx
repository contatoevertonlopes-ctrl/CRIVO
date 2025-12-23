import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HouseholdSection from "@/components/HouseholdSection";
import ModeSelector from "@/components/settings/ModeSelector";
import GoalsSection from "@/components/settings/GoalsSection";
import CategoryManager from "@/components/settings/CategoryManager";
import NotificationTriggers from "@/components/settings/NotificationTriggers";
import DataManagement from "@/components/settings/DataManagement";
import ModuleSettings from "@/components/settings/ModuleSettings";
import { User, Wallet, Bell, LogOut, MessageSquare, Sparkles } from "lucide-react";

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchProfile();
    fetchSubscription();
  }, [user, navigate]);

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
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("user_id", user.id);

      if (error) throw error;

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
    <div className="flex min-h-screen w-full">
      <Sidebar />
      
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="pl-12 lg:pl-0 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold mb-1">Configurações</h1>
          <p className="text-sm text-muted-foreground">
            Personalize sua experiência e gerencie suas preferências
          </p>
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
            <section className="rounded-2xl bg-gradient-to-bl from-background to-card border border-border/50 shadow-lg p-5 sm:p-6">
              <ModeSelector />
            </section>

            {/* Profile Section */}
            <section className="rounded-2xl bg-gradient-to-bl from-background to-card border border-border/50 shadow-lg p-5 sm:p-6">
              <h3 className="text-sm font-medium mb-4">Perfil</h3>
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
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
            <section className={`rounded-2xl bg-gradient-to-bl from-background to-card border shadow-lg p-5 sm:p-6 ${
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
            <section className="rounded-2xl bg-gradient-to-bl from-background to-card border border-border/50 shadow-lg p-5 sm:p-6">
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
            <section className="rounded-2xl bg-gradient-to-bl from-background to-card border border-border/50 shadow-lg p-5 sm:p-6">
              <DataManagement />
            </section>

            {/* Logout Section */}
            <section className="rounded-2xl bg-gradient-to-bl from-background to-card border border-border/50 shadow-lg p-5 sm:p-6">
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
            <section className="rounded-2xl bg-gradient-to-bl from-background to-card border border-border/50 shadow-lg p-5 sm:p-6">
              <ModuleSettings />
            </section>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            {/* Goals Section */}
            <section className="rounded-2xl bg-gradient-to-bl from-background to-card border border-border/50 shadow-lg p-5 sm:p-6">
              <GoalsSection />
            </section>

            {/* Category Manager */}
            <section className="rounded-2xl bg-gradient-to-bl from-background to-card border border-border/50 shadow-lg p-5 sm:p-6">
              <CategoryManager />
            </section>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <section className="rounded-2xl bg-gradient-to-bl from-background to-card border border-border/50 shadow-lg p-5 sm:p-6">
              <NotificationTriggers />
            </section>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
