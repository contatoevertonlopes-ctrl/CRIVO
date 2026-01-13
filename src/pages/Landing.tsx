import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppMode } from "@/contexts/AppModeContext";
import AppLogo from "@/components/AppLogo";
import CashflowChart from "@/components/CashflowChart";
import ExpenseChart from "@/components/ExpenseChart";
import ModeToggle from "@/components/ModeToggle";
import ProsperityWidget from "@/components/ProsperityWidget";
import SurvivalWidget from "@/components/SurvivalWidget";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  CreditCard,
  Download,
  LineChart,
  Lock,
  PiggyBank,
  Sparkles,
  Target,
  Wallet,
  Zap,
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const { mode } = useAppMode();

  const demoCashflow = useMemo(
    () => [
      { month: "Ago", receitas: 11800, despesas: 7340 },
      { month: "Set", receitas: 12600, despesas: 8120 },
      { month: "Out", receitas: 12450, despesas: 7650 },
      { month: "Nov", receitas: 13200, despesas: 7920 },
      { month: "Dez", receitas: 14100, despesas: 8640 },
      { month: "Jan", receitas: 14800, despesas: 6380 },
    ],
    [],
  );

  const demoExpenses = useMemo(
    () => [
      { name: "Casa", value: 2120 },
      { name: "Alimentação", value: 1030 },
      { name: "Mobilidade", value: 680 },
      { name: "Lazer", value: 420 },
    ],
    [],
  );

  const features = useMemo(
    () => [
      {
        title: "Visão clara do dinheiro",
        description:
          "Dashboards prontos pra ação: fluxo de caixa, categorias e evolução mês a mês — sem planilhas.",
        icon: BarChart3,
      },
      {
        title: "Rotina simples (e rápida)",
        description:
          "Registre em segundos, importe em lote e mantenha tudo organizado com uma experiência consistente.",
        icon: ZapLike,
      },
      {
        title: "Metas e prioridades",
        description:
          "Acompanhe objetivos e ajuste o plano com alertas e indicadores que te ajudam a decidir melhor.",
        icon: Target,
      },
      {
        title: "Privacidade em primeiro lugar",
        description:
          "Você controla o que registra e compartilha. Interface segura e pensada para uso diário.",
        icon: Lock,
      },
    ],
    [],
  );

  const steps = useMemo(
    () => [
      {
        title: "1) Registre ou importe",
        description: "Adicione transações rapidamente ou traga seus dados via CSV.",
        icon: Wallet,
      },
      {
        title: "2) Enxergue padrões",
        description: "Categorias, tendências e comparativos por período em poucos cliques.",
        icon: LineChart,
      },
      {
        title: "3) Tome decisões",
        description: "Defina metas e acompanhe o progresso com indicadores fáceis de entender.",
        icon: PiggyBank,
      },
    ],
    [],
  );

  const highlights = useMemo(
    () => [
      {
        label: "Fluxo mensal",
        value: "R$ 8.420",
        note: "+12% vs. mês anterior",
      },
      {
        label: "Gastos essenciais",
        value: "42%",
        note: "Categorias fixas e contas",
      },
      {
        label: "Meta de reserva",
        value: "68%",
        note: "Progresso semanal",
      },
    ],
    [],
  );

  const faqs = useMemo(
    () => [
      {
        q: "Preciso colocar cartão para começar?",
        a: "Não. Você pode criar conta e explorar o app. Planos e upgrades ficam na tela de Planos.",
      },
      {
        q: "Dá para instalar como app (PWA)?",
        a: "Sim. Use a opção “Instalar” e fixe no celular ou desktop para acesso rápido.",
      },
      {
        q: "O que eu ganho com os planos?",
        a: "Acesso a recursos premium e melhorias de produtividade. Veja os detalhes na página de planos.",
      },
    ],
    [],
  );

  const goAuth = () => navigate("/auth");
  const goPlans = () => navigate("/plans");
  const goInstall = () => navigate("/install");

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <Background />

      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Ir para a página inicial"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <AppLogo size={26} className="text-primary-foreground" />
            </div>
            <div className="hidden flex-col sm:flex">
              <span className="text-sm uppercase tracking-[0.28em] text-muted-foreground">FinTrack</span>
              <span className="font-['Space_Grotesk'] text-lg font-semibold">Club Finance Track</span>
            </div>
          </button>

          <nav className="hidden items-center gap-8 text-sm md:flex" aria-label="Navegação da landing">
            <a
              className="rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/60"
              href="#visao"
            >
              Visão geral
            </a>
            <a
              className="rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/60"
              href="#como-funciona"
            >
              Como funciona
            </a>
            <a
              className="rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/60"
              href="#insights"
            >
              Insights
            </a>
            <a
              className="rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/60"
              href="#planos"
            >
              Planos
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:block">
              <ModeToggle />
            </div>
            <ThemeToggle className="hidden sm:flex" />
            <Button
              variant="ghost"
              size="sm"
              onClick={goInstall}
              className="hidden sm:inline-flex gap-2"
            >
              <Download className="h-4 w-4" />
              Instalar
            </Button>
            <Button variant="ghost" size="sm" onClick={goAuth}>
              Entrar
            </Button>
            <Button size="sm" onClick={goAuth}>
              Criar conta
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-28">
        <section className="relative">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/75 px-4 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Controle financeiro moderno e adaptativo
              </div>

              <h1 className="mt-5 font-['Space_Grotesk'] text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                Clareza para decidir. Simplicidade para executar.
              </h1>

              <p className="mt-5 max-w-xl font-['Manrope'] text-base text-muted-foreground sm:text-lg">
                Registre transações, acompanhe categorias e veja seu fluxo de caixa com um painel feito para o dia a dia.
                Menos fricção, mais ação.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={goAuth} className="gap-2">
                  Começar agora
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={goPlans} className="gap-2">
                  Ver planos
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="secondary" onClick={goInstall} className="gap-2 sm:hidden">
                  Instalar
                  <Download className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { title: "Importação", desc: "CSV e lote" },
                  { title: "Metas", desc: "progresso visível" },
                  { title: "Relatórios", desc: "com clareza" },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-border/60 bg-card/60 p-4">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:justify-self-end">
              <div className="rounded-[32px] border border-border/70 bg-card/70 p-6 shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Preview real do sistema</p>
                    <p className="mt-1 text-lg font-semibold">Gráficos e widgets</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-primary/10 px-3 py-1 text-xs text-primary">
                    <Zap className="h-3.5 w-3.5" />
                    demo
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  <CashflowChart data={demoCashflow} periodLabel="Últimos 6 meses" />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <ExpenseChart data={demoExpenses} period={30} periodLabel="30 dias" />
                    <div className="rounded-xl border border-border/70 bg-card p-2 shadow-sm">
                      {mode === "survival" ? (
                        <SurvivalWidget
                          currentBalance={4200}
                          dailyExpenseAverage={165}
                          essentialExpenseAverage={120}
                        />
                      ) : (
                        <ProsperityWidget monthlyIncome={14800} monthlyExpenses={6380} variant="full" />
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Dica do sistema</span>
                      <span className="text-primary">ativa</span>
                    </div>
                    <p className="mt-2 text-sm">
                      “Revise assinaturas: economia estimada de <span className="font-semibold">R$ 89</span>/mês.”
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Exemplo ilustrativo com dados de demonstração.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="visao" className="scroll-mt-24 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Visão geral</p>
              <h2 className="mt-3 font-['Space_Grotesk'] text-3xl font-semibold sm:text-4xl">
                Elegante, funcional e com foco no que importa.
              </h2>
              <p className="mt-4 font-['Manrope'] text-base text-muted-foreground sm:text-lg">
                Uma experiência de finanças pessoais que se adapta ao seu momento — e te dá o próximo passo com clareza.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {features.map((f) => (
                <div key={f.title} className="rounded-3xl border border-border/60 bg-card/60 p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                      <f.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">{f.title}</h3>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="scroll-mt-24 bg-secondary/30 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Como funciona</p>
              <h2 className="mt-3 font-['Space_Grotesk'] text-3xl font-semibold sm:text-4xl">
                Do registro ao insight em minutos.
              </h2>
              <p className="mt-4 font-['Manrope'] text-base text-muted-foreground sm:text-lg">
                Um fluxo simples para você manter consistência (sem depender de motivação).
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((s) => (
                <div key={s.title} className="rounded-3xl border border-border/60 bg-background/70 p-6">
                  <s.icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="insights" className="scroll-mt-24 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Insights</p>
                <h2 className="mt-3 font-['Space_Grotesk'] text-3xl font-semibold sm:text-4xl">
                  Dados que viram decisões.
                </h2>
                <p className="mt-4 font-['Manrope'] text-base text-muted-foreground sm:text-lg">
                  Entenda para onde o dinheiro vai, identifique vazamentos e acompanhe metas de forma objetiva.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      title: "Vazamentos invisíveis",
                      desc: "Recorrências, taxas e gastos pequenos que viram bola de neve.",
                    },
                    {
                      title: "Progresso de metas",
                      desc: "Impacto semanal e ajuste de ritmo com previsibilidade.",
                    },
                    {
                      title: "Previsão de caixa",
                      desc: "Simule compromissos antes do vencimento.",
                    },
                    {
                      title: "Alertas acionáveis",
                      desc: "Sugestões práticas baseadas no seu padrão de uso.",
                    },
                  ].map((card) => (
                    <div key={card.title} className="rounded-2xl border border-border/60 bg-card/60 p-4">
                      <p className="text-sm font-semibold">{card.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{card.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-border/60 bg-card/70 p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Destaques</p>
                  <span className="text-xs text-muted-foreground">últimos 30 dias</span>
                </div>
                <div className="mt-4 grid gap-4">
                  {highlights.map((h) => (
                    <div key={h.label} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{h.label}</span>
                        <span className="text-sm font-semibold">{h.value}</span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{h.note}</p>
                    </div>
                  ))}

                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Lock className="h-4 w-4 text-primary" />
                      Privacidade e proteção
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Seus dados ficam protegidos, e você controla o que registra e compartilha.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="planos" className="scroll-mt-24 pb-20 pt-4">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-8 rounded-[32px] border border-border/60 bg-card/70 p-8 shadow-xl md:flex-row md:items-center">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Comece agora</p>
                <h2 className="mt-3 font-['Space_Grotesk'] text-3xl font-semibold sm:text-4xl">
                  Pronto para dar o próximo passo?
                </h2>
                <p className="mt-3 font-['Manrope'] text-base text-muted-foreground sm:text-lg">
                  Crie sua conta e experimente o painel completo. Se quiser, compare opções na página de planos.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  {[
                    "Setup em minutos",
                    "Plano flexível",
                    "Suporte humano",
                    "Sem cartão agora",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
                <Button size="lg" onClick={goAuth} className="gap-2">
                  Criar conta
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={goPlans} className="gap-2">
                  Ver planos
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="secondary" onClick={goInstall} className="gap-2">
                  Instalar
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {faqs.map((item) => (
                <div key={item.q} className="rounded-3xl border border-border/60 bg-card/60 p-6">
                  <p className="text-sm font-semibold">{item.q}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t border-border/60 py-10">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <AppLogo size={22} className="text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">Club Finance Track</span>
            </div>
            <span>© {new Date().getFullYear()} Club Finance Track. Todos os direitos reservados.</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

function Background() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute -top-40 right-0 h-[520px] w-[520px] rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute -bottom-32 left-0 h-[420px] w-[420px] rounded-full bg-secondary/80 blur-[140px]" />
      <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_10%_-20%,rgba(56,189,248,0.18),transparent),radial-gradient(800px_400px_at_90%_20%,rgba(14,165,233,0.12),transparent)]" />
    </div>
  );
}

function MiniChart() {
  return (
    <svg className="mt-3 h-16 w-full" viewBox="0 0 280 64" fill="none" aria-hidden="true">
      <path
        d="M0 44C28 38 44 40 64 32C86 22 110 20 132 28C154 36 172 46 192 38C214 30 232 14 280 10"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
      />
      <path
        d="M0 54C28 48 44 52 64 42C86 32 110 32 132 38C154 44 172 50 192 46C214 42 232 26 280 22"
        stroke="hsl(var(--muted-foreground))"
        strokeWidth="1.5"
        opacity="0.35"
      />
    </svg>
  );
}

function ZapLike(props: { className?: string }) {
  return <Zap className={props.className} />;
}

export default Landing;
