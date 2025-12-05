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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, FileText, AlertCircle, Settings2, Eye, EyeOff } from "lucide-react";

interface ImportTransactionsDialogProps {
  onSuccess: () => void;
}

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  status: "em_aberto";
}

interface ColumnMapping {
  date: string;
  description: string;
  amount: string;
  credit: string;
  debit: string;
  category: string;
}

const ImportTransactionsDialog = ({ onSuccess }: ImportTransactionsDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ParsedTransaction[]>([]);
  const [fileName, setFileName] = useState("");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [showMapping, setShowMapping] = useState(false);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    date: "",
    description: "",
    amount: "",
    credit: "",
    debit: "",
    category: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rawContent, setRawContent] = useState<string>("");
  const [showRawPreview, setShowRawPreview] = useState(false);
  const [fileType, setFileType] = useState<"csv" | "ofx" | "">("");

  const parseCSVWithMapping = (headers: string[], data: string[][], mapping: ColumnMapping): ParsedTransaction[] => {
    const transactions: ParsedTransaction[] = [];
    
    const dateIndex = headers.indexOf(mapping.date);
    const descriptionIndex = headers.indexOf(mapping.description);
    const amountIndex = mapping.amount ? headers.indexOf(mapping.amount) : -1;
    const creditIndex = mapping.credit ? headers.indexOf(mapping.credit) : -1;
    const debitIndex = mapping.debit ? headers.indexOf(mapping.debit) : -1;
    const categoryIndex = mapping.category ? headers.indexOf(mapping.category) : -1;

    // Need date, description, and either amount OR credit/debit columns
    const hasAmountColumn = amountIndex !== -1;
    const hasCreditDebitColumns = creditIndex !== -1 || debitIndex !== -1;
    
    if (dateIndex === -1 || descriptionIndex === -1 || (!hasAmountColumn && !hasCreditDebitColumns)) {
      return [];
    }

    for (const row of data) {
      const maxIndex = Math.max(dateIndex, descriptionIndex, amountIndex, creditIndex, debitIndex);
      if (row.length <= maxIndex) continue;
      
      const dateStr = row[dateIndex]?.trim();
      const description = row[descriptionIndex]?.trim();
      const category = categoryIndex >= 0 ? row[categoryIndex]?.trim() : "Importado";
      
      let amount = 0;
      let type: "income" | "expense" = "expense";
      
      if (hasCreditDebitColumns) {
        // Parse credit/debit columns
        const creditStr = creditIndex >= 0 ? row[creditIndex]?.trim() : "";
        const debitStr = debitIndex >= 0 ? row[debitIndex]?.trim() : "";
        
        const creditAmount = parseFloat(creditStr.replace(",", ".").replace(/[^\d.-]/g, "")) || 0;
        const debitAmount = parseFloat(debitStr.replace(",", ".").replace(/[^\d.-]/g, "")) || 0;
        
        if (creditAmount > 0) {
          amount = Math.abs(creditAmount);
          type = "income";
        } else if (debitAmount > 0) {
          amount = Math.abs(debitAmount);
          type = "expense";
        } else if (creditAmount < 0) {
          // Some banks use negative in credit column for debits
          amount = Math.abs(creditAmount);
          type = "expense";
        } else if (debitAmount < 0) {
          amount = Math.abs(debitAmount);
          type = "income";
        }
      } else {
        // Single amount column
        const amountStr = row[amountIndex]?.trim();
        amount = parseFloat(amountStr.replace(",", ".").replace(/[^\d.-]/g, ""));
        type = amount < 0 ? "expense" : "income";
        amount = Math.abs(amount);
      }
      
      if (!isNaN(amount) && amount > 0 && description) {
        transactions.push({
          date: parseDate(dateStr),
          description: description.substring(0, 100),
          amount,
          type,
          category: category || "Importado",
          status: "em_aberto",
        });
      }
    }
    
    return transactions;
  };

  const parseCSVRaw = (content: string): { headers: string[]; data: string[][] } => {
    // Remove BOM if present
    const cleanContent = content.replace(/^\uFEFF/, "").trim();
    // Normalize line endings
    const normalizedContent = cleanContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = normalizedContent.split("\n").filter(line => line.trim());
    
    if (lines.length === 0) return { headers: [], data: [] };
    
    // Detect separator - check for semicolon, tab, or comma
    const firstLine = lines[0];
    let separator = ",";
    if (firstLine.includes(";")) separator = ";";
    else if (firstLine.includes("\t")) separator = "\t";
    
    const headers = firstLine.split(separator).map(h => h.trim().replace(/^["']|["']$/g, ""));
    
    const data: string[][] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(separator).map(p => p.trim().replace(/^["']|["']$/g, ""));
      if (parts.length >= 2) {
        data.push(parts);
      }
    }
    
    return { headers, data };
  };

  const parseOFX = (content: string): ParsedTransaction[] => {
    const transactions: ParsedTransaction[] = [];
    
    // Remove BOM and normalize content
    const cleanContent = content.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    
    // Try XML-style with closing tags first
    let stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
    let match;
    let found = false;
    
    while ((match = stmtTrnRegex.exec(cleanContent)) !== null) {
      found = true;
      const block = match[1];
      const transaction = parseOFXBlock(block);
      if (transaction) transactions.push(transaction);
    }
    
    // If no matches, try SGML-style without closing tags (more common in Brazilian banks)
    if (!found) {
      // Split by STMTTRN tag - handles both <STMTTRN> and <STMTTRN>\n formats
      const blocks = cleanContent.split(/<STMTTRN>/i);
      
      for (let i = 1; i < blocks.length; i++) {
        let block = blocks[i];
        // Find end of this transaction block
        const nextTrnIndex = block.search(/<STMTTRN>/i);
        const endTagIndex = block.search(/<\/(STMTTRN|BANKTRANLIST|STMTRS|OFX)>/i);
        
        let endIndex = -1;
        if (nextTrnIndex > 0 && endTagIndex > 0) {
          endIndex = Math.min(nextTrnIndex, endTagIndex);
        } else if (nextTrnIndex > 0) {
          endIndex = nextTrnIndex;
        } else if (endTagIndex > 0) {
          endIndex = endTagIndex;
        }
        
        if (endIndex > 0) {
          block = block.substring(0, endIndex);
        }
        
        const transaction = parseOFXBlock(block);
        if (transaction) transactions.push(transaction);
      }
    }
    
    return transactions;
  };

  const parseOFXBlock = (block: string): ParsedTransaction | null => {
    const trnType = extractOFXField(block, "TRNTYPE");
    const datePosted = extractOFXField(block, "DTPOSTED");
    const amountStr = extractOFXField(block, "TRNAMT");
    const amount = parseFloat(amountStr.replace(",", "."));
    const memo = extractOFXField(block, "MEMO") || extractOFXField(block, "NAME") || "Transação importada";
    
    if (!isNaN(amount) && amountStr) {
      return {
        date: parseOFXDate(datePosted),
        description: memo.substring(0, 100).trim(),
        amount: Math.abs(amount),
        type: amount < 0 || trnType === "DEBIT" ? "expense" : "income",
        category: "Importado",
        status: "em_aberto",
      };
    }
    return null;
  };

  const extractOFXField = (block: string, field: string): string => {
    // Handle both formats: <FIELD>value and <FIELD>value</FIELD>
    // Also handle values that may span to the next line
    const regexWithClose = new RegExp(`<${field}>([^<]*)</${field}>`, "i");
    const regexNoClose = new RegExp(`<${field}>([^<\\n]+)`, "i");
    
    let match = block.match(regexWithClose);
    if (!match) {
      match = block.match(regexNoClose);
    }
    return match ? match[1].trim() : "";
  };

  const parseDate = (dateStr: string): string => {
    const formats = [
      /(\d{4})-(\d{2})-(\d{2})/,
      /(\d{2})\/(\d{2})\/(\d{4})/,
      /(\d{2})-(\d{2})-(\d{4})/,
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
    setShowMapping(false);
    setPreview([]);
    setCsvHeaders([]);
    setCsvData([]);
    setShowRawPreview(false);
    
    const content = await file.text();
    setRawContent(content.substring(0, 3000)); // Store first 3000 chars for preview
    
    if (file.name.toLowerCase().endsWith(".csv")) {
      setFileType("csv");
      const { headers, data } = parseCSVRaw(content);
      
      if (headers.length === 0 || data.length === 0) {
        toast.error("Arquivo CSV vazio ou inválido.");
        setShowRawPreview(true);
        return;
      }
      
      setCsvHeaders(headers);
      setCsvData(data);
      
      // Try auto-detect common column names
      // Detect credit/debit columns
      const creditCol = headers.find(h => /cr[eé]dito|credit|entrada|deposito/i.test(h)) || "";
      const debitCol = headers.find(h => /d[eé]bito|debit|sa[ií]da|retirada/i.test(h)) || "";
      
      const autoMapping: ColumnMapping = {
        date: headers.find(h => /data|date|dt/i.test(h)) || "",
        description: headers.find(h => /descri|memo|hist|name|titulo/i.test(h)) || "",
        amount: creditCol || debitCol ? "" : (headers.find(h => /valor|amount|value|quantia/i.test(h)) || ""),
        credit: creditCol,
        debit: debitCol,
        category: headers.find(h => /categ|tipo|type/i.test(h)) || "",
      };
      
      setColumnMapping(autoMapping);
      
      // If auto-detection found required fields, show preview
      const hasAmountMapping = autoMapping.amount || autoMapping.credit || autoMapping.debit;
      if (autoMapping.date && autoMapping.description && hasAmountMapping) {
        const parsed = parseCSVWithMapping(headers, data, autoMapping);
        if (parsed.length > 0) {
          setPreview(parsed.slice(0, 10));
          toast.success(`${parsed.length} transações encontradas`);
        } else {
          setShowMapping(true);
          toast.info("Configure o mapeamento de colunas abaixo.");
        }
      } else {
        setShowMapping(true);
        toast.info("Configure o mapeamento de colunas abaixo.");
      }
      
    } else if (file.name.toLowerCase().endsWith(".ofx") || file.name.toLowerCase().endsWith(".qfx")) {
      setFileType("ofx");
      const parsed = parseOFX(content);
      
      if (parsed.length === 0) {
        toast.error("Nenhuma transação encontrada no arquivo.");
        setShowRawPreview(true);
        return;
      }
      
      setPreview(parsed.slice(0, 10));
      toast.success(`${parsed.length} transações encontradas`);
    } else {
      setFileType("");
      toast.error("Formato não suportado. Use CSV ou OFX.");
    }
  };

  const handleApplyMapping = () => {
    const hasAmountMapping = columnMapping.amount || columnMapping.credit || columnMapping.debit;
    if (!columnMapping.date || !columnMapping.description || !hasAmountMapping) {
      toast.error("Mapeie Data, Descrição e Valor (ou Crédito/Débito).");
      return;
    }
    
    const parsed = parseCSVWithMapping(csvHeaders, csvData, columnMapping);
    
    if (parsed.length === 0) {
      toast.error("Nenhuma transação válida encontrada com o mapeamento atual.");
      return;
    }
    
    setPreview(parsed.slice(0, 10));
    setShowMapping(false);
    toast.success(`${parsed.length} transações encontradas`);
  };

  const normalizeDescription = (desc: string) => 
    desc.toLowerCase().trim().replace(/\s+/g, " ");

  const handleImport = async () => {
    if (!user || preview.length === 0) return;

    setLoading(true);
    try {
      const file = fileInputRef.current?.files?.[0];
      if (!file) throw new Error("Arquivo não encontrado");

      const content = await file.text();
      let transactions: ParsedTransaction[];
      
      if (file.name.toLowerCase().endsWith(".csv")) {
        transactions = parseCSVWithMapping(csvHeaders, csvData, columnMapping);
      } else {
        transactions = parseOFX(content);
      }

      // Fetch existing transactions to check for duplicates
      const { data: existingTransactions } = await supabase
        .from("transactions")
        .select("date, description, amount")
        .eq("user_id", user.id);

      // Create a Set of existing transaction signatures for fast lookup
      const existingSignatures = new Set(
        (existingTransactions || []).map(t => 
          `${t.date}|${normalizeDescription(t.description)}|${Number(t.amount).toFixed(2)}`
        )
      );

      // Filter out duplicates
      const uniqueTransactions = transactions.filter(t => {
        const signature = `${t.date}|${normalizeDescription(t.description)}|${t.amount.toFixed(2)}`;
        return !existingSignatures.has(signature);
      });

      const duplicatesCount = transactions.length - uniqueTransactions.length;

      if (uniqueTransactions.length === 0) {
        toast.info("Todas as transações já existem no sistema.");
        setLoading(false);
        return;
      }

      const toInsert = uniqueTransactions.map(t => ({
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

      const successMsg = duplicatesCount > 0
        ? `${uniqueTransactions.length} transações importadas (${duplicatesCount} duplicatas ignoradas)`
        : `${uniqueTransactions.length} transações importadas com sucesso!`;
      
      toast.success(successMsg);
      setOpen(false);
      resetState();
      onSuccess();
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error("Erro ao importar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setPreview([]);
    setFileName("");
    setCsvHeaders([]);
    setCsvData([]);
    setShowMapping(false);
    setRawContent("");
    setShowRawPreview(false);
    setFileType("");
    setColumnMapping({ date: "", description: "", amount: "", credit: "", debit: "", category: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      if (!v) resetState();
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
                  <li>• <strong>CSV:</strong> Com mapeamento manual de colunas</li>
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

          {/* Raw File Preview Section */}
          {rawContent && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm">
                  <Eye className="w-4 h-4" />
                  Estrutura do Arquivo
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRawPreview(!showRawPreview)}
                  className="text-xs gap-1"
                >
                  {showRawPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showRawPreview ? "Ocultar" : "Mostrar"}
                </Button>
              </div>
              
              {showRawPreview && (
                <div className="p-3 rounded-xl border border-border bg-secondary/10 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-medium uppercase">
                      {fileType || "arquivo"}
                    </span>
                    <span>{fileName}</span>
                  </div>
                  
                  {fileType === "csv" && csvHeaders.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Cabeçalhos detectados:</p>
                      <div className="flex flex-wrap gap-1">
                        {csvHeaders.map((header, i) => (
                          <span 
                            key={i} 
                            className="px-2 py-1 text-xs rounded bg-secondary border border-border"
                          >
                            {header}
                          </span>
                        ))}
                      </div>
                      {csvData.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Primeiras {Math.min(3, csvData.length)} linhas de dados:
                          </p>
                          <div className="overflow-x-auto">
                            <table className="text-xs w-full border-collapse">
                              <tbody>
                                {csvData.slice(0, 3).map((row, i) => (
                                  <tr key={i} className="border-b border-border/50">
                                    {row.slice(0, 6).map((cell, j) => (
                                      <td key={j} className="px-2 py-1 text-muted-foreground max-w-[150px] truncate">
                                        {cell || <span className="text-muted-foreground/50">vazio</span>}
                                      </td>
                                    ))}
                                    {row.length > 6 && <td className="px-2 py-1 text-muted-foreground/50">...</td>}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Conteúdo bruto (primeiros 1000 caracteres):</p>
                    <pre className="text-xs p-2 rounded bg-background border border-border overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap break-all font-mono">
                      {rawContent.substring(0, 1000)}
                      {rawContent.length > 1000 && "..."}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Column Mapping Section */}
          {csvHeaders.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  Mapeamento de Colunas
                </Label>
                {!showMapping && preview.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMapping(true)}
                    className="text-xs"
                  >
                    Editar mapeamento
                  </Button>
                )}
              </div>
              
              {showMapping && (
                <div className="p-4 rounded-xl border border-border bg-secondary/10 space-y-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    Colunas encontradas: {csvHeaders.join(", ")}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Data *</Label>
                      <Select
                        value={columnMapping.date}
                        onValueChange={(v) => setColumnMapping(prev => ({ ...prev, date: v }))}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {csvHeaders.map((h) => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs">Descrição *</Label>
                      <Select
                        value={columnMapping.description}
                        onValueChange={(v) => setColumnMapping(prev => ({ ...prev, description: v }))}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {csvHeaders.map((h) => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs">Valor (única coluna)</Label>
                      <Select
                        value={columnMapping.amount}
                        onValueChange={(v) => setColumnMapping(prev => ({ ...prev, amount: v, credit: "", debit: "" }))}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Nenhuma" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Nenhuma</SelectItem>
                          {csvHeaders.map((h) => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs">Categoria (opcional)</Label>
                      <Select
                        value={columnMapping.category}
                        onValueChange={(v) => setColumnMapping(prev => ({ ...prev, category: v }))}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Nenhuma" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Nenhuma</SelectItem>
                          {csvHeaders.map((h) => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">
                      Ou use colunas separadas de Crédito/Débito:
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-primary">Crédito (Entradas)</Label>
                        <Select
                          value={columnMapping.credit}
                          onValueChange={(v) => setColumnMapping(prev => ({ ...prev, credit: v, amount: "" }))}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Nenhuma" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Nenhuma</SelectItem>
                            {csvHeaders.map((h) => (
                              <SelectItem key={h} value={h}>{h}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs text-destructive">Débito (Saídas)</Label>
                        <Select
                          value={columnMapping.debit}
                          onValueChange={(v) => setColumnMapping(prev => ({ ...prev, debit: v, amount: "" }))}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Nenhuma" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Nenhuma</SelectItem>
                            {csvHeaders.map((h) => (
                              <SelectItem key={h} value={h}>{h}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleApplyMapping}
                    size="sm"
                    className="w-full mt-2"
                  >
                    Aplicar Mapeamento
                  </Button>
                </div>
              )}
            </div>
          )}

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
              {loading ? "Importando..." : `Importar ${preview.length > 0 ? preview.length : ""} transações`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportTransactionsDialog;