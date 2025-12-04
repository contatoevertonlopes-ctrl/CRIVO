import NotificationsDropdown from "./NotificationsDropdown";

const DashboardHeader = () => {
  return (
    <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Dashboard financeiro</h1>
        <p className="text-[13px] text-muted-foreground">
          Visão geral do seu fluxo de caixa, desempenho mensal e planos de assinatura.
        </p>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <NotificationsDropdown />
        <button className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-border/50 bg-secondary/60 text-[13px] text-muted-foreground hover:border-border hover:text-foreground transition-all">
          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
          Período: Últimos 30 dias
        </button>
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-secondary bg-secondary/90">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary via-blue-500 to-background flex items-center justify-center text-sm font-semibold">
            E
          </div>
          <div className="flex flex-col gap-0">
            <span className="text-[13px]">Everton</span>
            <span className="text-[11px] text-muted-foreground">Gestor de Tráfego</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
