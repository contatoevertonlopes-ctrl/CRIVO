const Sidebar = () => {
  return (
    <aside className="hidden lg:flex flex-col gap-6 bg-sidebar border-r border-sidebar-border px-5 py-6 min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary via-primary to-green-900 flex items-center justify-center font-bold text-lg shadow-[0_0_40px_rgba(34,197,94,0.7)]">
          F
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="text-base font-bold tracking-tight">FinTrack Pro</div>
          <div className="text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
            Dashboard Fintech
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-2 mt-3">
            Navegação
          </div>
          <ul className="flex flex-col gap-1">
            <li className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/50 text-foreground cursor-pointer transition-all duration-200">
              <span className="w-6 h-6 rounded-full bg-secondary/80 flex items-center justify-center text-sm">
                📊
              </span>
              <span className="text-sm">Dashboard</span>
            </li>
            <li className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-secondary/90 hover:border-border/40 hover:text-foreground border border-transparent cursor-pointer transition-all duration-200">
              <span className="w-6 h-6 rounded-full bg-secondary/80 flex items-center justify-center text-sm">
                💸
              </span>
              <span className="text-sm">Transações</span>
            </li>
            <li className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-secondary/90 hover:border-border/40 hover:text-foreground border border-transparent cursor-pointer transition-all duration-200">
              <span className="w-6 h-6 rounded-full bg-secondary/80 flex items-center justify-center text-sm">
                📈
              </span>
              <span className="text-sm">Relatórios & Gráficos</span>
            </li>
            <li className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-secondary/90 hover:border-border/40 hover:text-foreground border border-transparent cursor-pointer transition-all duration-200">
              <span className="w-6 h-6 rounded-full bg-secondary/80 flex items-center justify-center text-sm">
                ⚙️
              </span>
              <span className="text-sm">Configurações</span>
            </li>
          </ul>
        </div>
      </nav>

      {/* Bottom section */}
      <div className="mt-auto pt-3 border-t border-sidebar-border flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-[11px] text-green-200">
          <span>⚡</span>
          <span>Plano Premium Ativo</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Visualize fluxo de caixa, recorrências e previsões em tempo real. Ideal para quem leva números a sério.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
