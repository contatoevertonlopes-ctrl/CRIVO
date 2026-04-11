import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useHouseholdId } from "@/hooks/useHouseholdId";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, CheckCircle2, Loader2, PartyPopper } from "lucide-react";
import FileDropzone from "./import/FileDropzone";
import ColumnMapper, { type ColumnMapping } from "./import/ColumnMapper";
import TransactionPreviewTable, { type ParsedTransaction } from "./import/TransactionPreviewTable";
import { allCategories } from "./import/importUtils";
import {
  parseCSV,
  parseXLSX,
  parseOFX,
  applyMapping,
  autoDetectMapping,
  type RawData,
} from "./import/fileParsers";

interface ImportTransactionsDialogProps {
  onSuccess: () => void;
}

const ImportTransactionsDialog = ({ onSuccess }: ImportTransactionsDialogProps) => {
  const { user } = useAuth();
  const { householdId } = useHouseholdId();
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"csv" | "xlsx" | "ofx" | null>(null);
  const [rawData, setRawData] = useState<RawData | null>(null);
  const [showMapper, setShowMapper] = useState(false);
  const [mapping, setMapping] = useState<ColumnMapping>({
    date: "",
    description: "",
    amount: "",
    credit: "",
    debit: "",
    category: "",
    paidDate: "",
    dueDate: "",
    type: "",
    status: "",
  });
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [existingTransactions, setExistingTransactions] = useState<Set<string>>(new Set());
  const [userCategories, setUserCategories] = useState<string[]>([]);

  // Fetch existing transactions and categories for duplicate detection
  useEffect(() => {
    const fetchExisting = async () => {
      if (!user || !open) return;
      
      // Build query - if user has household, check by household_id, otherwise by user_id
      let query = supabase
        .from("transactions")
        .select("date, amount, description, category");
      
      if (householdId) {
        query = query.eq("household_id", householdId);
      } else {
        query = query.eq("user_id", user.id);
      }
      
      const { data } = await query;
      
      if (data) {
        const keys = new Set(data.map(t => `${t.date}_${t.amount}_${t.description?.toLowerCase().substring(0, 30)}`));
        setExistingTransactions(keys);
        
        // Extract unique categories from user's transactions
        const existingCategories = [...new Set(data.map(t => t.category).filter(Boolean))];
        setUserCategories(existingCategories);
      }
    };
    
    fetchExisting();
  }, [user, householdId, open]);

  const getTransactionKey = (t: { date: string; amount: number; description: string }) => {
    return `${t.date}_${t.amount}_${t.description.trim().toLowerCase().substring(0, 30)}`;
  };

  const checkDuplicates = useCallback((parsed: ParsedTransaction[]): ParsedTransaction[] => {
    const seen = new Set<string>();

    return parsed.map((t) => {
      const key = getTransactionKey(t);
      const isDuplicate = existingTransactions.has(key) || seen.has(key);
      seen.add(key);

      return {
        ...t,
        isDuplicate,
        selected: !isDuplicate, // Pre-deselect duplicates
      };
    });
  }, [existingTransactions]);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);
    setTransactions([]);
    setShowMapper(false);
    
    try {
      const ext = file.name.toLowerCase();
      
      if (ext.endsWith(".ofx") || ext.endsWith(".qfx")) {
        setFileType("ofx");
        const content = await file.text();
        const parsed = parseOFX(content);
        
        if (parsed.length === 0) {
          toast.error("Nenhuma transação encontrada no arquivo OFX.");
          return;
        }
        
        const withDuplicates = checkDuplicates(parsed);
        setTransactions(withDuplicates);
        toast.success(`${parsed.length} transações encontradas!`);
        
      } else if (ext.endsWith(".xlsx") || ext.endsWith(".xls")) {
        setFileType("xlsx");
        const data = await parseXLSX(file);
        
        if (data.headers.length === 0 || data.data.length === 0) {
          toast.error("Arquivo Excel vazio ou inválido.");
          return;
        }
        
        setRawData(data);
        const autoMapping = autoDetectMapping(data.headers);
        setMapping(autoMapping);
        
        // Check if auto-detection worked
        const hasAmountMapping = autoMapping.amount || autoMapping.credit || autoMapping.debit;
        if (autoMapping.date && autoMapping.description && hasAmountMapping) {
          const parsed = applyMapping(data, autoMapping);
          if (parsed.length > 0) {
            const withDuplicates = checkDuplicates(parsed);
            setTransactions(withDuplicates);
            toast.success(`${parsed.length} transações encontradas!`);
          } else {
            setShowMapper(true);
            toast.info("Configure o mapeamento das colunas.");
          }
        } else {
          setShowMapper(true);
          toast.info("Configure o mapeamento das colunas.");
        }
        
      } else if (ext.endsWith(".csv")) {
        setFileType("csv");
        const content = await file.text();
        const data = parseCSV(content);
        
        if (data.headers.length === 0 || data.data.length === 0) {
          toast.error("Arquivo CSV vazio ou inválido.");
          return;
        }
        
        setRawData(data);
        const autoMapping = autoDetectMapping(data.headers);
        setMapping(autoMapping);
        
        const hasAmountMapping = autoMapping.amount || autoMapping.credit || autoMapping.debit;
        if (autoMapping.date && autoMapping.description && hasAmountMapping) {
          const parsed = applyMapping(data, autoMapping);
          if (parsed.length > 0) {
            const withDuplicates = checkDuplicates(parsed);
            setTransactions(withDuplicates);
            toast.success(`${parsed.length} transações encontradas!`);
          } else {
            setShowMapper(true);
            toast.info("Configure o mapeamento das colunas.");
          }
        } else {
          setShowMapper(true);
          toast.info("Configure o mapeamento das colunas.");
        }
      } else {
        toast.error("Formato não suportado. Use CSV, XLSX ou OFX.");
      }
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Erro ao processar arquivo. Verifique o formato.");
    } finally {
      setIsProcessing(false);
    }
  }, [checkDuplicates]);

  const handleApplyMapping = useCallback(() => {
    if (!rawData) return;
    
    const parsed = applyMapping(rawData, mapping);
    if (parsed.length === 0) {
      toast.error("Nenhuma transação válida encontrada com esse mapeamento.");
      return;
    }
    
    const withDuplicates = checkDuplicates(parsed);
    setTransactions(withDuplicates);
    setShowMapper(false);
    toast.success(`${parsed.length} transações encontradas!`);
  }, [rawData, mapping, checkDuplicates]);

  const handleClear = useCallback(() => {
    setFileName(null);
    setFileType(null);
    setRawData(null);
    setTransactions([]);
    setShowMapper(false);
    setMapping({
      date: "",
      description: "",
      amount: "",
      credit: "",
      debit: "",
      category: "",
      paidDate: "",
      type: "",
      status: "",
    });
  }, []);

  const handleTransactionChange = useCallback((id: string, updates: Partial<ParsedTransaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    setTransactions(prev => prev.map(t => ({ ...t, selected })));
  }, []);

  const handleImport = async () => {
    if (!user) return;
    
    const selectedTransactions = transactions.filter(t => t.selected);
    if (selectedTransactions.length === 0) {
      toast.error("Selecione pelo menos uma transação para importar.");
      return;
    }
    
    setIsImporting(true);
    
    try {
      const toInsert = selectedTransactions.map(t => ({
        user_id: user.id,
        household_id: householdId,
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        status: t.status || "em_aberto",
        paid_date: t.paidDate || null,
        due_date: t.dueDate || null,
      }));
      
      const { error } = await supabase
        .from("transactions")
        .insert(toInsert);
      
      if (error) throw error;
      
      toast.success(
        <div className="flex items-center gap-2">
          <PartyPopper className="w-5 h-5 text-yellow-500" />
          <span><strong>{selectedTransactions.length}</strong> transações importadas com sucesso!</span>
        </div>
      );
      
      onSuccess();
      setOpen(false);
      handleClear();
      
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error("Erro ao importar transações: " + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const selectedCount = transactions.filter(t => t.selected).length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) handleClear();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="w-4 h-4" />
          Importar
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importação Inteligente de Extratos
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-2">
          {/* Dropzone */}
          <FileDropzone
            onFileSelect={handleFileSelect}
            fileName={fileName}
            onClear={handleClear}
            isProcessing={isProcessing}
          />
          
          {/* Column Mapper */}
          {showMapper && rawData && (
            <ColumnMapper
              headers={rawData.headers}
              mapping={mapping}
              onMappingChange={setMapping}
              onApply={handleApplyMapping}
            />
          )}
          
          {/* Preview Table */}
          {transactions.length > 0 && (
            <>
              <TransactionPreviewTable
                transactions={transactions}
                onTransactionChange={handleTransactionChange}
                onSelectAll={handleSelectAll}
                categories={[...new Set([...allCategories, ...userCategories])]}
              />
              
              {/* Import Button */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  {selectedCount} transação(ões) será(ão) importada(s)
                </p>
                
                <Button
                  onClick={handleImport}
                  disabled={isImporting || selectedCount === 0}
                  className="gap-2"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmar Importação
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportTransactionsDialog;
