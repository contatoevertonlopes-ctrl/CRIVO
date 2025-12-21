import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/hooks/useCards";

interface CardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card?: Card | null;
  onSave: (data: Omit<Card, "id" | "user_id" | "household_id" | "created_at" | "updated_at">) => void;
}

const cardColors = [
  { name: "Roxo (Nubank)", value: "#8B5CF6" },
  { name: "Laranja (Inter)", value: "#F97316" },
  { name: "Azul (Itaú)", value: "#3B82F6" },
  { name: "Vermelho (Santander)", value: "#EF4444" },
  { name: "Verde (Sicredi)", value: "#22C55E" },
  { name: "Preto (Black)", value: "#1F2937" },
  { name: "Dourado (Gold)", value: "#D97706" },
  { name: "Prata (Platinum)", value: "#6B7280" },
];

const cardBrands = [
  { name: "Visa", value: "visa" },
  { name: "Mastercard", value: "mastercard" },
  { name: "Elo", value: "elo" },
  { name: "American Express", value: "amex" },
  { name: "Outro", value: "generic" },
];

const CardDialog = ({ open, onOpenChange, card, onSave }: CardDialogProps) => {
  const [name, setName] = useState("");
  const [lastFourDigits, setLastFourDigits] = useState("");
  const [brand, setBrand] = useState("generic");
  const [color, setColor] = useState("#8B5CF6");
  const [creditLimit, setCreditLimit] = useState("");
  const [closingDay, setClosingDay] = useState("10");
  const [dueDay, setDueDay] = useState("17");

  useEffect(() => {
    if (card) {
      setName(card.name);
      setLastFourDigits(card.last_four_digits || "");
      setBrand(card.brand);
      setColor(card.color);
      setCreditLimit(String(card.credit_limit));
      setClosingDay(String(card.closing_day));
      setDueDay(String(card.due_day));
    } else {
      setName("");
      setLastFourDigits("");
      setBrand("generic");
      setColor("#8B5CF6");
      setCreditLimit("");
      setClosingDay("10");
      setDueDay("17");
    }
  }, [card, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      name,
      last_four_digits: lastFourDigits || null,
      brand,
      color,
      credit_limit: parseFloat(creditLimit) || 0,
      closing_day: parseInt(closingDay),
      due_day: parseInt(dueDay),
      is_active: true,
    });

    onOpenChange(false);
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {card ? "Editar Cartão" : "Novo Cartão de Crédito"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Cartão</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Nubank, Itaú Platinum..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lastFour">Últimos 4 dígitos</Label>
              <Input
                id="lastFour"
                value={lastFourDigits}
                onChange={(e) => setLastFourDigits(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="0000"
                maxLength={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Bandeira</Label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cardBrands.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor do Cartão</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cardColors.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: c.value }}
                      />
                      {c.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="limit">Limite de Crédito</Label>
            <Input
              id="limit"
              type="number"
              step="0.01"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              placeholder="0,00"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dia do Fechamento</Label>
              <Select value={closingDay} onValueChange={setClosingDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {days.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      Dia {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dia do Vencimento</Label>
              <Select value={dueDay} onValueChange={setDueDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {days.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      Dia {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {card ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CardDialog;
