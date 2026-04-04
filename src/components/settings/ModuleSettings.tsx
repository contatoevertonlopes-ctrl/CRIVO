import { useModulePreferences, ModulePreferences } from "@/hooks/useModulePreferences";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, CreditCard, PieChart, Loader2 } from "lucide-react";

interface ModuleConfig {
  key: keyof ModulePreferences;
  title: string;
  description: string;
  icon: React.ElementType;
}

const moduleConfigs: ModuleConfig[] = [
  {
    key: "bankAccounts",
    title: "Contas Bancárias",
    description: "Gerencie o saldo de múltiplas contas e veja seu patrimônio líquido.",
    icon: Landmark,
  },
  {
    key: "creditCards",
    title: "Cartões de Crédito",
    description: "Controle faturas, limites e veja seu \"Saldo Real\".",
    icon: CreditCard,
  },
  {
    key: "budgets",
    title: "Planejamento Mensal",
    description: "Defina metas de gastos por categoria e orçamentos.",
    icon: PieChart,
  },
];

const ModuleSettings = () => {
  const { modules, isLoading, toggleModule, isUpdating } = useModulePreferences();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-1">Minha Experiência</h3>
        <p className="text-xs text-muted-foreground">
          Personalize seu app ativando apenas os módulos que você usa. 
          Você pode alterar isso a qualquer momento.
        </p>
      </div>

      <div className="grid gap-4">
        {moduleConfigs.map((config) => {
          const Icon = config.icon;
          const isActive = modules[config.key];

          return (
            <Card
              key={config.key}
              className={`transition-all duration-200 ${
                isActive
                  ? "bg-primary/5 border-primary/30"
                  : "bg-card/50 border-border/70 opacity-75"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isActive
                          ? "bg-primary/20 text-primary"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {config.title}
                      </CardTitle>
                    </div>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={(checked) => toggleModule(config.key, checked)}
                    disabled={isUpdating}
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs pl-12">
                  {config.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground mt-4 text-center">
        Desativar um módulo oculta seus elementos da interface, mas seus dados são preservados.
      </p>
    </div>
  );
};

export default ModuleSettings;
