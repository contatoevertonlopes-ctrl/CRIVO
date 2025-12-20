import NotificationsDropdown from "./NotificationsDropdown";
import ModeToggle from "./ModeToggle";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSharedHousehold } from "@/hooks/useSharedHousehold";
import { User, Users } from "lucide-react";
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

interface DashboardHeaderProps {
  period?: number;
  onPeriodChange?: (days: number) => void;
}

const DashboardHeader = ({ period = 30, onPeriodChange }: DashboardHeaderProps) => {
  const { profile } = useUserProfile();
  const { isShared, memberCount, loading: householdLoading } = useSharedHousehold();

  const periodOptions = [
    { value: "7", label: "7 dias" },
    { value: "30", label: "30 dias" },
    { value: "60", label: "60 dias" },
    { value: "90", label: "90 dias" },
  ];

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

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <ModeToggle />
        <NotificationsDropdown />
        
        <Select
          value={period.toString()}
          onValueChange={(value) => onPeriodChange?.(parseInt(value))}
        >
          <SelectTrigger className="h-8 w-[100px] rounded-lg border-border/50 bg-secondary/60 text-xs text-muted-foreground hover:border-border hover:text-foreground">
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

        {/* User Avatar */}
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg border border-border/30 bg-secondary/50">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-xs font-semibold text-primary-foreground">
            {profile.initials}
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-medium leading-tight">{profile.fullName}</span>
            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
              {profile.email}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
