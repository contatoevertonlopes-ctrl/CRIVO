import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, FileText, AlertCircle } from "lucide-react";

interface ImportTransactionsDialogProps {
  onSuccess: () => void;
}

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  status: "pending";
}

const ImportTransactionsDialog = ({ onSuccess }: ImportTransactionsDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ParsedTransaction[]>([]);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (content: string): ParsedTransaction[] => {
    const lines = content.trim().split("\n");
    const transactions: ParsedTransaction[] = [];
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Handle both comma and semicolon separators
      const separator = line.includes(";") ? ";" : ",";
      const parts = line.split(separator).map(p => p.trim().replace(/"/g, ""));
      
      if (parts.length >= 3) {
        const [dateStr, description, amountStr, category = "Importado"] = parts;
        const amount = parseFloat(amountStr.replace(",", ".").replace(/[^\d.-]/g, ""));
        
        if (!isNaN(amount) && description) {
          transactions.push({
            date: parseDate(dateStr),
            description: description.substring(0, 100),
            amount: Math.abs(amount),
            type: amount < 0 ? "expense" : "income",
            category: category || "Importado",
            status: "pending",
          });
        }
      }
    }
    
    return transactions;
  };

  const parseOFX = (content: string): ParsedTransaction[] => {
    const transactions: ParsedTransaction[] = [];
    
    // Simple OFX parser
    const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
    let match;
    
    while ((match = stmtTrnRegex.exec(content)) !== null) {
      const block = match[1];
      
      const trnType = extractOFXField(block, "TRNTYPE");
      const datePosted = extractOFXField(block, "DTPOSTED");
      const amount = parseFloat(extractOFXField(block, "TRNAMT").replace(",", "."));
      const memo = extractOFXField(block, "MEMO") || extractOFXField(block, "NAME") || "Transação importada";
      
      if (!isNaN(amount)) {
        transactions.push({
          date: parseOFXDate(datePosted),
          description: memo.substring(0, 100),
          amount: Math.abs(amount),
          type: amount < 0 || trnType === "DEBIT" ? "expense" : "income",
          category: "Importado",
          status: "pending",
        });
      }
    }
    
    return transactions;
  };

  const extractOFXField = (block: string, field: string): string => {
    const regex = new RegExp(`<${field}>([^<\\r\\n]+)`, "i");
    const match = block.match(regex);
    return match ? match[1].trim() : "";
  };

  const parseDate = (dateStr: string): string => {
    // Handle common date formats
    const formats = [
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
      /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
    ];
    
    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[0]) {
          return `${match[1]}-${match[2]}-${match[3]}`;
        } else {
          return `${match[3]}-${match[2]}-${match[1]}`;
        }
      }
    }
    
    return new Date().toISOString().split("T")[0];
  };

  const parseOFXDate = (dateStr: string): string => {
    // OFX date format: YYYYMMDD or YYYYMMDDHHMMSS
    if (dateStr.length >= 8) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    return new Date().toISOString().split("T")[0];
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const content = await file.text();
    
    let parsed: ParsedTransaction[] = [];
    
    if (file.name.toLowerCase().endsWith(".csv")) {
      parsed = parseCSV(content);
    } else if (file.name.toLowerCase().endsWith(".ofx") || file.name.toLowerCase().endsWith(".qfx")) {
      parsed = parseOFX(content);
    } else {
      toast.error("Formato não suportado. Use CSV ou OFX.");
      return;
    }

    if (parsed.length === 0) {
      toast.error("Nenhuma transação encontrada no arquivo.");
      return;
    }

    setPreview(parsed.slice(0, 10));
    toast.success(`${parsed.length} transações encontradas`);
  };

  const handleImport = async () => {
    if (!user || preview.length === 0) return;

    setLoading(true);
    try {
      const file = fileInputRef.current?.files?.[0];
      if (!file) throw new Error("Arquivo não encontrado");

      const content = await file.text();
      let transactions: ParsedTransaction[];
      
      if (file.name.toLowerCase().endsWith(".csv")) {
        transactions = parseCSV(content);
      } else {
        transactions = parseOFX(content);
      }

      const toInsert = transactions.map(t => ({
        user_id: user.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        status: t.status,
      }));

      const { error } = await supabase.from("transactions").insert(toInsert);

      if (error) throw error;

      toast.success(`${transactions.length} transações importadas com sucesso!`);
      setOpen(false);
      setPreview([]);
      setFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      onSuccess();
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error("Erro ao importar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v);
      if (!v) {
        setPreview([]);
        setFileName("");
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="w-4 h-4" />
          Importar
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background border-secondary max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Extrato Bancário</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="p-4 rounded-xl border border-border bg-secondary/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Formatos suportados:</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• <strong>CSV:</strong> Colunas: Data, Descrição, Valor, Categoria (opcional)</li>
                  <li>• <strong>OFX/QFX:</strong> Formato padrão de extratos bancários</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Selecione o arquivo</Label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.ofx,.qfx"
                onChange={handleFileChange}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-secondary/20 transition-colors"
              >
                <FileText className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {fileName || "Clique para selecionar arquivo CSV ou OFX"}
                </span>
              </label>
            </div>
          </div>

          {preview.length > 0 && (
            <div className="space-y-2">
              <Label>Prévia das transações (primeiras {preview.length})</Label>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="text-left p-2">Data</th>
                      <th className="text-left p-2">Descrição</th>
                      <th className="text-right p-2">Valor</th>
                      <th className="text-center p-2">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((t, i) => (
                      <tr key={i} className="border-t border-border/50">
                        <td className="p-2 text-muted-foreground">{t.date}</td>
                        <td className="p-2 truncate max-w-[200px]">{t.description}</td>
                        <td className={`p-2 text-right ${t.type === "income" ? "text-primary" : "text-destructive"}`}>
                          {t.type === "expense" ? "-" : "+"}{formatCurrency(t.amount)}
                        </td>
                        <td className="p-2 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            t.type === "income" 
                              ? "bg-primary/20 text-primary" 
                              : "bg-destructive/20 text-destructive"
                          }`}>
                            {t.type === "income" ? "Entrada" : "Saída"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={loading || preview.length === 0}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {loading ? "Importando..." : `Importar ${preview.length} transações`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportTransactionsDialog;
