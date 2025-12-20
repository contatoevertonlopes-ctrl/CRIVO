import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Download, Trash2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DataManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    
    setExporting(true);
    try {
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;

      if (!transactions || transactions.length === 0) {
        toast({
          title: "Sem dados",
          description: "Você não possui transações para exportar.",
        });
        return;
      }

      // Create CSV
      const headers = [
        "Data", "Descrição", "Valor", "Tipo", "Categoria", 
        "Status", "Recorrente", "Data Pagamento"
      ];
      
      const rows = transactions.map(t => [
        t.date,
        t.description,
        t.amount,
        t.type === "income" ? "Receita" : "Despesa",
        t.category,
        t.status,
        t.is_recurring ? "Sim" : "Não",
        t.paid_date || ""
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      // Download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `transacoes_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Exportação concluída",
        description: `${transactions.length} transações exportadas com sucesso.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao exportar",
        description: error.message,
      });
    } finally {
      setExporting(false);
    }
  };

  const handleClearData = async () => {
    if (!user) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      // Clear local storage settings
      localStorage.removeItem("financialGoals");
      localStorage.removeItem("categoryConfig");
      localStorage.removeItem("notificationTriggers");

      toast({
        title: "Dados limpos",
        description: "Todas as suas transações e configurações foram removidas.",
      });

      // Reload page to reset state
      window.location.reload();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao limpar",
        description: error.message,
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-1">Segurança e Dados</h3>
        <p className="text-xs text-muted-foreground">
          Exporte ou limpe seus dados financeiros
        </p>
      </div>

      <div className="space-y-4">
        {/* Export Section */}
        <div className="p-4 rounded-lg bg-card/50 border border-border/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium mb-1">Exportar dados</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Baixe todas as suas transações em formato CSV para backup ou análise externa.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={exporting}
              >
                <Download className="w-4 h-4 mr-2" />
                {exporting ? "Exportando..." : "Exportar CSV"}
              </Button>
            </div>
          </div>
        </div>

        {/* Clear Data Section */}
        <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium mb-1 text-destructive">Limpar todos os dados</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Remove permanentemente todas as transações e configurações. Esta ação não pode ser desfeita.
              </p>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar dados
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      Tem certeza absoluta?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação irá remover permanentemente todas as suas transações, 
                      metas e configurações. Você não poderá recuperar esses dados.
                      <br /><br />
                      <strong>Recomendamos exportar seus dados antes de continuar.</strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearData}
                      disabled={deleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleting ? "Limpando..." : "Sim, limpar tudo"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;
