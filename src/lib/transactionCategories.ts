import type { LucideIcon } from "lucide-react";
import {
  Car,
  CreditCard,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  PawPrint,
  Percent,
  Plane,
  Plus,
  Receipt,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Truck,
  Utensils,
  Wine,
  Briefcase,
  Users,
  Gift,
} from "lucide-react";

export type CategoryIconKey =
  | "utensils"
  | "receipt"
  | "wine"
  | "car"
  | "home"
  | "shoppingBag"
  | "users"
  | "creditCard"
  | "graduationCap"
  | "sparkles"
  | "percent"
  | "shoppingCart"
  | "landmark"
  | "pawPrint"
  | "gift"
  | "shirt"
  | "heartPulse"
  | "briefcase"
  | "truck"
  | "dumbbell"
  | "plane"
  | "smartphone"
  | "plus";

export const CATEGORY_ICONS: Record<CategoryIconKey, LucideIcon> = {
  utensils: Utensils,
  receipt: Receipt,
  wine: Wine,
  car: Car,
  home: Home,
  shoppingBag: ShoppingBag,
  users: Users,
  creditCard: CreditCard,
  graduationCap: GraduationCap,
  sparkles: Sparkles,
  percent: Percent,
  shoppingCart: ShoppingCart,
  landmark: Landmark,
  pawPrint: PawPrint,
  gift: Gift,
  shirt: Shirt,
  heartPulse: HeartPulse,
  briefcase: Briefcase,
  truck: Truck,
  dumbbell: Dumbbell,
  plane: Plane,
  smartphone: Smartphone,
  plus: Plus,
};

export interface TransactionCategory {
  id: string;
  name: string;
  icon: CategoryIconKey;
  color: string; // tailwind bg class or hex
  isDefault?: boolean;
}

export const DEFAULT_TRANSACTION_CATEGORIES: TransactionCategory[] = [
  { id: "alimentacao", name: "Alimentação", icon: "utensils", color: "#EC4899", isDefault: true },
  { id: "assinaturas", name: "Assinaturas e serviços", icon: "receipt", color: "#A855F7", isDefault: true },
  { id: "bares", name: "Bares e restaurantes", icon: "wine", color: "#818CF8", isDefault: true },
  { id: "carro", name: "Carro", icon: "car", color: "#60A5FA", isDefault: true },
  { id: "casa", name: "Casa", icon: "home", color: "#93C5FD", isDefault: true },
  { id: "compras", name: "Compras", icon: "shoppingBag", color: "#F472B6", isDefault: true },
  { id: "cuidados", name: "Cuidados pessoais", icon: "users", color: "#F87171", isDefault: true },
  { id: "dividas", name: "Dívidas e empréstimos", icon: "creditCard", color: "#FB7185", isDefault: true },
  { id: "educacao", name: "Educação", icon: "graduationCap", color: "#6366F1", isDefault: true },
  { id: "familia", name: "Família e filhos", icon: "users", color: "#A3E635", isDefault: true },
  { id: "impostos", name: "Impostos e taxas", icon: "percent", color: "#FDBA74", isDefault: true },
  { id: "investimentos", name: "Investimentos", icon: "landmark", color: "#F9A8D4", isDefault: true },
  { id: "lazer", name: "Lazer e hobbies", icon: "sparkles", color: "#A3E635", isDefault: true },
  { id: "mercado", name: "Mercado", icon: "shoppingCart", color: "#FB923C", isDefault: true },
  { id: "outros", name: "Outros", icon: "sparkles", color: "#22C55E", isDefault: true },
  { id: "salario", name: "Salário", icon: "briefcase", color: "#22C55E", isDefault: true },
  { id: "pets", name: "Pets", icon: "pawPrint", color: "#FBBF24", isDefault: true },
  { id: "presentes", name: "Presentes e doações", icon: "gift", color: "#60A5FA", isDefault: true },
  { id: "roupas", name: "Roupas", icon: "shirt", color: "#FB7185", isDefault: true },
  { id: "saude", name: "Saúde", icon: "heartPulse", color: "#60A5FA", isDefault: true },
  { id: "trabalho", name: "Trabalho", icon: "briefcase", color: "#3B82F6", isDefault: true },
  { id: "transporte", name: "Transporte", icon: "truck", color: "#38BDF8", isDefault: true },
  { id: "treino", name: "Treino", icon: "dumbbell", color: "#A855F7", isDefault: true },
  { id: "viagem", name: "Viagem", icon: "plane", color: "#F87171", isDefault: true },
  { id: "tecnologia", name: "Tecnologia", icon: "smartphone", color: "#8B5CF6", isDefault: true },
];

export const normalizeCategoryName = (name: string) => name.trim().toLowerCase();

export const findCategoryByName = (categories: TransactionCategory[], name: string) => {
  const normalized = normalizeCategoryName(name);
  return categories.find((c) => normalizeCategoryName(c.name) === normalized);
};
