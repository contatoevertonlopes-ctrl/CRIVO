import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type LocationState = {
  from?: { pathname?: string };
};

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [isRecovery, setIsRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const redirectAfterAuth = useMemo(() => {
    const state = location.state as LocationState | null;
    return state?.from?.pathname || "/";
  }, [location.state]);

  // 1) Detecta fluxo de recovery via evento PASSWORD_RECOVERY do Supabase
  //    (o SDK lê o hash #access_token=...&type=recovery automaticamente)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // 2) Se já estiver logado, decide para onde vai (onboarding ou app)
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user || isRecovery) return;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        // Não trava o usuário por causa disso — só loga e segue.
        console.error("Erro ao buscar profile:", error);
        navigate(redirectAfterAuth, { replace: true });
        return;
      }

      if (profile?.onboarding_completed) {
        navigate(redirectAfterAuth, { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    };

    checkOnboardingStatus();
  }, [navigate, redirectAfterAuth, user, isRecovery]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);

    // (11) 99999-9999
    const ddd = digits.slice(0, 2);
    const p1 = digits.slice(2, 7);
    const p2 = digits.slice(7, 11);

    let masked = "";
    if (ddd) masked += `(${ddd}`;
    if (ddd.length === 2) masked += ") ";
    if (p1) masked += p1;
    if (p2) masked += `-${p2}`;

    setPhone(masked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Informe email e senha.",
      });
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          toast({ variant: "destructive", title: "Erro", description: error.message });
          return;
        }

        // A navegação final costuma acontecer no useEffect quando `user` chega,
        // mas aqui dá um feedback imediato.
        toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });
      } else {
        const { error } = await signUp(
          email.trim(), 
          password, 
          fullName?.trim() || "", 
          phone?.trim() || undefined
        );

        if (error) {
          toast({ variant: "destructive", title: "Erro", description: error.message });
          return;
        }

        toast({
          title: "Conta criada!",
          description: "Se necessário, confirme seu email para continuar.",
        });

        // Opcional: voltar pra login
        setIsLogin(true);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err?.message || "Falha ao autenticar.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Senha fraca",
        description: "A nova senha deve ter no mínimo 6 caracteres.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Senhas não conferem",
        description: "Confirme a mesma senha nos dois campos.",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        toast({ variant: "destructive", title: "Erro", description: error.message });
        return;
      }

      toast({
        title: "Senha atualizada",
        description: "Agora você já pode entrar com sua nova senha.",
      });

      // Limpa recovery e volta pro login
      setIsRecovery(false);
      setNewPassword("");
      setConfirmPassword("");
      setIsLogin(true);

      // Remove querystring do recovery pra não ficar preso no modo recovery
      navigate("/auth", { replace: true });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err?.message || "Erro ao redefinir senha.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="relative z-10">
          {isRecovery ? (
            <div>
              <h1 className="text-2xl font-bold mb-2 text-center">Redefinir senha</h1>
              <p className="text-muted-foreground text-sm text-center mb-6">
                Defina uma nova senha para sua conta.
              </p>

              <form onSubmit={handleSetNewPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="bg-secondary/50 border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="bg-secondary/50 border-border/50"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Atualizando..." : "Redefinir senha"}
                </Button>
              </form>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold mb-2 text-center">
                {isLogin ? "Entrar" : "Criar conta"}
              </h1>
              <p className="text-muted-foreground text-sm text-center mb-6">
                {isLogin ? "Acesse sua conta para continuar" : "Preencha os dados para começar"}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-4">
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
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="bg-secondary/50 border-border/50"
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
                </Button>
              </form>

              <div className="mt-6 text-center space-y-2">
                {isLogin ? (
                  <div>
                    <div className="flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => {
                          setIsLogin(false);
                          setPhone("");
                          setFullName("");
                        }}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Não tem conta? Criar agora
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowForgot(true)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>

                    {showForgot && (
                      <div className="mt-4 p-4 bg-secondary/10 rounded-lg">
                        <h3 className="text-sm font-medium mb-2">Recuperar senha</h3>
                        <p className="text-xs text-muted-foreground mb-3">
                          Informe o email cadastrado e enviaremos instruções para redefinir sua senha.
                        </p>

                        <div className="space-y-2">
                          <Input
                            id="resetEmail"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            className="bg-secondary/50 border-border/50"
                          />

                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={async () => {
                                setResetLoading(true);
                                try {
                                  // Garante que o redirectTo aponta sempre para /auth
                                  // e usa a URL de produção se não estiver em localhost
                                  const origin = window.location.origin;
                                  const redirectTo = `${origin}/auth`;

                                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                                    redirectTo,
                                  });

                                  if (error) {
                                    toast({
                                      variant: "destructive",
                                      title: "Erro",
                                      description: error.message,
                                    });
                                  } else {
                                    toast({
                                      title: "Email enviado",
                                      description: "Verifique sua caixa de entrada para instruções.",
                                    });
                                    setShowForgot(false);
                                  }
                                } catch (err: any) {
                                  toast({
                                    variant: "destructive",
                                    title: "Erro",
                                    description: err?.message || "Erro ao solicitar recuperação",
                                  });
                                } finally {
                                  setResetLoading(false);
                                }
                              }}
                              disabled={resetLoading}
                              className="flex-1"
                            >
                              {resetLoading ? "Enviando..." : "Enviar instruções"}
                            </Button>

                            <button
                              type="button"
                              onClick={() => setShowForgot(false)}
                              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setPhone("");
                      setFullName("");
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Já tem conta? Entrar
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;