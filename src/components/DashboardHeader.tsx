import NotificationsDropdown from "./NotificationsDropdown";
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
import { startOfMonth, endOfMonth } from "date-fns";

interface DashboardHeaderProps {
  period?: number;
  onPeriodChange?: (days: number) => void;
  customDateFrom?: Date;
  customDateTo?: Date;
  onCustomDateChange?: (from: Date | undefined, to: Date | undefined) => void;
}

const DashboardHeader = ({ 
  period = 30, 
  onPeriodChange,
  customDateFrom,
  customDateTo,
  onCustomDateChange,
}: DashboardHeaderProps) => {
  const { profile } = useUserProfile();
  const { isShared, memberCount, loading: householdLoading } = useSharedHousehold();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
  const isCustomPeriod = customDateFrom !== undefined && customDateTo !== undefined;
  
  // Check if current selection is "this month"
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const isThisMonth = customDateFrom?.getTime() === monthStart.getTime() && 
                      customDateTo?.getTime() === monthEnd.getTime();

  const periodOptions = [
    { value: "this-month", label: "Este mês" },
    { value: "7", label: "7 dias" },
    { value: "30", label: "30 dias" },
    { value: "60", label: "60 dias" },
    { value: "90", label: "90 dias" },
    { value: "custom", label: "Personalizado" },
  ];

  const getCurrentValue = () => {
    if (isThisMonth) return "this-month";
    if (isCustomPeriod) return "custom";
    return period.toString();
  };

  const handlePeriodSelect = (value: string) => {
    if (value === "this-month") {
      onCustomDateChange?.(monthStart, monthEnd);
    } else if (value === "custom") {
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      onCustomDateChange?.(thirtyDaysAgo, today);
    } else {
      onPeriodChange?.(parseInt(value));
    }
  };

  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      {/* Title Section */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg font-semibold">Dashboard financeiro</h1>
          {!householdLoading && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-default ${
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
        <p className="text-xs text-muted-foreground">
          Visão geral do fluxo de caixa
        </p>
      </div>

      {/* Actions - Removed ModeToggle, only show on desktop */}
      <div className="flex items-center gap-2 flex-wrap">
        <NotificationsDropdown />
        
        <Select
          value={getCurrentValue()}
          onValueChange={handlePeriodSelect}
        >
          <SelectTrigger className="h-8 w-[120px] rounded-lg border-border/50 bg-secondary/60 text-xs text-muted-foreground hover:border-border hover:text-foreground">
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
        
        {(isCustomPeriod && !isThisMonth) && onCustomDateChange && (
          <DateRangePicker
            dateFrom={customDateFrom}
            dateTo={customDateTo}
            onDateChange={onCustomDateChange}
            className="h-8 text-xs"
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
