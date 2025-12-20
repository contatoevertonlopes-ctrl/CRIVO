import { useState } from "react";
import { Check, AlertTriangle, Sparkles, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface ParsedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  suggestedCategory?: string;
  isDuplicate?: boolean;
  selected: boolean;
}

interface TransactionPreviewTableProps {
  transactions: ParsedTransaction[];
  onTransactionChange: (id: string, updates: Partial<ParsedTransaction>) => void;
  onSelectAll: (selected: boolean) => void;
  categories: string[];
}

const TransactionPreviewTable = ({
  transactions,
  onTransactionChange,
  onSelectAll,
  categories,
}: TransactionPreviewTableProps) => {
  const allSelected = transactions.every((t) => t.selected);
  const someSelected = transactions.some((t) => t.selected) && !allSelected;
  const duplicateCount = transactions.filter((t) => t.isDuplicate).length;
  const selectedCount = transactions.filter((t) => t.selected).length;

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="space-y-3">
      {/* Header Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) => onSelectAll(!!checked)}
              className="data-[state=checked]:bg-primary"
            />
            <span className="text-xs text-muted-foreground">
              {selectedCount} de {transactions.length} selecionadas
            </span>
          </div>
        </div>
        
        {duplicateCount > 0 && (
          <Badge variant="outline" className="text-amber-500 border-amber-500/50 gap-1">
            <AlertTriangle className="w-3 h-3" />
            {duplicateCount} possível(is) duplicada(s)
          </Badge>
        )}
      </div>

      {/* Table */}
      <ScrollArea className="h-[300px] rounded-lg border border-border/50">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="p-2 text-left w-10"></th>
              <th className="p-2 text-left">Data</th>
              <th className="p-2 text-left">Descrição</th>
              <th className="p-2 text-left">Categoria</th>
              <th className="p-2 text-right">Valor</th>
              <th className="p-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr
                key={t.id}
                className={cn(
                  "border-b border-border/30 transition-colors",
                  t.isDuplicate && "bg-amber-500/5",
                  !t.selected && "opacity-50"
                )}
              >
                <td className="p-2">
                  <Checkbox
                    checked={t.selected}
                    onCheckedChange={(checked) =>
                      onTransactionChange(t.id, { selected: !!checked })
                    }
                    className="data-[state=checked]:bg-primary"
                  />
                </td>
                <td className="p-2 font-mono">{formatDate(t.date)}</td>
                <td className="p-2 max-w-[200px] truncate" title={t.description}>
                  {t.description}
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-1.5">
                    <Select
                      value={t.category}
                      onValueChange={(v) => onTransactionChange(t.id, { category: v })}
                    >
                      <SelectTrigger className="h-7 text-[10px] w-[120px] border-0 bg-muted/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-xs">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {t.suggestedCategory && t.category === t.suggestedCategory && (
                      <Sparkles className="w-3 h-3 text-primary shrink-0" />
                    )}
                  </div>
                </td>
                <td className={cn(
                  "p-2 text-right font-medium font-mono",
                  t.type === "income" ? "text-green-500" : "text-red-400"
                )}>
                  {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                </td>
                <td className="p-2 text-center">
                  {t.isDuplicate ? (
                    <span className="inline-flex items-center gap-1 text-amber-500">
                      <AlertTriangle className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-green-500">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
      
      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-primary" />
          <span>Categoria sugerida automaticamente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          <span>Possível duplicada</span>
        </div>
      </div>
    </div>
  );
};

export default TransactionPreviewTable;
