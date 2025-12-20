import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Edit2, Trash2 } from "lucide-react";

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  categories: string[];
  onSuccess: () => void;
}

const BulkEditDialog = ({ 
  open, 
  onOpenChange, 
  selectedIds, 
  categories,
  onSuccess 
}: BulkEditDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [updateCategory, setUpdateCategory] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(false);
  const [updateType, setUpdateType] = useState(false);
  const [updateTag, setUpdateTag] = useState(false);
  
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [tag, setTag] = useState("");

  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0) return;
    
    const updates: Record<string, string> = {};
    if (updateCategory && category) updates.category = category;
    if (updateStatus && status) updates.status = status;
    if (updateType && type) updates.type = type;
    if (updateTag) updates.tag = tag || null as any;
    
    if (Object.keys(updates).length === 0) {
      toast.error("Selecione pelo menos um campo para atualizar");
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("transactions")
        .update(updates)
        .in("id", selectedIds);

      if (error) throw error;
      
      toast.success(`${selectedIds.length} transações atualizadas!`);
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Bulk update error:", error);
      toast.error("Erro ao atualizar transações");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${selectedIds.length} transações? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .in("id", selectedIds);

      if (error) throw error;
      
      toast.success(`${selectedIds.length} transações excluídas!`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error("Erro ao excluir transações");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setUpdateCategory(false);
    setUpdateStatus(false);
    setUpdateType(false);
    setUpdateTag(false);
    setCategory("");
    setStatus("");
    setType("");
    setTag("");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="w-5 h-5" />
            Edição em Massa
          </DialogTitle>
          <DialogDescription>
            {selectedIds.length} transação(ões) selecionada(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Category */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="updateCategory"
              checked={updateCategory}
              onCheckedChange={(checked) => setUpdateCategory(!!checked)}
            />
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="updateCategory" className="text-sm cursor-pointer">
                Categoria
              </Label>
              {updateCategory && (
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="updateStatus"
              checked={updateStatus}
              onCheckedChange={(checked) => setUpdateStatus(!!checked)}
            />
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="updateStatus" className="text-sm cursor-pointer">
                Status
              </Label>
              {updateStatus && (
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="em_aberto">Em aberto</SelectItem>
                    <SelectItem value="a_vencer">A vencer</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                    <SelectItem value="pagamento_concluido">Pagamento concluído</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Type */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="updateType"
              checked={updateType}
              onCheckedChange={(checked) => setUpdateType(!!checked)}
            />
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="updateType" className="text-sm cursor-pointer">
                Tipo
              </Label>
              {updateType && (
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Entrada</SelectItem>
                    <SelectItem value="expense">Saída</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Tag */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="updateTag"
              checked={updateTag}
              onCheckedChange={(checked) => setUpdateTag(!!checked)}
            />
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="updateTag" className="text-sm cursor-pointer">
                Tag
              </Label>
              {updateTag && (
                <Select value={tag || "__none__"} onValueChange={(v) => setTag(v === "__none__" ? "" : v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhuma</SelectItem>
                    <SelectItem value="fixa">Fixa</SelectItem>
                    <SelectItem value="variavel">Variável</SelectItem>
                    <SelectItem value="esporadica">Esporádica</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={isProcessing}
            className="gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            Excluir Selecionadas
          </Button>
          
          <Button
            onClick={handleBulkUpdate}
            disabled={isProcessing || (!updateCategory && !updateStatus && !updateType && !updateTag)}
            className="gap-1.5"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Edit2 className="w-4 h-4" />
            )}
            Aplicar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEditDialog;
