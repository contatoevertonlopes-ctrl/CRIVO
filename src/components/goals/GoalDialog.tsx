import { useState, useEffect } from "react";
import { useAppMode } from "@/contexts/AppModeContext";
import { useAdaptiveModeData } from "@/hooks/useAdaptiveModeData";
import { cn } from "@/lib/utils";
import {
  Target,
  Plane,
  Home,
  Heart,
  Car,
  GraduationCap,
  Briefcase,
  Gift,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Goal } from "@/hooks/useGoals";
import { 
  goalTemplates, 
  GoalTemplate, 
  calculateCarCosts, 
  getCarAffordabilityWarning,
  CarCostSimulation 
} from "@/lib/goalTemplates";

const icons = [
  { id: "target", icon: Target, label: "Meta" },
  { id: "plane", icon: Plane, label: "Viagem" },
  { id: "home", icon: Home, label: "Casa" },
  { id: "heart", icon: Heart, label: "Casamento" },
  { id: "car", icon: Car, label: "Carro" },
  { id: "graduation", icon: GraduationCap, label: "Educação" },
  { id: "briefcase", icon: Briefcase, label: "Negócio" },
  { id: "gift", icon: Gift, label: "Presente" },
  { id: "sparkles", icon: Sparkles, label: "Especial" },
];

const getIconComponent = (iconId: string) => {
  const iconData = icons.find(i => i.id === iconId);
  return iconData?.icon || Target;
};

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
  onSave: (data: {
    title: string;
    icon: string;
    target_amount: number;
    deadline: string | null;
    template_type?: string;
    car_value?: number;
    event_date?: string | null;
  }, templateItems?: { title: string; category: string; estimated_amount: number }[]) => void;
}

