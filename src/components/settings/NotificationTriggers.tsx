import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { useAppMode } from "@/contexts/AppModeContext";
import { 
  Bell, Plus, Trash2, AlertTriangle, TrendingDown, 
  Calendar, Send, Sparkles 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Trigger {
  id: string;
  type: "category_limit" | "oxygen_days";
  category?: string;
  amount?: number;
  days?: number;
  enabled: boolean;
}

const categories = [
  "Lazer", "Restaurantes", "Tecnologia", "Vestuário", 
  "Viagens", "Presentes", "Cafés & Lanches"
];

const NotificationTriggers = () => {
  const { toast } = useToast();
  const { mode } = useAppMode();
  const { 
    isPushSupported: isSupported, 
    pushPermission: permission, 
    subscribeToPush: requestPermission,
  } = useNotifications();
  
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [sundaySummaryEnabled, setSundaySummaryEnabled] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("notificationTriggers");
    if (saved) {
      setTriggers(JSON.parse(saved));
    }
    
    const sundaySummary = localStorage.getItem("sundaySummaryEnabled");
    if (sundaySummary) {
      setSundaySummaryEnabled(JSON.parse(sundaySummary));
    }
  }, []);

  const saveTriggers = (updated: Trigger[]) => {
    setTriggers(updated);
    localStorage.setItem("notificationTriggers", JSON.stringify(updated));
  };

  const handleSundaySummaryToggle = async (enabled: boolean) => {
    if (enabled && permission !== "granted") {
      setIsRequestingPermission(true);
      const granted = await requestPermission();
      setIsRequestingPermission(false);
      
      if (!granted) {
        return;
      }
    }
    
    setSundaySummaryEnabled(enabled);
    localStorage.setItem("sundaySummaryEnabled", JSON.stringify(enabled));
    
    toast({
      title: enabled ? "Resumo semanal ativado!" : "Resumo semanal desativado",
      description: enabled 
        ? "Você receberá um relatório todo domingo às 20h." 
        : "Você não receberá mais o resumo semanal.",
    });
  };

  const handleTestNotification = () => {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      toast({ title: "Ative as notificações primeiro", variant: "destructive" });
      return;
    }
    const title = mode === "survival"
      ? "📊 Resumo Semanal - Modo Sobrevivência"
      : "🚀 Resumo Semanal - Modo Prosperidade";
    const body = mode === "survival"
      ? "Você resistiu! Esta semana suas reservas aumentaram em 2 dias."
      : "Semana de crescimento! Você aportou R$ 1.250,00 rumo à sua liberdade financeira.";
    try {
      new window.Notification(title, { body, icon: "/pwa-192x192.png", tag: "sunday-summary" });
      toast({ title: "Notificação enviada!", description: "Confira a notificação." });
    } catch {
      toast({ title: "Erro ao enviar notificação", variant: "destructive" });
    }
  };

  const addCategoryTrigger = () => {
    const newTrigger: Trigger = {
      id: Date.now().toString(),
      type: "category_limit",
      category: categories[0],
      amount: 500,
      enabled: true,
    };
    saveTriggers([...triggers, newTrigger]);
    toast({
      title: "Gatilho adicionado",
      description: "Configure o valor limite para receber alertas.",
    });
  };

  const addOxygenTrigger = () => {
    const newTrigger: Trigger = {
      id: Date.now().toString(),
      type: "oxygen_days",
      days: 10,
      enabled: true,
    };
    saveTriggers([...triggers, newTrigger]);
    toast({
      title: "Gatilho adicionado",
      description: "Você será alertado quando o oxigênio financeiro cair.",
    });
  };

  const updateTrigger = (id: string, updates: Partial<Trigger>) => {
    const updated = triggers.map(t => t.id === id ? { ...t, ...updates } : t);
    saveTriggers(updated);
  };

  const removeTrigger = (id: string) => {
    saveTriggers(triggers.filter(t => t.id !== id));
    toast({
      title: "Gatilho removido",
      description: "O alerta foi desativado.",
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <div className="space-y-6">
      {/* Sunday Summary Section */}
      <div className="p-4 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="font-medium">Resumo de Domingo</h3>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Receba um relatório emocional do seu progresso todo domingo às 20h.
            </p>
            
            {mode === "survival" ? (
              <p className="text-xs text-survival-primary/80 italic">
                "Você resistiu! Suas reservas aumentaram em X dias. Estamos chegando lá. Bom descanso!"
              </p>
            ) : (
              <p className="text-xs text-prosperity-primary/80 italic">
                "Semana de crescimento! Você aportou R$ X rumo à sua liberdade financeira. Bom descanso!"
              </p>
            )}
          </div>
          
          <Switch
            checked={sundaySummaryEnabled}
            onCheckedChange={handleSundaySummaryToggle}
            disabled={isRequestingPermission || !isSupported}
          />
        </div>
        
        {sundaySummaryEnabled && permission === "granted" && (
          <div className="mt-4 pt-4 border-t border-primary/20">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestNotification}
              className="text-xs"
            >
              <Send className="w-3 h-3 mr-1" />
              Enviar notificação de teste agora
            </Button>
          </div>
        )}
        
        {!isSupported && (
          <p className="text-xs text-destructive mt-2">
            Seu navegador não suporta notificações push.
          </p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium mb-1 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          Notificações de Gatilho
        </h3>
        <p className="text-xs text-muted-foreground">
          Configure alertas automáticos para manter suas finanças sob controle
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={addCategoryTrigger}
          className="text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Limite por categoria
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={addOxygenTrigger}
          className="text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Alerta de oxigênio
        </Button>
      </div>

      <div className="space-y-3">
        {triggers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum gatilho configurado</p>
            <p className="text-xs">Adicione alertas para monitorar seus gastos</p>
          </div>
        )}

        {triggers.map((trigger) => (
          <div
            key={trigger.id}
            className={`p-4 rounded-lg border transition-all ${
              trigger.enabled 
                ? "bg-card/80 border-border" 
                : "bg-card/30 border-border/30 opacity-60"
            }`}
          >
            {trigger.type === "category_limit" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">Limite de categoria</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={trigger.enabled}
                      onCheckedChange={(enabled) => updateTrigger(trigger.id, { enabled })}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeTrigger(trigger.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label className="text-xs">Categoria</Label>
                    <Select
                      value={trigger.category}
                      onValueChange={(category) => updateTrigger(trigger.id, { category })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Limite mensal</Label>
                    <Input
                      type="number"
                      value={trigger.amount || 0}
                      onChange={(e) => updateTrigger(trigger.id, { amount: Number(e.target.value) })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Me avise quando eu gastar mais de {formatCurrency(trigger.amount || 0)} em {trigger.category}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-survival-primary" />
                    <span className="text-sm font-medium">Alerta de Oxigênio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={trigger.enabled}
                      onCheckedChange={(enabled) => updateTrigger(trigger.id, { enabled })}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeTrigger(trigger.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="max-w-[200px]">
                  <Label className="text-xs">Dias mínimos</Label>
                  <Input
                    type="number"
                    value={trigger.days || 0}
                    onChange={(e) => updateTrigger(trigger.id, { days: Number(e.target.value) })}
                    className="h-9 text-xs"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Me avise quando meu oxigênio financeiro cair para menos de {trigger.days} dias
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationTriggers;
