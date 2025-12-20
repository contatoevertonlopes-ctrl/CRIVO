import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Home, ShoppingCart, Car, Heart, Briefcase, 
  Utensils, Gamepad2, Gift, GraduationCap, Smartphone,
  Plane, Shirt, Coffee, Dumbbell, Sparkles
} from "lucide-react";

const defaultCategories = [
  { id: "moradia", name: "Moradia", icon: Home, essential: true },
  { id: "alimentacao", name: "Alimentação", icon: ShoppingCart, essential: true },
  { id: "transporte", name: "Transporte", icon: Car, essential: true },
  { id: "saude", name: "Saúde", icon: Heart, essential: true },
  { id: "trabalho", name: "Trabalho", icon: Briefcase, essential: true },
  { id: "restaurantes", name: "Restaurantes", icon: Utensils, essential: false },
  { id: "lazer", name: "Lazer", icon: Gamepad2, essential: false },
  { id: "presentes", name: "Presentes", icon: Gift, essential: false },
  { id: "educacao", name: "Educação", icon: GraduationCap, essential: true },
  { id: "tecnologia", name: "Tecnologia", icon: Smartphone, essential: false },
  { id: "viagens", name: "Viagens", icon: Plane, essential: false },
  { id: "vestuario", name: "Vestuário", icon: Shirt, essential: false },
  { id: "cafe", name: "Cafés & Lanches", icon: Coffee, essential: false },
  { id: "academia", name: "Academia", icon: Dumbbell, essential: false },
  { id: "beleza", name: "Beleza & Cuidados", icon: Sparkles, essential: false },
];

export interface CategoryConfig {
  id: string;
  name: string;
  essential: boolean;
}

const CategoryManager = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryConfig[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("categoryConfig");
    if (saved) {
      setCategories(JSON.parse(saved));
    } else {
      setCategories(defaultCategories.map(c => ({ id: c.id, name: c.name, essential: c.essential })));
    }
  }, []);

  const toggleCategory = (id: string) => {
    const updated = categories.map(c => 
      c.id === id ? { ...c, essential: !c.essential } : c
    );
    setCategories(updated);
    localStorage.setItem("categoryConfig", JSON.stringify(updated));
    
    const category = updated.find(c => c.id === id);
    toast({
      title: category?.essential ? "Marcado como essencial" : "Marcado como não essencial",
      description: `${category?.name} agora ${category?.essential ? "será considerado" : "não será considerado"} no cálculo de Dias de Oxigênio.`,
    });
  };

  const getCategoryIcon = (id: string) => {
    const found = defaultCategories.find(c => c.id === id);
    return found?.icon || Sparkles;
  };

  const essentialCount = categories.filter(c => c.essential).length;
  const nonEssentialCount = categories.filter(c => !c.essential).length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-1">Gestão de Categorias</h3>
        <p className="text-xs text-muted-foreground">
          Defina quais categorias são essenciais para o cálculo do seu "Dias de Oxigênio"
        </p>
      </div>

      <div className="flex gap-4 text-xs">
        <span className="px-3 py-1 rounded-full bg-survival-primary/20 text-survival-primary">
          {essentialCount} essenciais
        </span>
        <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">
          {nonEssentialCount} não essenciais
        </span>
      </div>

      <div className="grid gap-2">
        {categories.map((category) => {
          const Icon = getCategoryIcon(category.id);
          return (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 hover:bg-card/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  category.essential 
                    ? "bg-survival-primary/20 text-survival-primary" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <Label htmlFor={category.id} className="text-sm font-medium cursor-pointer">
                    {category.name}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {category.essential ? "Essencial" : "Não essencial"}
                  </p>
                </div>
              </div>
              <Switch
                id={category.id}
                checked={category.essential}
                onCheckedChange={() => toggleCategory(category.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryManager;
