import { useState } from "react";
import { Sparkles, Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useHouseholdId } from "@/hooks/useHouseholdId";

interface ParsedTransaction {
  amount: number;
  description: string;
  type: "income" | "expense";
  date: Date;
  category: string;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Alimentação": ["pizza", "lanche", "restaurante", "ifood", "almoço", "jantar", "café", "mercado", "supermercado", "padaria", "açougue"],
  "Transporte": ["uber", "99", "gasolina", "combustível", "estacionamento", "ônibus", "metrô", "táxi", "pedágio"],
  "Moradia": ["aluguel", "condomínio", "iptu", "luz", "água", "gás", "internet", "energia"],
  "Saúde": ["farmácia", "remédio", "médico", "consulta", "exame", "hospital", "dentista"],
  "Lazer": ["cinema", "show", "festa", "bar", "balada", "netflix", "spotify", "jogo", "viagem"],
  "Educação": ["curso", "livro", "escola", "faculdade", "mensalidade"],
  "Compras": ["roupa", "sapato", "eletrônico", "celular", "presente"],
  "Salário": ["salário", "pagamento", "freelance", "bônus"],
  "Investimentos": ["dividendo", "rendimento", "juros", "investimento"],
};

const detectCategory = (text: string): string => {
  const lowerText = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category;
    }
  }
  return "Outros";
};

const parseQuickText = (text: string): ParsedTransaction | null => {
  // Extract amount: looks for numbers with optional decimal
  const amountMatch = text.match(/(?:R\$\s?)?(\d+(?:[.,]\d{1,2})?)/i);
  if (!amountMatch) return null;
  
  const amount = parseFloat(amountMatch[1].replace(",", "."));
  if (isNaN(amount) || amount <= 0) return null;

  // Detect if it's income
  const isIncome = /ganhei|recebi|pix recebido|vendi|salário|rendimento|dividendo/i.test(text);
  
  // Detect date
  const isYesterday = /ontem/i.test(text);
  const date = new Date();
  if (isYesterday) {
    date.setDate(date.getDate() - 1);
  }

  // Clean text to get description
  let description = text
    .replace(amountMatch[0], "")
    .replace(/R\$|reais|pila|conto|hoje|ontem|gastei|ganhei|recebi|paguei|comprei|em|de|no|na|por/gi, "")
    .trim();

  // Capitalize first letter
  if (description) {
    description = description.charAt(0).toUpperCase() + description.slice(1);
  }

  // Detect category
  const category = detectCategory(text);

  return {
    amount,
    description: description || "Transação rápida",
    type: isIncome ? "income" : "expense",
    date,
    category,
  };
};

interface QuickAddInputProps {
  onTransactionAdded?: () => void;
  onFallbackToForm?: (text: string) => void;
}

export const QuickAddInput = ({ onTransactionAdded, onFallbackToForm }: QuickAddInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [parsed, setParsed] = useState<ParsedTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { householdId } = useHouseholdId();

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (value.trim()) {
      const result = parseQuickText(value);
      setParsed(result);
    } else {
      setParsed(null);
      setShowPreview(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (parsed) {
        setShowPreview(true);
      } else {
        // Fallback to form
        if (onFallbackToForm) {
          onFallbackToForm(inputValue);
        } else {
          toast({
            title: "Quase lá!",
            description: "Não consegui entender. Tente algo como: '50 reais pizza'",
            variant: "destructive",
          });
        }
      }
    }
  };

  const handleConfirm = async () => {
    if (!parsed || !user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        household_id: householdId,
        amount: parsed.amount,
        description: parsed.description,
        type: parsed.type,
        category: parsed.category,
        status: "em_aberto",
        date: parsed.date.toISOString().split("T")[0],
      });

      if (error) throw error;

      toast({
        title: "Transação lançada!",
        description: `${parsed.type === "income" ? "+" : "-"}R$ ${parsed.amount.toFixed(2)} em ${parsed.description}`,
      });

      setInputValue("");
      setParsed(null);
      setShowPreview(false);
      onTransactionAdded?.();
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast({
        title: "Erro ao lançar",
        description: "Tente novamente ou use o formulário tradicional.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowPreview(false);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "hoje";
    if (date.toDateString() === yesterday.toDateString()) return "ontem";
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
        <Input
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="O que você gastou agora? (Ex: 50 reais em pizza hoje)"
          className="pl-10 pr-10 h-12 text-base bg-background/50 border-primary/20 focus:border-primary/40 transition-all"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
        )}
      </div>

      {showPreview && parsed && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-card border border-border rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
          <p className="text-sm text-muted-foreground mb-3">Confirmar lançamento:</p>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-lg font-semibold ${parsed.type === "income" ? "text-green-500" : "text-red-500"}`}>
                {parsed.type === "income" ? "+" : "-"}R$ {parsed.amount.toFixed(2)}
              </p>
              <p className="text-sm text-foreground">{parsed.description}</p>
              <p className="text-xs text-muted-foreground">
                {parsed.category} • {formatDate(parsed.date)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={handleConfirm}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span className="ml-1">Confirmar</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {inputValue && !showPreview && parsed && (
        <p className="absolute top-full left-0 mt-1 text-xs text-muted-foreground">
          Pressione Enter para lançar: {parsed.type === "income" ? "+" : "-"}R$ {parsed.amount.toFixed(2)} em "{parsed.description}"
        </p>
      )}
    </div>
  );
};
