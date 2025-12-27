import { useState, useEffect } from "react";
import { BankAccount, BANK_PRESETS } from "@/hooks/useBankAccounts";
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
import { Landmark, Loader2 } from "lucide-react";

interface BankAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: BankAccount | null;
  onSave: (data: {
    name: string;
    bank_name: string;
    account_type: "checking" | "savings";
    balance: number;
    color: string;
    icon: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export const BankAccountDialog = ({
  open,
  onOpenChange,
  account,
  onSave,
  isLoading,
}: BankAccountDialogProps) => {
  const [name, setName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountType, setAccountType] = useState<"checking" | "savings">("checking");
  const [balance, setBalance] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [icon, setIcon] = useState("landmark");

  useEffect(() => {
    if (account) {
      setName(account.name);
      setBankName(account.bank_name);
      setAccountType(account.account_type);
      setBalance(String(account.balance));
      setColor(account.color);
      setIcon(account.icon);
    } else {
      setName("");
      setBankName("");
      setAccountType("checking");
      setBalance("");
      setColor("#6366f1");
      setIcon("landmark");
    }
  }, [account, open]);

  const handleBankSelect = (bank: string) => {
    setBankName(bank);
    const preset = BANK_PRESETS[bank];
    if (preset) {
      setColor(preset.color);
      setIcon(preset.icon);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await onSave({
      name,
      bank_name: bankName,
      account_type: accountType,
      balance: parseFloat(balance) || 0,
      color,
      icon,
    });
    
    onOpenChange(false);
  };

  const bankOptions = Object.keys(BANK_PRESETS);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary" />
            {account ? "Editar Conta" : "Nova Conta Bancária"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="bank">Banco</Label>
            <Select value={bankName} onValueChange={handleBankSelect}>
              <SelectTrigger className="bg-secondary/50 border-border/50">
                <SelectValue placeholder="Selecione o banco" />
              </SelectTrigger>
              <SelectContent>
                {bankOptions.map((bank) => (
                  <SelectItem key={bank} value={bank}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: BANK_PRESETS[bank].color }}
                      />
                      {bank}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Apelido da Conta</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Conta Principal, Reserva..."
              required
              className="bg-secondary/50 border-border/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Conta</Label>
              <Select value={accountType} onValueChange={(v) => setAccountType(v as "checking" | "savings")}>
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Corrente</SelectItem>
                  <SelectItem value="savings">Poupança</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="balance">Saldo Inicial (R$)</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0,00"
                className="bg-secondary/50 border-border/50"
              />
            </div>
          </div>

          {/* Color preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${color}20` }}
            >
              <Landmark className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <p className="text-sm font-medium">{bankName || "Banco"}</p>
              <p className="text-xs text-muted-foreground">{name || "Apelido da conta"}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !bankName || !name}
              className="flex-1 bg-gradient-to-r from-primary to-green-600 text-primary-foreground"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                account ? "Atualizar" : "Adicionar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
