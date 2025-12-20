import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import TransactionCard from "./TransactionCard";
import { 
  ShoppingCart, 
  Home, 
  Car, 
  Utensils, 
  Heart, 
  Briefcase, 
  Plane, 
  Gamepad2, 
  GraduationCap,
  Smartphone,
  Shirt,
  Coffee,
  Dumbbell,
  Gift,
  DollarSign,
  CreditCard,
  LucideIcon
} from "lucide-react";

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
  user_id?: string;
}

interface MemberInfo {
  name: string;
  initials: string;
  avatar: string | null;
}

interface TransactionTimelineProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onDuplicate: (transaction: Transaction) => void;
  onStatusChange?: () => void;
  getMemberInfo?: (userId: string) => MemberInfo;
  showMember?: boolean;
}

// Category to icon mapping
const categoryIcons: Record<string, LucideIcon> = {
  "Alimentação": Utensils,
  "Mercado": ShoppingCart,
  "Supermercado": ShoppingCart,
  "Moradia": Home,
  "Aluguel": Home,
  "Casa": Home,
  "Transporte": Car,
  "Carro": Car,
  "Combustível": Car,
  "Saúde": Heart,
  "Farmácia": Heart,
  "Trabalho": Briefcase,
  "Salário": Briefcase,
  "Freelance": Briefcase,
  "Viagem": Plane,
  "Lazer": Gamepad2,
  "Entretenimento": Gamepad2,
  "Educação": GraduationCap,
  "Cursos": GraduationCap,
  "Tecnologia": Smartphone,
  "Celular": Smartphone,
  "Internet": Smartphone,
  "Vestuário": Shirt,
  "Roupas": Shirt,
  "Café": Coffee,
  "Academia": Dumbbell,
  "Esportes": Dumbbell,
  "Presentes": Gift,
  "Investimentos": DollarSign,
  "Cartão": CreditCard,
};

const getCategoryIcon = (category: string): LucideIcon => {
  // Check for exact match first
  if (categoryIcons[category]) {
    return categoryIcons[category];
  }
  
  // Check for partial match
  const lowerCategory = category.toLowerCase();
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (lowerCategory.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerCategory)) {
      return icon;
    }
  }
  
  return CreditCard; // Default icon
};

const TransactionTimeline = ({ 
  transactions, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onStatusChange,
  getMemberInfo,
  showMember 
}: TransactionTimelineProps) => {
  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    
    transactions.forEach((transaction) => {
      const dateKey = transaction.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(transaction);
    });
    
    // Sort dates in descending order
    const sortedDates = Object.keys(groups).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
    
    return sortedDates.map(date => ({
      date,
      transactions: groups[date]
    }));
  }, [transactions]);

  const formatDateHeader = (dateStr: string) => {
    const date = parseISO(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) {
      return "Hoje";
    }
    if (format(date, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd")) {
      return "Ontem";
    }
    
    return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
  };

  const calculateDayTotal = (dayTransactions: Transaction[]) => {
    return dayTransactions.reduce((acc, t) => {
      return acc + (t.type === "income" ? t.amount : -t.amount);
    }, 0);
  };

  const formatCurrency = (value: number) => {
    const formatted = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Math.abs(value));
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm mb-1">Nenhuma transação</p>
        <p className="text-xs">Adicione sua primeira transação</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groupedTransactions.map(({ date, transactions: dayTransactions }) => {
        const dayTotal = calculateDayTotal(dayTransactions);
        const Icon = getCategoryIcon(dayTransactions[0]?.category || "");
        
        return (
          <div key={date} className="space-y-1">
            {/* Date Header */}
            <div className="flex items-center justify-between px-2 py-2 sticky top-0 bg-card/95 backdrop-blur-sm z-10 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                <span className="text-xs font-medium text-foreground capitalize">
                  {formatDateHeader(date)}
                </span>
              </div>
              <span className={`text-xs font-medium ${
                dayTotal >= 0 ? "text-primary" : "text-destructive"
              }`}>
                {formatCurrency(dayTotal)}
              </span>
            </div>
            
            {/* Transactions for this day */}
            <div className="rounded-xl border border-border/30 bg-card/50 overflow-hidden divide-y divide-border/20">
              {dayTransactions.map((transaction) => {
                const CategoryIcon = getCategoryIcon(transaction.category);
                const memberInfo = getMemberInfo ? getMemberInfo(transaction.user_id || "") : undefined;
                
                return (
                  <div key={transaction.id} className="flex items-center gap-3 p-3 md:p-4 hover:bg-secondary/30 transition-colors">
                    {/* Category Icon */}
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                      transaction.type === "income" 
                        ? "bg-primary/15 text-primary" 
                        : "bg-destructive/10 text-destructive"
                    }`}>
                      <CategoryIcon className="w-5 h-5" />
                    </div>
                    
                    {/* Transaction Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm truncate">{transaction.description}</span>
                        {transaction.is_recurring && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                            Recorrente
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap">
                        <span>{transaction.category}</span>
                        {transaction.tag && (
                          <>
                            <span>•</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                              transaction.tag === "fixa" 
                                ? "bg-blue-500/15 text-blue-400"
                                : transaction.tag === "variavel"
                                  ? "bg-purple-500/15 text-purple-400"
                                  : "bg-orange-500/15 text-orange-400"
                            }`}>
                              {transaction.tag === "fixa" ? "Fixa" : transaction.tag === "variavel" ? "Variável" : "Esporádica"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Amount */}
                    <div className="shrink-0 text-right">
                      <p className={`font-semibold text-sm ${
                        transaction.type === "income" ? "text-primary" : "text-foreground"
                      }`}>
                        {transaction.type === "income" ? "+" : "-"}
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(transaction.amount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TransactionTimeline;
