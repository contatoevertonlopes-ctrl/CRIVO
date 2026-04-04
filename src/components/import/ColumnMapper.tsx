import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ColumnMapping {
  date: string;
  description: string;
  amount: string;
  credit: string;
  debit: string;
  category: string;
  paidDate: string;
  type: string;
  status: string;
}

interface ColumnMapperProps {
  headers: string[];
  mapping: ColumnMapping;
  onMappingChange: (mapping: ColumnMapping) => void;
  onApply: () => void;
}

const ColumnMapper = ({ headers, mapping, onMappingChange, onApply }: ColumnMapperProps) => {
  const updateMapping = (field: keyof ColumnMapping, value: string) => {
    onMappingChange({ ...mapping, [field]: value });
  };

  const hasCreditDebit = mapping.credit || mapping.debit;

  return (
    <div className="space-y-4 p-4 rounded-xl bg-card/50 border border-border/70">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Mapeamento de Colunas</h4>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500">
          Configure manualmente
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Date Column */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Data *</Label>
          <Select value={mapping.date} onValueChange={(v) => updateMapping("date", v)}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Selecione a coluna" />
            </SelectTrigger>
            <SelectContent>
              {headers.map((h) => (
                <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description Column */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Descrição *</Label>
          <Select value={mapping.description} onValueChange={(v) => updateMapping("description", v)}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Selecione a coluna" />
            </SelectTrigger>
            <SelectContent>
              {headers.map((h) => (
                <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount or Credit/Debit */}
        {!hasCreditDebit ? (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Valor *</Label>
            <Select value={mapping.amount} onValueChange={(v) => updateMapping("amount", v)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Selecione a coluna" />
              </SelectTrigger>
              <SelectContent>
                {headers.map((h) => (
                  <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Crédito</Label>
              <Select value={mapping.credit || "__none__"} onValueChange={(v) => updateMapping("credit", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Coluna de crédito" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" className="text-xs text-muted-foreground">Nenhum</SelectItem>
                  {headers.filter(h => h && h.trim()).map((h) => (
                    <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Débito</Label>
              <Select value={mapping.debit || "__none__"} onValueChange={(v) => updateMapping("debit", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Coluna de débito" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" className="text-xs text-muted-foreground">Nenhum</SelectItem>
                  {headers.filter(h => h && h.trim()).map((h) => (
                    <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Category Column */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Categoria (opcional)</Label>
          <Select value={mapping.category || "__none__"} onValueChange={(v) => updateMapping("category", v === "__none__" ? "" : v)}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Auto-categorizar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__" className="text-xs text-muted-foreground">Auto-categorizar</SelectItem>
              {headers.filter(h => h && h.trim()).map((h) => (
                <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Type Column */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tipo (Renda/Despesa)</Label>
          <Select value={mapping.type || "__none__"} onValueChange={(v) => updateMapping("type", v === "__none__" ? "" : v)}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Detectar pelo valor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__" className="text-xs text-muted-foreground">Detectar pelo valor</SelectItem>
              {headers.filter(h => h && h.trim()).map((h) => (
                <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Paid Date Column */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Data Pagamento</Label>
          <Select value={mapping.paidDate || "__none__"} onValueChange={(v) => updateMapping("paidDate", v === "__none__" ? "" : v)}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Não importar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__" className="text-xs text-muted-foreground">Não importar</SelectItem>
              {headers.filter(h => h && h.trim()).map((h) => (
                <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Column */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={mapping.status || "__none__"} onValueChange={(v) => updateMapping("status", v === "__none__" ? "" : v)}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Padrão: Em aberto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__" className="text-xs text-muted-foreground">Padrão: Em aberto</SelectItem>
              {headers.filter(h => h && h.trim()).map((h) => (
                <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={onApply} size="sm" className="gap-2">
          <Wand2 className="w-3.5 h-3.5" />
          Aplicar Mapeamento
        </Button>
        
        {!hasCreditDebit && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => onMappingChange({ ...mapping, amount: "", credit: mapping.credit || headers[0] || "", debit: "" })}
          >
            Usar colunas Crédito/Débito
          </Button>
        )}
        
        {hasCreditDebit && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => onMappingChange({ ...mapping, credit: "", debit: "", amount: headers[0] || "" })}
          >
            Usar coluna única de Valor
          </Button>
        )}
      </div>
    </div>
  );
};

export default ColumnMapper;
