import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.onboarding_completed) {
        navigate("/", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    };

    checkOnboardingStatus();
  }, [user, navigate]);

  // Format phone number as user types
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            variant: "destructive",
            title: "Erro ao entrar",
            description: error.message === "Invalid login credentials" ? "Email ou senha incorretos" : error.message
          });
        } else {
          toast({
            title: "Bem-vindo!",
            description: "Login realizado com sucesso."
          });
        }
      } else {
        if (!fullName.trim()) {
          toast({
            variant: "destructive",
            title: "Nome obrigatório",
            description: "Por favor, informe seu nome completo."
          });
          setLoading(false);
          return;
        }
        
        // Clean phone number for storage (only digits)
        const cleanPhone = phone.replace(/\D/g, "");
        
        const { error } = await signUp(email, password, fullName, cleanPhone);
        if (error) {
          toast({
            variant: "destructive",
            title: "Erro ao criar conta",
            description: error.message === "User already registered" ? "Este email já está cadastrado" : error.message
          });
        } else {
          toast({
            title: "Conta criada!",
            description: "Verifique seu email para confirmar o cadastro."
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-black p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-primary to-green-900 flex items-center justify-center font-bold text-2xl shadow-[0_0_40px_rgba(34,197,94,0.7)]">
            F
          </div>
          <div className="flex flex-col">
            <div className="text-xl font-bold tracking-tight">Finance Club</div>
            <div className="text-xs text-muted-foreground uppercase tracking-[0.14em]">
              Dashboard Financeiro
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-background to-black border border-secondary shadow-[0_18px_45px_rgba(3,7,18,0.65)] p-8">
          <div className="absolute inset-[-40%] bg-[radial-gradient(circle_at_0%_0%,rgba(34,197,94,0.1),transparent_55%)] pointer-events-none"></div>
          
          <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-2 text-center">
              {isLogin ? "Entrar" : "Criar conta"}
            </h1>
            <p className="text-muted-foreground text-sm text-center mb-6">
              {isLogin ? "Acesse sua conta para continuar" : "Preencha os dados para começar"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome completo</Label>
                    <Input 
                      id="fullName" 
                      type="text" 
                      value={fullName} 
                      onChange={e => setFullName(e.target.value)} 
                      placeholder="Seu nome" 
                      className="bg-secondary/50 border-border/50" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">WhatsApp (opcional)</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      value={phone} 
                      onChange={handlePhoneChange} 
                      placeholder="(11) 99999-9999" 
                      className="bg-secondary/50 border-border/50"
                      maxLength={15}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="ex@gmail.com" 
                  required 
                  className="bg-secondary/50 border-border/50" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  required 
                  minLength={6} 
                  className="bg-secondary/50 border-border/50" 
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-primary to-green-600 text-primary-foreground shadow-[0_8px_25px_rgba(34,197,94,0.5)] hover:shadow-[0_8px_30px_rgba(34,197,94,0.6)]"
              >
                {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button 
                type="button" 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setPhone("");
                  setFullName("");
                }} 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isLogin ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;