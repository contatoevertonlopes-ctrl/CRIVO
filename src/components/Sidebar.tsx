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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-md border-b border-sidebar-border/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AppLogo size={26} className="text-sidebar-primary shrink-0" />
          <span className="font-bold text-sm tracking-[2px] uppercase">CRIVO</span>
        </div>
        <button
          onClick={toggle}
          className="w-9 h-9 rounded-xl bg-sidebar-accent/60 flex items-center justify-center hover:bg-sidebar-accent transition-colors active:scale-95"
        >
          {collapsed ? <Menu className="w-4 h-4 text-sidebar-foreground" /> : <X className="w-4 h-4 text-sidebar-foreground" />}
        </button>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-md border-t border-sidebar-border/80"
        style={{
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
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
                  "relative flex-1 min-w-0 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-xl transition-all duration-200 active:scale-[0.92]",
                  isActive
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80"
                )}
              >
                {/* Active dot indicator */}
                {isActive && (
                  <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-sidebar-primary" />
                )}
                {/* Active pill background */}
                {isActive && (
                  <span className="absolute inset-x-1.5 inset-y-0.5 rounded-xl bg-sidebar-primary/12" />
                )}
                <Icon
                  className={cn(
                    "relative w-5 h-5 shrink-0 transition-all duration-200 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]",
                    isActive ? "scale-110 sidebar-icon-active" : "sidebar-icon"
                  )}
                />
                <span className={cn(
                  "relative text-[9px] xs:text-[10px] truncate w-full text-center leading-tight tracking-wide",
                  isActive ? "font-semibold" : "font-normal"
                )}>
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
              <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/40 mb-2 px-2">
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
                      "flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-150 text-left active:scale-[0.98]",
                      isActive
                        ? "bg-sidebar-primary/15 text-sidebar-primary font-semibold ring-1 ring-sidebar-primary/25"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground border border-transparent"
                    )}
                  >
                    <Icon className={cn("w-5 h-5 shrink-0", isActive ? "sidebar-icon-active stroke-[2.5px]" : "sidebar-icon")} />
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
                    className="flex items-center gap-2 w-full px-3 py-3 rounded-lg border border-sidebar-primary/30 bg-sidebar-primary/10 text-sidebar-primary text-sm hover:bg-sidebar-primary/20 transition-colors"
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
                    className="flex flex-col w-full rounded-lg overflow-hidden p-3 bg-gradient-to-b from-sidebar-primary/15 to-sidebar-primary/5 border border-sidebar-primary/30 hover:scale-[1.02] transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-sidebar-primary" />
                      <span className="text-sm font-medium text-sidebar-foreground">Assine o Pro</span>
                    </div>
                    <span className="text-xs text-sidebar-foreground/50 mb-2 text-left">
                      Recursos ilimitados
                    </span>
                    <span className="text-xs text-center py-1.5 rounded-md bg-sidebar-primary/20 text-sidebar-primary">
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
                  className="text-sm text-sidebar-primary hover:text-sidebar-primary/80 transition-colors"
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
            "absolute -right-3 top-6 w-6 h-6 rounded-full bg-sidebar-accent border border-sidebar-border flex items-center justify-center hover:bg-sidebar-primary/20 transition-colors shadow-sm"
          )}
        >
          {collapsed ? (
            <Menu className="w-3 h-3 text-sidebar-foreground/60" />
          ) : (
            <X className="w-3 h-3 text-sidebar-foreground/60" />
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
          <AppLogo size={28} className="text-sidebar-primary shrink-0" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-[2px] uppercase leading-tight text-sidebar-foreground">CRIVO</span>
              <span className="text-[10px] text-sidebar-foreground/50">Clareza Financeira</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 mt-2">
          {!collapsed && (
            <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/40 mb-1 px-2">
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
                  "flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150 text-left",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-sidebar-primary/15 text-sidebar-primary font-semibold shadow-sm ring-1 ring-sidebar-primary/25"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground border border-transparent"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "sidebar-icon-active stroke-[2.5px]" : "sidebar-icon")} />
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
              <Shield className={cn("w-4 h-4 shrink-0", location.pathname === "/admin" ? "sidebar-icon-active" : "sidebar-icon")} />
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
                  "flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-sidebar-primary/30 bg-sidebar-primary/10 text-sidebar-primary text-xs hover:bg-sidebar-primary/20 transition-colors",
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
                    ? "p-2 items-center bg-sidebar-primary/10 border border-sidebar-primary/30"
                    : "p-3 bg-gradient-to-b from-sidebar-primary/15 to-sidebar-primary/5 border border-sidebar-primary/30"
                )}
                title={collapsed ? "Assinar Pro" : undefined}
              >
                {collapsed ? (
                  <Sparkles className="w-4 h-4 text-sidebar-primary" />
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3 h-3 text-sidebar-primary" />
                      <span className="text-xs font-medium text-sidebar-foreground">Assine o Pro</span>
                    </div>
                    <span className="text-[10px] text-sidebar-foreground/50 mb-2 text-left">
                      Recursos ilimitados
                    </span>
                    <span className="text-xs text-center py-1 rounded-md bg-sidebar-primary/20 text-sidebar-primary">
                      Ver planos →
                    </span>
                  </>
                )}
              </button>
            )
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="text-sm text-sidebar-primary hover:text-sidebar-primary/80 transition-colors"
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
