import { Copy, Edit2, RefreshCw, Trash2 } from "lucide-react";
import StatusSelector from "./StatusSelector";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  status: string;
  is_recurring?: boolean;
  recurring_series_id?: string | null;
  paid_date?: string;
  tag?: string;
  user_id?: string;
}

interface MemberInfo {
  name: string;
  initials: string;
  avatar: string | null;
}

interface TransactionCardProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onDuplicate: (transaction: Transaction) => void;
  onStatusChange?: () => void;
  memberInfo?: MemberInfo;
  showMember?: boolean;
}

const TransactionCard = ({ transaction, onEdit, onDelete, onDuplicate, onStatusChange, memberInfo, showMember }: TransactionCardProps) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getTagLabel = (tag: string) => {
    const tagMap: Record<string, string> = {
      fixa: "Fixa",
      variavel: "Variável",
      esporadica: "Esporádica",
    };
    return tagMap[tag] || tag;
  };

  const getTagStyle = (tag: string) => {
    switch (tag) {
      case "fixa":
        return "bg-blue-500/12 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300 ring-1 ring-blue-500/20";
      case "variavel":
        return "bg-orange-500/12 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300 ring-1 ring-orange-500/20";
      case "esporadica":
        return "bg-purple-500/12 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300 ring-1 ring-purple-500/20";
      default:
        return "bg-secondary/60 text-muted-foreground ring-1 ring-border/30";
    }
  };

  return (
    <div className="group px-4 py-3.5 border-b border-border/60 last:border-b-0 hover:bg-accent/[0.04] dark:hover:bg-white/[0.025] transition-colors duration-150">
      <div className="flex items-start justify-between gap-3">
        {showMember && memberInfo && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="shrink-0">
                <Avatar className="w-8 h-8 ring-2 ring-border/40">
                  <AvatarImage src={memberInfo.avatar || undefined} />
                  <AvatarFallback className="text-xs bg-primary/15 text-primary font-semibold">
                    {memberInfo.initials}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{memberInfo.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-sm truncate text-foreground">{transaction.description}</span>
            {transaction.is_recurring && (
              <RefreshCw className="w-3 h-3 text-primary shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap mt-0.5">
            <span>{formatDate(transaction.date)}</span>
            <span className="text-border">·</span>
            <span>{transaction.category}</span>
            {transaction.tag && (
              <>
                <span className="text-border">·</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getTagStyle(transaction.tag)}`}>
                  {getTagLabel(transaction.tag)}
                </span>
              </>
            )}
            {transaction.paid_date && (
              <>
                <span className="text-border">·</span>
                <span className="text-income font-medium">Pago {formatDate(transaction.paid_date)}</span>
              </>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={`font-bold text-sm finance-value ${transaction.type === "income" ? "text-income" : "text-expense"}`}>
            {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
            transaction.type === "income"
              ? "bg-income-muted text-income-muted-foreground"
              : "bg-expense-muted text-expense-muted-foreground"
          }`}>
            {transaction.type === "income" ? "Entrada" : "Saída"}
          </span>
          <StatusSelector
            transactionId={transaction.id}
            currentStatus={transaction.status}
            recurringSeriesId={transaction.recurring_series_id}
            onStatusChange={onStatusChange}
            size="sm"
          />
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={() => onDuplicate(transaction)}
            className="p-1.5 rounded-lg hover:bg-primary/12 text-muted-foreground hover:text-primary transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(transaction)}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(transaction.id)}
            className="p-1.5 rounded-lg hover:bg-expense-muted text-muted-foreground hover:text-expense transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionCard;