const GoalDialog = ({ open, onOpenChange, goal, onSave }: GoalDialogProps) => {
  const { mode } = useAppMode();
  const adaptiveData = useAdaptiveModeData();
  const isSurvival = mode === "survival";
  const isMobile = useIsMobile();
  
  // Step state
  const [step, setStep] = useState<"template" | "details" | "car-simulation">(goal ? "details" : "template");
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  
  // Form state
  const [title, setTitle] = useState(goal?.title || "");
  const [selectedIcon, setSelectedIcon] = useState(goal?.icon || "target");
  const [targetAmount, setTargetAmount] = useState(goal?.target_amount?.toString() || "");
  const [deadline, setDeadline] = useState(goal?.deadline || "");
  const [eventDate, setEventDate] = useState("");
  
  // Car simulation state
  const [carValue, setCarValue] = useState("");
  const [financeMonths, setFinanceMonths] = useState("48");
  const [carSimulation, setCarSimulation] = useState<CarCostSimulation | null>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (goal) {
        setStep("details");
        setTitle(goal.title);
        setSelectedIcon(goal.icon);
        setTargetAmount(goal.target_amount?.toString() || "");
        setDeadline(goal.deadline || "");
      } else {
        setStep("template");
        setSelectedTemplate(null);
        setTitle("");
        setSelectedIcon("target");
        setTargetAmount("");
        setDeadline("");
        setEventDate("");
        setCarValue("");
        setCarSimulation(null);
      }
    }
  }, [open, goal]);

  // Update car simulation when value changes
  useEffect(() => {
    if (carValue) {
      const numericValue = parseFloat(carValue.replace(/[^\d]/g, "")) / 100;
      if (numericValue > 0) {
        const simulation = calculateCarCosts(numericValue, parseInt(financeMonths) || 0);
        setCarSimulation(simulation);
      }
    } else {
      setCarSimulation(null);
    }
  }, [carValue, financeMonths]);

  const handleTemplateSelect = (template: GoalTemplate) => {
    setSelectedTemplate(template);
    setSelectedIcon(template.icon);
    setTitle(template.name);
    
    if (template.id === "car") {
      setStep("car-simulation");
    } else {
      // Calculate total from template items
      const totalAmount = template.items.reduce((sum, item) => sum + item.estimated_amount, 0);
      setTargetAmount(formatCurrencyInput((totalAmount * 100).toString()));
      setStep("details");
    }
  };

  const handleSave = () => {
    if (!title.trim() || !targetAmount) return;
    
    const amount = parseFloat(targetAmount.replace(/[^\d.,]/g, "").replace(",", "."));
    
    onSave({
      title: title.trim(),
      icon: selectedIcon,
      target_amount: amount,
      deadline: deadline || null,
      template_type: selectedTemplate?.id || "custom",
      car_value: carSimulation?.carValue,
      event_date: eventDate || null,
    }, selectedTemplate?.items);
    
    onOpenChange(false);
  };

  const formatCurrencyInput = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, "");
    if (!numericValue) return "";
    
    const number = parseInt(numericValue, 10) / 100;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(number);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Car affordability warning
  const carWarning = carSimulation 
    ? getCarAffordabilityWarning(
        adaptiveData.monthlyIncome || 5000,
        adaptiveData.daysOfOxygen || 30,
        carSimulation.totalMonthly,
        isSurvival
      )
    : null;

  // Template Selection Step
  if (step === "template") {
    const templateGrid = (
      <div className="grid grid-cols-2 gap-3 pt-2">
        {goalTemplates.map((template) => {
          const IconComponent = getIconComponent(template.icon);
          return (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center",
                "bg-secondary/50 border-transparent hover:border-primary/50 hover:bg-secondary"
              )}
            >
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center",
                isSurvival ? "bg-survival-primary/20" : "bg-prosperity-emerald/20")}>
                <IconComponent className={cn("w-6 h-6",
                  isSurvival ? "text-survival-primary" : "text-prosperity-emerald")} />
              </div>
              <span className="font-medium text-sm">{template.name}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{template.description}</span>
            </button>
          );
        })}
      </div>
    );
    if (isMobile) {
      return (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader className="pb-0">
              <DrawerTitle className="text-lg font-semibold">Escolha um modelo</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6 overflow-y-auto">{templateGrid}</div>
          </DrawerContent>
        </Drawer>
      );
    }
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn("max-w-lg border rounded-2xl",
          isSurvival ? "bg-survival-card border-survival-border" : "bg-prosperity-card border-prosperity-border")}>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Escolha um modelo</DialogTitle>
          </DialogHeader>
          {templateGrid}
        </DialogContent>
      </Dialog>
    );
  }

  // Car Simulation Step
  if (step === "car-simulation") {
    const carSimContent = (
      <div className="space-y-4 pt-2">
            {/* Car Value Input */}
            <div>
              <Label className="text-xs text-muted-foreground">
                Valor do Carro
              </Label>
              <Input
                value={carValue}
                onChange={(e) => setCarValue(formatCurrencyInput(e.target.value))}
                placeholder="R$ 100.000,00"
                className="mt-1.5 bg-background border-border/70 text-lg font-semibold"
              />
            </div>

            {/* Finance Options */}
            <div>
              <Label className="text-xs text-muted-foreground">
                Financiamento (meses) - deixe 0 para compra à vista
              </Label>
              <Input
                type="number"
                value={financeMonths}
                onChange={(e) => setFinanceMonths(e.target.value)}
                placeholder="48"
                className="mt-1.5 bg-background border-border/70"
              />
            </div>

            {/* Simulation Results */}
            {carSimulation && (
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-400" />
                  Simulação de Impacto Mensal
                </h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-[10px] text-muted-foreground">IPVA/ano</p>
                    <p className="font-semibold text-sm">{formatCurrency(carSimulation.ipva)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-[10px] text-muted-foreground">Seguro/ano</p>
                    <p className="font-semibold text-sm">{formatCurrency(carSimulation.insurance)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-[10px] text-muted-foreground">Manutenção/mês</p>
                    <p className="font-semibold text-sm">{formatCurrency(carSimulation.maintenanceMonthly)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-[10px] text-muted-foreground">Combustível/mês</p>
                    <p className="font-semibold text-sm">{formatCurrency(carSimulation.fuelMonthly)}</p>
                  </div>
                </div>

                {carSimulation.financingMonthly && (
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-[10px] text-blue-300">Parcela Estimada</p>
                    <p className="font-bold text-lg text-blue-400">
                      {formatCurrency(carSimulation.financingMonthly)}/mês
                    </p>
                  </div>
                )}

                <div className={cn(
                  "p-3 rounded-lg border",
                  isSurvival ? "bg-survival-primary/10 border-survival-primary/30" : "bg-prosperity-emerald/10 border-prosperity-emerald/30"
                )}>
                  <p className="text-[10px] text-muted-foreground">Custo Total Mensal</p>
                  <p className={cn(
                    "font-bold text-xl",
                    isSurvival ? "text-survival-primary" : "text-prosperity-emerald"
                  )}>
                    {formatCurrency(carSimulation.totalMonthly)}
                  </p>
                </div>

                {/* Affordability Warning */}
                {carWarning && (
                  <div className={cn(
                    "p-4 rounded-xl border flex gap-3",
                    carWarning.severity === "danger" && "bg-destructive/10 border-destructive/30",
                    carWarning.severity === "warning" && "bg-warning/10 border-warning/30",
                    carWarning.severity === "success" && "bg-primary/10 border-primary/30"
                  )}>
                    {carWarning.severity === "danger" && <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />}
                    {carWarning.severity === "warning" && <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />}
                    {carWarning.severity === "success" && <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />}
                    <p className="text-sm leading-relaxed">{carWarning.message}</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("template")}
              >
                Voltar
              </Button>
              <Button
                className={cn(
                  "flex-1",
                  isSurvival 
                    ? "bg-survival-primary hover:bg-survival-primary/90" 
                    : "bg-prosperity-emerald hover:bg-prosperity-emerald/90"
                )}
                onClick={() => {
                  if (carSimulation) {
                    setTargetAmount(formatCurrencyInput((carSimulation.carValue * 100).toString()));
                  }
                  setStep("details");
                }}
                disabled={!carSimulation}
              >
                Continuar
              </Button>
            </div>
          </div>
    );
    if (isMobile) {
      return (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="max-h-[92vh]">
            <DrawerHeader className="pb-0">
              <DrawerTitle className="text-lg font-semibold flex items-center gap-2">
                <Car className="w-5 h-5" />
                Simulação de Compra de Carro
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6 overflow-y-auto">{carSimContent}</div>
          </DrawerContent>
        </Drawer>
      );
    }
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn("max-w-md border rounded-2xl",
          isSurvival ? "bg-survival-card border-survival-border" : "bg-prosperity-card border-prosperity-border")}>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Car className="w-5 h-5" />
              Simulação de Compra de Carro
            </DialogTitle>
          </DialogHeader>
          {carSimContent}
        </DialogContent>
      </Dialog>
    );
  }

  // Details Step
  const detailsTitle = goal ? "Editar Objetivo" : selectedTemplate ? `Novo: ${selectedTemplate.name}` : "Novo Objetivo";
  const detailsContent = (
        <div className="space-y-5 pt-2">
          {/* Template info */}
          {selectedTemplate && selectedTemplate.items.length > 0 && (
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/70">
              <p className="text-xs text-muted-foreground mb-1">
                {selectedTemplate.items.length} itens serão criados automaticamente
              </p>
              <p className="text-[10px] text-muted-foreground">
                Você poderá editar cada item individualmente depois
              </p>
            </div>
          )}

          {/* Icon Selection - only for custom or editing */}
          {(!selectedTemplate || selectedTemplate.id === "custom" || goal) && (
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Ícone</Label>
              <div className="grid grid-cols-5 gap-2">
                {icons.map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedIcon(id)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
                      selectedIcon === id
                        ? isSurvival 
                          ? "bg-survival-primary/20 border-2 border-survival-primary" 
                          : "bg-prosperity-emerald/20 border-2 border-prosperity-emerald"
                        : "bg-secondary/50 border-2 border-transparent hover:bg-secondary"
                    )}
                  >
                    <Icon className={cn(
                      "w-5 h-5",
                      selectedIcon === id 
                        ? isSurvival ? "text-survival-primary" : "text-prosperity-emerald"
                        : "text-muted-foreground"
                    )} />
                    <span className="text-[9px] text-muted-foreground">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-xs text-muted-foreground">
              Nome do objetivo
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Casamento 2026"
              className="mt-1.5 bg-background border-border/70"
            />
          </div>

          {/* Target Amount */}
          <div>
            <Label htmlFor="target" className="text-xs text-muted-foreground">
              Valor total
            </Label>
            <Input
              id="target"
              value={targetAmount}
              onChange={(e) => setTargetAmount(formatCurrencyInput(e.target.value))}
              placeholder="R$ 0,00"
              className="mt-1.5 bg-background border-border/70"
            />
          </div>

          {/* Event Date - for wedding/travel */}
          {selectedTemplate?.has_event_date && (
            <div>
              <Label htmlFor="eventDate" className="text-xs text-muted-foreground">
                Data do Evento
              </Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="mt-1.5 bg-background border-border/70"
              />
            </div>
          )}

          {/* Deadline */}
          <div>
            <Label htmlFor="deadline" className="text-xs text-muted-foreground">
              Data limite para pagamentos (opcional)
            </Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-1.5 bg-background border-border/70"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => goal ? onOpenChange(false) : setStep(selectedTemplate?.id === "car" ? "car-simulation" : "template")}
            >
              {goal ? "Cancelar" : "Voltar"}
            </Button>
            <Button
              className={cn("flex-1",
                isSurvival ? "bg-survival-primary hover:bg-survival-primary/90" : "bg-prosperity-emerald hover:bg-prosperity-emerald/90")}
              onClick={handleSave}
              disabled={!title.trim() || !targetAmount}
            >
              {goal ? "Salvar" : "Criar Objetivo"}
            </Button>
          </div>
        </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader className="pb-0">
            <DrawerTitle className="text-lg font-semibold">{detailsTitle}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">{detailsContent}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-md border rounded-2xl",
        isSurvival ? "bg-survival-card border-survival-border" : "bg-prosperity-card border-prosperity-border")}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{detailsTitle}</DialogTitle>
        </DialogHeader>
        {detailsContent}
      </DialogContent>
    </Dialog>
  );
};

export default GoalDialog;
