import { Copy, Edit2, RefreshCw, Trash2 } from "lucide-react";
import StatusSelector from "./StatusSelector";

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  status: string;
  is_recurring?: boolean;
  paid_date?: string;
  tag?: string;
}

interface TransactionCardProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onDuplicate: (transaction: Transaction) => void;
  onStatusChange?: () => void;
}

const TransactionCard = ({ transaction, onEdit, onDelete, onDuplicate, onStatusChange }: TransactionCardProps) => {
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
        return "bg-blue-500/20 text-blue-300";
      case "variavel":
        return "bg-orange-500/20 text-orange-300";
      case "esporadica":
        return "bg-purple-500/20 text-purple-300";
      default:
        return "bg-secondary/50 text-muted-foreground";
    }
  };

  return (
    <div className="p-4 border-b border-secondary/50 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium truncate">{transaction.description}</span>
            {transaction.is_recurring && (
              <RefreshCw className="w-3 h-3 text-primary shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span>{formatDate(transaction.date)}</span>
            <span>•</span>
            <span>{transaction.category}</span>
            {transaction.tag && (
              <>
                <span>•</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${getTagStyle(transaction.tag)}`}>
                  {getTagLabel(transaction.tag)}
                </span>
              </>
            )}
            {transaction.paid_date && (
              <>
                <span>•</span>
                <span className="text-primary">Pago em {formatDate(transaction.paid_date)}</span>
              </>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={`font-bold ${transaction.type === "income" ? "text-primary" : "text-destructive"}`}>
            {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            transaction.type === "income"
              ? "bg-primary/14 text-green-200"
              : "bg-destructive/10 text-red-200"
          }`}>
            {transaction.type === "income" ? "Entrada" : "Saída"}
          </span>
          <StatusSelector
            transactionId={transaction.id}
            currentStatus={transaction.status}
            onStatusChange={onStatusChange}
            size="sm"
          />
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicate(transaction)}
            className="p-2 rounded-lg hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(transaction)}
            className="p-2 rounded-lg hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(transaction.id)}
            className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionCard;
