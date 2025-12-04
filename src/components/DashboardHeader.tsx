import { useState } from "react";
import NotificationsDropdown from "./NotificationsDropdown";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardHeaderProps {
  period?: number;
  onPeriodChange?: (days: number) => void;
}

const DashboardHeader = ({ period = 30, onPeriodChange }: DashboardHeaderProps) => {
  const { profile } = useUserProfile();

  const periodOptions = [
    { value: "7", label: "Últimos 7 dias" },
    { value: "30", label: "Últimos 30 dias" },
    { value: "60", label: "Últimos 60 dias" },
    { value: "90", label: "Últimos 90 dias" },
  ];

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
        <Select
          value={period.toString()}
          onValueChange={(value) => onPeriodChange?.(parseInt(value))}
        >
          <SelectTrigger className="w-[180px] rounded-full border-border/50 bg-secondary/60 text-[13px] text-muted-foreground hover:border-border hover:text-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></span>
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
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-secondary bg-secondary/90">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary via-blue-500 to-background flex items-center justify-center text-sm font-semibold">
            {profile.initials}
          </div>
          <div className="flex flex-col gap-0">
            <span className="text-[13px]">{profile.fullName}</span>
            <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">
              {profile.email}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
