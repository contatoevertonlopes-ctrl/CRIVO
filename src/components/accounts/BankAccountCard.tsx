import { BankAccount, BANK_PRESETS } from "@/hooks/useBankAccounts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Landmark, Wallet, CreditCard, MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BankAccountCardProps {
  account: BankAccount;
  onEdit: (account: BankAccount) => void;
  onDelete: (account: BankAccount) => void;
}

const getIcon = (iconName: string, color: string) => {
  const iconProps = { className: "w-6 h-6", style: { color } };
  
  switch (iconName) {
    case "wallet":
      return <Wallet {...iconProps} />;
    case "credit-card":
      return <CreditCard {...iconProps} />;
    default:
      return <Landmark {...iconProps} />;
  }
};

// Helpers to determine if a color is dark so we can pick a readable text color
const hexToRgb = (hex: string) => {
  const clean = hex.replace('#', '').trim();
  const bigint = parseInt(clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const isColorDark = (hex: string) => {
  try {
    const { r, g, b } = hexToRgb(hex);
    const [Rsrgb, Gsrgb, Bsrgb] = [r, g, b].map(v => v / 255);
    const [R, G, B] = [Rsrgb, Gsrgb, Bsrgb].map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
    const lum = 0.2126 * R + 0.7152 * G + 0.0722 * B;
    return lum < 0.179; // WCAG threshold for dark backgrounds
  } catch (e) {
    return false;
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const BankAccountCard = ({ account, onEdit, onDelete }: BankAccountCardProps) => {
  const preset = BANK_PRESETS[account.bank_name] || BANK_PRESETS["Outro"];
  const color = account.color || preset.color;
  const icon = account.icon || preset.icon;
  const isNegative = account.balance < 0;
  const readableColor = isColorDark(color) ? "#ffffff" : color;
  const iconColor = readableColor;

  return (
    <Card 
      className="relative overflow-hidden border-border/50 hover:border-border transition-colors group"
      style={{ 
        background: `linear-gradient(135deg, hsl(var(--card)) 0%, ${color}10 100%)`,
      }}
    >
      {/* Color stripe at top */}
      <div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: color }}
      />
      
      <CardContent className="p-4 pt-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${color}20` }}
            >
              {getIcon(icon, iconColor)}
            </div>
            <div>
              <h3 className="font-semibold text-sm">{account.bank_name}</h3>
              <p className="text-xs text-muted-foreground">{account.name}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(account)}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(account)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remover
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Saldo atual</span>
            <Badge 
              variant={account.account_type === "checking" ? "default" : "secondary"}
              className="text-[10px] px-2 py-0"
            >
              {account.account_type === "checking" ? "Corrente" : "Poupança"}
            </Badge>
          </div>
          <p 
            className={`text-xl font-bold ${isNegative ? "text-destructive" : ""}`}
            style={{ color: isNegative ? undefined : readableColor }}
          >
            {formatCurrency(account.balance)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
