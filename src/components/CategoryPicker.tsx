import { useMemo, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTransactionCategories } from "@/hooks/useTransactionCategories";
import {
  CATEGORY_ICONS,
  type CategoryIconKey,
  findCategoryByName,
  type TransactionCategory,
} from "@/lib/transactionCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { Check, Plus, Search } from "lucide-react";

const ICON_CHOICES: { key: CategoryIconKey; label: string }[] = [
  { key: "utensils", label: "Alimentação" },
  { key: "receipt", label: "Serviços" },
  { key: "wine", label: "Restaurantes" },
  { key: "car", label: "Carro" },
  { key: "home", label: "Casa" },
  { key: "shoppingBag", label: "Compras" },
  { key: "users", label: "Pessoas" },
  { key: "creditCard", label: "Cartão" },
  { key: "graduationCap", label: "Educação" },
  { key: "percent", label: "Taxas" },
  { key: "shoppingCart", label: "Mercado" },
  { key: "landmark", label: "Investimentos" },
  { key: "pawPrint", label: "Pets" },
  { key: "gift", label: "Presentes" },
  { key: "shirt", label: "Roupas" },
  { key: "heartPulse", label: "Saúde" },
  { key: "briefcase", label: "Trabalho" },
  { key: "truck", label: "Transporte" },
  { key: "dumbbell", label: "Treino" },
  { key: "plane", label: "Viagem" },
  { key: "smartphone", label: "Tecnologia" },
  { key: "sparkles", label: "Outros" },
];

const COLOR_CHOICES = [
  "#22C55E",
  "#60A5FA",
  "#A855F7",
  "#F87171",
  "#FB923C",
  "#EC4899",
  "#FBBF24",
  "#38BDF8",
  "#A3E635",
  "#818CF8",
];

export interface CategoryPickerProps {
  value: string;
  onValueChange: (next: string) => void;
  trigger?: React.ReactElement;
  title?: string;
  className?: string;
}

const CategoryTile = ({
  category,
  selected,
  onSelect,
}: {
  category: TransactionCategory;
  selected: boolean;
  onSelect: () => void;
}) => {
  const Icon = CATEGORY_ICONS[category.icon];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex flex-col items-center gap-1.5 rounded-xl p-2 transition-colors border",
        selected
          ? "border-primary/60 bg-primary/10"
          : "border-border/70 bg-secondary/20 hover:bg-secondary/40",
      )}
    >
      <div
        className="h-10 w-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: category.color }}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="text-[11px] text-center leading-tight line-clamp-2 min-h-[2rem]">
        {category.name}
      </div>
      {selected && (
        <div className="absolute right-2 top-2">
          <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
            <Check className="h-3.5 w-3.5" />
          </div>
        </div>
      )}
    </button>
  );
};

const Content = ({
  value,
  onValueChange,
  onRequestClose,
}: {
  value: string;
  onValueChange: (v: string) => void;
  onRequestClose: () => void;
}) => {
  const { categories, addCategory } = useTransactionCategories();

  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState<CategoryIconKey>("sparkles");
  const [newColor, setNewColor] = useState(COLOR_CHOICES[0]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, query]);

  const selected = useMemo(() => {
    const match = findCategoryByName(categories, value);
    return match?.name ?? value;
  }, [categories, value]);

  return (
    <div className="p-4 pt-2">
      {!creating ? (
        <>
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar uma categoria"
                className="pl-9 h-10"
              />
            </div>
            <Button type="button" variant="outline" className="h-10" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-4 min-[420px]:grid-cols-5 sm:grid-cols-6 gap-2">
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex flex-col items-center gap-1.5 rounded-xl p-2 transition-colors border border-border/70 bg-secondary/20 hover:bg-secondary/40"
            >
              <div className="h-10 w-10 rounded-full flex items-center justify-center bg-secondary">
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-[11px] text-center leading-tight min-h-[2rem]">Criar</div>
            </button>

            {filtered.map((c) => (
              <CategoryTile
                key={c.id}
                category={c}
                selected={selected && c.name.toLowerCase() === selected.toLowerCase()}
                onSelect={() => {
                  onValueChange(c.name);
                  onRequestClose();
                }}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">Nova categoria</div>
            <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
              Voltar
            </Button>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Nome</div>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Farmácia" />
            </div>

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Ícone</div>
              <div className="grid grid-cols-6 gap-2">
                {ICON_CHOICES.map((opt) => {
                  const Icon = CATEGORY_ICONS[opt.key];
                  const active = newIcon === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setNewIcon(opt.key)}
                      className={cn(
                        "h-10 w-10 rounded-xl border flex items-center justify-center",
                        active ? "border-primary bg-primary/10" : "border-border/70 bg-secondary/20",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Cor</div>
              <div className="flex flex-wrap gap-2">
                {COLOR_CHOICES.map((c) => {
                  const active = newColor === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={cn(
                        "h-9 w-9 rounded-full border",
                        active ? "border-primary" : "border-border/70",
                      )}
                      style={{ backgroundColor: c }}
                    />
                  );
                })}
              </div>
            </div>

            <Button
              type="button"
              className="w-full h-11"
              onClick={() => {
                const trimmed = newName.trim();
                if (!trimmed) return;

                addCategory({ name: trimmed, icon: newIcon, color: newColor });
                onValueChange(trimmed);
                onRequestClose();
              }}
            >
              Salvar categoria
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default function CategoryPicker({
  value,
  onValueChange,
  trigger,
  title = "Selecionar uma categoria",
  className,
}: CategoryPickerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const triggerNode = trigger ?? (
    <Button type="button" variant="outline" className={cn("w-full justify-start", className)}>
      {value || "Selecionar"}
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{triggerNode}</DrawerTrigger>
        <DrawerContent className="max-h-[85vh] flex flex-col">
          <DrawerHeader className="pb-2">
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto">
            <Content
              value={value}
              onValueChange={onValueChange}
              onRequestClose={() => setOpen(false)}
            />
          </div>
          <div className="p-4 pt-0 shrink-0">
            <DrawerClose asChild>
              <Button type="button" variant="outline" className="w-full">
                Fechar
              </Button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerNode}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <Content value={value} onValueChange={onValueChange} onRequestClose={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
