import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Check,
  ChevronRight,
  FileText,
  LineChart,
  Lock,
  Rocket,
  Shield,
  Sparkles,
  Upload,
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const handleGoToAuth = () => navigate("/auth");
  const handleGoToPlans = () => navigate("/plans");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                CF
              </div>
              <span className="font-semibold text-lg hidden sm:block">Club Finance Track</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#como-funciona" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Como funciona</a>
              <a href="#beneficios" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Benefícios</a>
              <a href="#insights" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Insights</a>
              <a href="#planos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Planos</a>
            </nav>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleGoToAuth}>
                Entrar
              </Button>
              <Button size="sm" onClick={handleGoToAuth}>
                Criar conta
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-foreground text-sm mb-6">
                <Sparkles className="w-4 h-4" />
                <span>Controle financeiro, sem complicação</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-5">
                Veja seu dinheiro com clareza e tome decisões melhores
              </h1>

              <p className="text-lg text-muted-foreground mb-7 max-w-xl mx-auto lg:mx-0">
                Registre ou importe transações, acompanhe relatórios e use insights práticos
                para reduzir desperdícios e acelerar metas — em um fluxo simples e direto.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button size="lg" onClick={handleGoToAuth} className="gap-2">
                  Começar agora
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={handleGoToPlans} className="gap-2">
                  Ver planos
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                {[
                  { icon: Upload, title: "Importe", desc: "CSV e extratos" },
                  { icon: LineChart, title: "Entenda", desc: "relatórios e gráficos" },
                  { icon: FileText, title: "Aja", desc: "metas e alertas" },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl border border-border/60 bg-card p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <item.icon className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Dois modos, um único app</h2>
              <div className="grid gap-4">
                <div className="rounded-xl border border-border/60 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <span className="font-medium">Modo Sobrevivência</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Para sair do sufoco: reduzir gastos, organizar compromissos e aumentar sua reserva.
                  </p>
                </div>

                <div className="rounded-xl border border-border/60 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Rocket className="w-5 h-5 text-primary" />
                    <span className="font-medium">Modo Prosperidade</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Para crescer com consistência: acompanhar evolução, metas e decisões de longo prazo.
                  </p>
                </div>

                <div className="rounded-xl border border-border/60 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-5 h-5 text-primary" />
                    <span className="font-medium">Privacidade</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Seus dados ficam protegidos e você mantém o controle do que registra e compartilha.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="py-14 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Como funciona</h2>
            <p className="text-muted-foreground">
              Um fluxo simples: registrar, entender e ajustar. Sem telas desnecessárias.
            </p>
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-5">
            {[
              {
                title: "1) Organize entradas e saídas",
                desc: "Adicione transações rapidamente ou importe quando quiser.",
              },
              {
                title: "2) Veja o que está acontecendo",
                desc: "Dashboards e relatórios deixam claro para onde o dinheiro vai.",
              },
              {
                title: "3) Tome decisões melhores",
                desc: "Use metas e alertas para corrigir rota e evoluir mês a mês.",
              },
            ].map((step) => (
              <div key={step.title} className="rounded-2xl border border-border/60 bg-background p-6">
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section id="beneficios" className="py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Benefícios para o dia a dia</h2>
            <p className="text-muted-foreground">
              Menos fricção para registrar, mais clareza para decidir.
            </p>
          </div>

          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: "Visão clara do mês",
                desc: "Entenda entradas, saídas e saldo em poucos segundos.",
              },
              {
                title: "Organização sem planilhas",
                desc: "Tudo centralizado para você manter consistência.",
              },
              {
                title: "Foco no próximo passo",
                desc: "Metas e indicadores ajudam a priorizar o que importa.",
              },
              {
                title: "Relatórios prontos",
                desc: "Compartilhe sua evolução e tenha histórico confiável.",
              },
              {
                title: "Rotina rápida",
                desc: "Registre em minutos e siga com o seu dia.",
              },
              {
                title: "Ajusta com sua fase",
                desc: "Do aperto ao crescimento: o app acompanha a jornada.",
              },
            ].map((benefit) => (
              <div key={benefit.title} className="rounded-2xl border border-border/60 bg-card p-6">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{benefit.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Insights */}
      <section id="insights" className="py-14 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Insights que ajudam a evoluir</h2>
            <p className="text-muted-foreground">
              Ideias simples que viram ação e geram resultado.
            </p>
          </div>

          <div className="mt-8 grid lg:grid-cols-2 gap-5">
            {[{
              title: "Encontre ‘vazamentos’ financeiros",
              desc: "Compare categorias mês a mês e identifique pequenos gastos recorrentes que somam no fim do mês.",
            }, {
              title: "Transforme metas em rotina",
              desc: "Defina um objetivo pequeno e mensurável (ex.: reduzir uma categoria) e acompanhe semanalmente.",
            }, {
              title: "Evite surpresas",
              desc: "Registre compromissos e acompanhe o impacto antes de eles vencerem.",
            }, {
              title: "Separe fase do momento",
              desc: "Use o modo adequado (Sobrevivência/Prosperidade) para priorizar o que faz sentido agora.",
            }].map((card) => (
              <div key={card.title} className="rounded-2xl border border-border/60 bg-background p-6">
                <h3 className="font-semibold mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl border border-border/60 bg-card p-8 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Pronto para começar?</h2>
              <p className="text-muted-foreground">
                Crie sua conta e comece agora. Se quiser, compare os planos com calma.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Button size="lg" onClick={handleGoToAuth} className="gap-2 w-full sm:w-auto">
                Criar conta
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={handleGoToPlans} className="gap-2 w-full sm:w-auto">
                Ver planos
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 sm:px-6 lg:px-8 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
              CF
            </div>
            <span className="font-semibold">Club Finance Track</span>
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} • Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
