import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useSubscription } from "@/hooks/useSubscription";
import { useSidebarContext } from "@/contexts/SidebarContext";
import { useModulePreferences } from "@/hooks/useModulePreferences";
import { LayoutDashboard, ArrowRightLeft, BarChart3, Crown, Shield, Sparkles, Menu, X, Target, CreditCard, Landmark, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import AppLogo from "./AppLogo";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { subscribed, loading: subscriptionLoading } = useSubscription();
  const { collapsed, toggle } = useSidebarContext();
  const { modules } = useModulePreferences();

  // Base nav items
  const baseNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/", alwaysShow: true },
    { icon: ArrowRightLeft, label: "Transações", path: "/transactions", alwaysShow: true },
    { icon: Landmark, label: "Contas", path: "/accounts", module: "bankAccounts" as const },
    { icon: CreditCard, label: "Cartões", path: "/cards", module: "creditCards" as const },
    { icon: Target, label: "Objetivos", path: "/goals", module: "budgets" as const },
    { icon: BarChart3, label: "Relatórios", path: "/reports", alwaysShow: true },
    { icon: Settings, label: "Configurações", path: "/settings", alwaysShow: true },
  ];

  // Filter items based on active modules
  const navItems = baseNavItems.filter(
    (item) => item.alwaysShow || (item.module && modules[item.module])
  );

  // Mobile tab items - only show active modules
  const mobileTabItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: ArrowRightLeft, label: "Transações", path: "/transactions" },
    { icon: BarChart3, label: "Relatórios", path: "/reports" },
    ...(modules.bankAccounts ? [{ icon: Landmark, label: "Contas", path: "/accounts" }] : []),
    ...(modules.creditCards ? [{ icon: CreditCard, label: "Cartões", path: "/cards" }] : []),
  ];

  return (
    <>
      {/* Mobile Header with Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-sm border-b border-sidebar-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AppLogo size={28} className="text-primary" />
          <span className="font-semibold text-sm">FinTrack</span>
        </div>
        <button
          onClick={toggle}
          className="w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-colors"
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-sm border-t border-sidebar-border safe-area-pb"
        style={{ paddingLeft: 'env(safe-area-inset-left,0px)', paddingRight: 'env(safe-area-inset-right,0px)' }}
      >
        <div className="flex items-center justify-around w-full px-1 py-2">
          {mobileTabItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex-1 min-w-0 flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all",
                  isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-[22px] h-[22px] shrink-0" />
                <span className="hidden xs:block text-[10px] font-semibold truncate w-full text-center leading-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Slide-Out Menu */}
      {!collapsed && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={toggle}
          />
          <aside className="lg:hidden fixed top-[60px] left-0 bottom-[72px] w-72 bg-sidebar border-r border-sidebar-border z-50 flex flex-col p-3 animate-in slide-in-from-left-full duration-300">

            {/* Navigation */}
            <nav className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 px-2">
                Menu
              </span>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      toggle();
                    }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all text-left",
                      isActive
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}

              {/* Admin link */}
              {isAdmin && (
                <button
                  onClick={() => {
                    navigate("/admin");
                    toggle();
                  }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all text-left",
                    location.pathname === "/admin"
                      ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                      : "text-yellow-400/80 hover:bg-yellow-500/10 hover:text-yellow-400 border border-transparent"
                  )}
                >
                  <Shield className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">Administração</span>
                </button>
              )}
            </nav>

            {/* Bottom section */}
            <div className="mt-auto pt-4 border-t border-sidebar-border/50">
              {user ? (
                subscriptionLoading ? null : subscribed ? (
                  <button
                    onClick={() => {
                      navigate("/plans");
                      toggle();
                    }}
                    className="flex items-center gap-2 w-full px-3 py-3 rounded-lg border border-primary/30 bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors"
                  >
                    <Crown className="w-5 h-5 shrink-0" />
                    <span>Plano Pro Ativo</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      navigate("/plans");
                      toggle();
                    }}
                    className="flex flex-col w-full rounded-lg overflow-hidden p-3 bg-gradient-to-b from-primary/15 to-primary/5 border border-primary/30 hover:scale-[1.02] transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Assine o Pro</span>
                    </div>
                    <span className="text-xs text-muted-foreground mb-2 text-left">
                      Recursos ilimitados
                    </span>
                    <span className="text-xs text-center py-1.5 rounded-md bg-primary/20 text-primary">
                      Ver planos →
                    </span>
                  </button>
                )
              ) : (
                <button
                  onClick={() => {
                    navigate("/auth");
                    toggle();
                  }}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Login →
                </button>
              )}
            </div>
          </aside>
        </>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex fixed z-50 flex-col gap-4 bg-sidebar border-r border-sidebar-border min-h-screen transition-all duration-300 ease-out",
          collapsed ? "w-16 px-2 py-4" : "w-56 px-4 py-4"
        )}
      >
        {/* Toggle Button */}
        <button
          onClick={toggle}
          className={cn(
            "absolute -right-3 top-6 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-primary/20 transition-colors shadow-sm"
          )}
        >
          {collapsed ? (
            <Menu className="w-3 h-3 text-muted-foreground" />
          ) : (
            <X className="w-3 h-3 text-muted-foreground" />
          )}
        </button>

        {/* Logo */}
        <div
          className={cn(
            "flex items-center gap-2 cursor-pointer py-2",
            collapsed && "justify-center"
          )}
          onClick={() => navigate("/")}
        >
          <AppLogo size={28} className="text-primary shrink-0" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight">FinTrack</span>
              <span className="text-[10px] text-muted-foreground">Dashboard Financeiro</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 mt-2">
          {!collapsed && (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 px-2">
              Menu
            </span>
          )}
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-left",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </button>
            );
          })}

          {/* Admin link */}
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-left",
                collapsed && "justify-center px-2",
                location.pathname === "/admin"
                  ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                  : "text-yellow-400/80 hover:bg-yellow-500/10 hover:text-yellow-400 border border-transparent"
              )}
              title={collapsed ? "Administração" : undefined}
            >
              <Shield className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="text-sm">Administração</span>}
            </button>
          )}
        </nav>

        {/* Bottom section */}
        <div className="mt-auto pt-3 border-t border-sidebar-border/50">
          {user ? (
            subscribed ? (
              <button
                onClick={() => navigate("/plans")}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs hover:bg-primary/20 transition-colors",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? "Plano Pro" : undefined}
              >
                <Crown className="w-4 h-4 shrink-0" />
                {!collapsed && <span>Plano Pro</span>}
              </button>
            ) : (
              <button
                onClick={() => navigate("/plans")}
                className={cn(
                  "flex flex-col w-full rounded-lg overflow-hidden transition-all hover:scale-[1.02]",
                  collapsed
                    ? "p-2 items-center bg-primary/10 border border-primary/30"
                    : "p-3 bg-gradient-to-b from-primary/15 to-primary/5 border border-primary/30"
                )}
                title={collapsed ? "Assinar Pro" : undefined}
              >
                {collapsed ? (
                  <Sparkles className="w-4 h-4 text-primary" />
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3 h-3 text-primary" />
                      <span className="text-xs font-medium">Assine o Pro</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground mb-2 text-left">
                      Recursos ilimitados
                    </span>
                    <span className="text-xs text-center py-1 rounded-md bg-primary/20 text-primary">
                      Ver planos →
                    </span>
                  </>
                )}
              </button>
            )
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {collapsed ? "→" : "Login →"}
            </button>
          )}
        </div>
      </aside>

      {/* Desktop Spacer */}
      <div
        className={cn(
          "hidden lg:block shrink-0 transition-all duration-300",
          collapsed ? "w-16" : "w-56"
        )}
      />
    </>
  );
};

export default Sidebar;
