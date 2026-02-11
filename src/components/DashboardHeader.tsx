import NotificationBell from "./NotificationBell";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSharedHousehold } from "@/hooks/useSharedHousehold";
import { User, Users, Settings as SettingsIcon, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DateRangePicker } from "./DateRangePicker";
import { addMonths, endOfMonth, isSameDay, startOfMonth, subMonths } from "date-fns";
import ThemeToggle from "./ThemeToggle";

interface DashboardHeaderProps {
  customDateFrom?: Date;
  customDateTo?: Date;
  onCustomDateChange?: (from: Date | undefined, to: Date | undefined) => void;
}

const DashboardHeader = ({ 
  customDateFrom,
  customDateTo,
  onCustomDateChange,
}: DashboardHeaderProps) => {
  const { profile } = useUserProfile();
  const { isShared, memberCount, loading: householdLoading } = useSharedHousehold();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
  const today = new Date();
  const thisMonthStart = startOfMonth(today);
  const thisMonthEnd = endOfMonth(today);
  const prevRef = subMonths(today, 1);
  const prevMonthStart = startOfMonth(prevRef);
  const prevMonthEnd = endOfMonth(prevRef);
  const nextRef = addMonths(today, 1);
  const nextMonthStart = startOfMonth(nextRef);
  const nextMonthEnd = endOfMonth(nextRef);

  const matchesRange = (start: Date, end: Date) =>
    !!customDateFrom &&
    !!customDateTo &&
    isSameDay(customDateFrom, start) &&
    isSameDay(customDateTo, end);

  const periodOptions = [
    { value: "prev-month", label: "Mês anterior" },
    { value: "this-month", label: "Este mês" },
    { value: "next-month", label: "Próximo mês" },
    { value: "custom", label: "Personalizado" },
  ];

  const getCurrentValue = () => {
    if (matchesRange(prevMonthStart, prevMonthEnd)) return "prev-month";
    if (matchesRange(thisMonthStart, thisMonthEnd)) return "this-month";
    if (matchesRange(nextMonthStart, nextMonthEnd)) return "next-month";
    if (customDateFrom && customDateTo) return "custom";
    return "this-month";
  };

  const handlePeriodSelect = (value: string) => {
    if (value === "prev-month") {
      onCustomDateChange?.(prevMonthStart, prevMonthEnd);
    } else if (value === "this-month") {
      onCustomDateChange?.(thisMonthStart, thisMonthEnd);
    } else if (value === "next-month") {
      onCustomDateChange?.(nextMonthStart, nextMonthEnd);
    } else if (value === "custom") {
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      onCustomDateChange?.(thirtyDaysAgo, today);
    }
  };

  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      {/* Title Section */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold">Dashboard financeiro</h1>
          {!householdLoading && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold transition-all cursor-default ${
                    isShared
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-secondary text-muted-foreground border border-border/30"
                  }`}
                >
                  {isShared ? (
                    <>
                      <Users className="w-3 h-3" />
                      <span>Compartilhado</span>
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3" />
                      <span>Individual</span>
                    </>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isShared
                  ? `${memberCount} membros na conta`
                  : "Transações privadas"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Visão geral do fluxo de caixa
        </p>
      </div>

      {/* Actions - Removed ModeToggle, only show on desktop */}
      <div className="flex items-center gap-2 flex-wrap">
        <ThemeToggle />
        <NotificationBell />
        
        <Select
          value={getCurrentValue()}
          onValueChange={handlePeriodSelect}
        >
          <SelectTrigger className="h-10 w-[140px] rounded-lg border-border/50 bg-secondary/60 text-sm text-muted-foreground hover:border-border hover:text-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5"></span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {getCurrentValue() === "custom" && onCustomDateChange && (
          <DateRangePicker
            dateFrom={customDateFrom}
            dateTo={customDateTo}
            onDateChange={onCustomDateChange}
            className="h-10 text-sm"
          />
        )}

        {/* User Avatar + Menu - Hidden on mobile */}
        <div className="hidden sm:flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 px-2 py-1 rounded-lg border border-border/30 bg-secondary/50 cursor-pointer">
                <Avatar className="w-6 h-6">
                  {profile?.avatarUrl ? (
                    <AvatarImage src={profile.avatarUrl || undefined} />
                  ) : (
                    <AvatarFallback className="text-xs bg-primary/20 text-primary">{profile.initials}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-xs font-medium leading-tight">{profile.fullName}</span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                    {profile.email}
                  </span>
                </div>
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <div className="text-sm font-medium">{profile.fullName}</div>
                <div className="text-xs text-muted-foreground truncate">{profile.email}</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <SettingsIcon className="w-4 h-4 mr-2 inline" /> Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await signOut();
                  navigate('/auth');
                }}
              >
                <LogOut className="w-4 h-4 mr-2 inline" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
