import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Target, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

interface GoalItem {
  id: string;
  title: string;
  estimated_amount: number;
  goal_id: string;
  goal_title: string;
  is_paid: boolean;
}

interface GoalItemLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionAmount: number;
  transactionDescription: string;
  onLink: (goalItemId: string) => void;
}

const GoalItemLinkDialog = ({
  open,
  onOpenChange,
  transactionAmount,
  transactionDescription,
  onLink,
}: GoalItemLinkDialogProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [unpaidItems, setUnpaidItems] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUnpaidItems = async () => {
      if (!user || !open) return;
      setLoading(true);
      try {
        type GoalRow = {
          id: string;
          title: string;
          goal_items: Array<{ id: string; title: string; estimated_amount: number; is_paid: boolean }>;
        };
        const { data: goals } = await supabase
          .from("goals")
          .select(`id, title, goal_items!goal_items_goal_id_fkey (id, title, estimated_amount, is_paid)`)
          .eq("status", "active");
        const typedGoals = (goals ?? []) as GoalRow[];
        if (typedGoals.length > 0) {
          const items: GoalItem[] = [];
          for (const goal of typedGoals) {
            for (const item of goal.goal_items || []) {
              if (!item.is_paid) {
                items.push({ id: item.id, title: item.title, estimated_amount: item.estimated_amount, goal_id: goal.id, goal_title: goal.title, is_paid: item.is_paid });
              }
            }
          }
          setUnpaidItems(items);
        }
      } catch (error) {
        console.error("Error fetching unpaid items:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUnpaidItems();
  }, [user, open]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const matchingItems = unpaidItems.filter(item => Math.abs(item.estimated_amount - transactionAmount) <= item.estimated_amount * 0.1);
  const otherItems = unpaidItems.filter(item => Math.abs(item.estimated_amount - transactionAmount) > item.estimated_amount * 0.1);

  if (unpaidItems.length === 0 && !loading) return null;

  const description = (
    <>Este gasto de <span className="font-semibold text-foreground">{formatCurrency(transactionAmount)}</span> é referente a algum item do seu checklist de objetivos?</>
  );

  const listContent = (
    <ScrollArea className="max-h-64">
      <div className="space-y-2 pr-2">
        {loading ? (
          <div className="text-center py-4 text-muted-foreground text-sm">Carregando itens...</div>
        ) : (
          <>
            {matchingItems.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Valores similares:</p>
                {matchingItems.map((item) => (
                  <button key={item.id} onClick={() => onLink(item.id)}
                    className="w-full p-3 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left">
                    <div className="flex items-center justify-between">
                      <div><p className="font-medium text-sm">{item.title}</p><p className="text-xs text-muted-foreground">{item.goal_title}</p></div>
                      <span className="text-sm font-semibold text-primary">{formatCurrency(item.estimated_amount)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {otherItems.length > 0 && (
              <div className="space-y-2 mt-3">
                <p className="text-xs text-muted-foreground font-medium">Outros itens pendentes:</p>
                {otherItems.slice(0, 5).map((item) => (
                  <button key={item.id} onClick={() => onLink(item.id)}
                    className="w-full p-3 rounded-lg border border-border hover:border-primary/50 transition-colors text-left">
                    <div className="flex items-center justify-between">
                      <div><p className="font-medium text-sm">{item.title}</p><p className="text-xs text-muted-foreground">{item.goal_title}</p></div>
                      <span className="text-sm text-muted-foreground">{formatCurrency(item.estimated_amount)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </ScrollArea>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Vincular a um Objetivo?
            </DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 overflow-y-auto">{listContent}</div>
          <DrawerFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="gap-2 w-full">
              <X className="w-4 h-4" />
              Não vincular
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Vincular a um Objetivo?
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {listContent}
        <DialogFooter className="flex-row gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 gap-2">
            <X className="w-4 h-4" />
            Não vincular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GoalItemLinkDialog;
