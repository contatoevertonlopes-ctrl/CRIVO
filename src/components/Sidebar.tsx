import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSidebarContext } from "@/contexts/SidebarContext";
import { ChevronLeft, ChevronRight, LayoutDashboard, ArrowRightLeft, BarChart3, Settings, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { collapsed, toggle } = useSidebarContext();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: ArrowRightLeft, label: "Transações", path: "/transactions" },
    { icon: BarChart3, label: "Relatórios", path: "/reports" },
    { icon: Settings, label: "Configurações", path: "/settings" },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={toggle}
        />
      )}

      <aside 
        className={cn(
          "fixed lg:relative z-50 flex flex-col gap-6 bg-sidebar border-r border-sidebar-border px-5 py-6 min-h-screen transition-all duration-300 ease-in-out",
          collapsed ? "w-[72px] px-3" : "w-64",
          "lg:translate-x-0",
          collapsed ? "-translate-x-full lg:translate-x-0" : "translate-x-0"
        )}
      >
        {/* Toggle Button */}
        <button
          onClick={toggle}
          className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-primary/20 transition-colors z-50"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {/* Logo */}
        <div 
          className={cn(
            "flex items-center gap-3 cursor-pointer",
            collapsed && "justify-center"
          )}
          onClick={() => navigate("/")}
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary via-primary to-green-900 flex items-center justify-center font-bold text-lg shadow-[0_0_40px_rgba(34,197,94,0.7)] shrink-0">
            F
          </div>
          {!collapsed && (
            <div className="flex flex-col gap-0.5">
              <div className="text-base font-bold tracking-tight">FinTrack Pro</div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
                Dashboard Fintech
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-6">
          <div>
            {!collapsed && (
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-2 mt-3">
                Navegação
              </div>
            )}
            <ul className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <li
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200",
                      collapsed && "justify-center px-2",
                      isActive
                        ? "bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/50 text-foreground"
                        : "text-muted-foreground hover:bg-secondary/90 hover:border-border/40 hover:text-foreground border border-transparent"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {!collapsed && <span className="text-sm">{item.label}</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Bottom section */}
        <div className="mt-auto pt-3 border-t border-sidebar-border flex flex-col gap-3">
          {user ? (
            <>
              <div 
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-[11px] text-green-200 cursor-pointer hover:bg-primary/20 transition-colors",
                  collapsed && "justify-center px-2"
                )}
                onClick={() => navigate("/plans")}
                title={collapsed ? "Plano Pro" : undefined}
              >
                <Crown className="w-4 h-4 shrink-0" />
                {!collapsed && <span>Plano Premium Ativo</span>}
              </div>
              {!collapsed && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Visualize fluxo de caixa, recorrências e previsões em tempo real.
                </p>
              )}
            </>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className={cn(
                "text-sm text-primary hover:text-primary/80 transition-colors text-left",
                collapsed && "text-center"
              )}
            >
              {collapsed ? "→" : "Fazer login →"}
            </button>
          )}
        </div>
      </aside>

      {/* Spacer for fixed sidebar */}
      <div className={cn(
        "hidden lg:block shrink-0 transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )} />
    </>
  );
};

export default Sidebar;
