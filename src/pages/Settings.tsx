import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import HouseholdSection from "@/components/HouseholdSection";
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
      // Format phone number - remove non-digits and ensure country code
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
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 p-4 sm:p-5 lg:p-4 flex flex-col gap-4 sm:gap-5">
        <div className="pl-12 lg:pl-0 lg:pt-0">
          <h1 className="text-lg sm:text-xl font-semibold mb-1">Configurações</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Gerencie sua conta e preferências
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 max-w-2xl">
          {/* Profile Section */}
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-bl from-background to-black border border-secondary shadow-[0_18px_45px_rgba(3,7,18,0.65)] p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-4">Perfil</h2>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email || ""}
                  disabled
                  className="bg-secondary/30 border-border/50"
                />
                <p className="text-xs text-muted-foreground">
                  O email não pode ser alterado
                </p>
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

              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-primary to-green-600 text-primary-foreground"
              >
                {loading ? "Salvando..." : "Salvar alterações"}
              </Button>
            </form>
          </div>

          {/* Subscription Section */}
          <div className={`rounded-2xl sm:rounded-3xl bg-gradient-to-bl from-background to-black border shadow-[0_18px_45px_rgba(3,7,18,0.65)] p-4 sm:p-6 ${
            isPro ? "border-primary/40" : "border-secondary"
          }`}>
            <h2 className="text-base sm:text-lg font-semibold mb-4">Assinatura</h2>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Plano atual</p>
                <p className={`font-semibold ${isPro ? "text-primary" : ""}`}>
                  {subscription ? getPlanLabel(subscription.plan) : "Carregando..."}
                </p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full ${
                isPro
                  ? "bg-primary/20 border border-primary/50 text-green-200"
                  : "bg-secondary/50 text-muted-foreground"
              }`}>
                {subscription?.status === "active" ? "Ativo" : "Inativo"}
              </span>
            </div>

            <Button
              variant="outline"
              onClick={() => navigate("/plans")}
              className={isPro ? "border-primary/50 hover:bg-primary/10" : ""}
            >
              {isPro ? "Gerenciar plano" : "Fazer upgrade"}
            </Button>
          </div>

          {/* Household Section */}
          <HouseholdSection />

          {/* WhatsApp Section */}
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-bl from-background to-black border border-secondary shadow-[0_18px_45px_rgba(3,7,18,0.65)] p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-4">WhatsApp</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
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
                  className="bg-secondary/50 border-border/50"
                />
                <p className="text-xs text-muted-foreground">
                  Digite com código do país (ex: 5511999999999)
                </p>
              </div>

              <Button
                type="submit"
                disabled={phoneLoading}
                className="bg-gradient-to-r from-green-600 to-green-500 text-primary-foreground"
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
          </div>

          {/* Logout Section */}
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-bl from-background to-black border border-secondary shadow-[0_18px_45px_rgba(3,7,18,0.65)] p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-4">Conta</h2>
            
            <Button
              variant="destructive"
              onClick={handleSignOut}
            >
              Sair da conta
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
