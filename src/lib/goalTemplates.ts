// Goal Blueprint Templates

export interface TemplateItem {
  title: string;
  category: string;
  estimated_amount: number;
  months_before_event?: number; // For wedding: months before event date
}

export interface GoalTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  items: TemplateItem[];
  has_event_date: boolean;
  has_car_value: boolean;
}

// Wedding Template Items
const weddingItems: TemplateItem[] = [
  { title: "Local da Cerimônia", category: "cerimonia", estimated_amount: 8000, months_before_event: 12 },
  { title: "Local da Festa/Buffet", category: "buffet", estimated_amount: 25000, months_before_event: 12 },
  { title: "Decoração", category: "decoracao", estimated_amount: 8000, months_before_event: 6 },
  { title: "Fotógrafo", category: "foto", estimated_amount: 5000, months_before_event: 10 },
  { title: "Filmagem", category: "video", estimated_amount: 4000, months_before_event: 10 },
  { title: "DJ/Banda", category: "musica", estimated_amount: 3500, months_before_event: 8 },
  { title: "Vestido da Noiva", category: "vestuario", estimated_amount: 6000, months_before_event: 8 },
  { title: "Traje do Noivo", category: "vestuario", estimated_amount: 2000, months_before_event: 4 },
  { title: "Alianças", category: "joias", estimated_amount: 3000, months_before_event: 6 },
  { title: "Convites", category: "papelaria", estimated_amount: 1500, months_before_event: 6 },
  { title: "Lembrancinhas", category: "brindes", estimated_amount: 1000, months_before_event: 3 },
  { title: "Bolo", category: "buffet", estimated_amount: 1500, months_before_event: 3 },
  { title: "Doces e Bem-casados", category: "buffet", estimated_amount: 2500, months_before_event: 3 },
  { title: "Flores e Buquê", category: "decoracao", estimated_amount: 2000, months_before_event: 2 },
  { title: "Cabelo e Maquiagem", category: "beleza", estimated_amount: 1500, months_before_event: 1 },
];

// Travel Template Items
const travelItems: TemplateItem[] = [
  { title: "Passagens Aéreas", category: "transporte", estimated_amount: 5000 },
  { title: "Hospedagem", category: "hospedagem", estimated_amount: 6000 },
  { title: "Seguro Viagem", category: "seguro", estimated_amount: 500 },
  { title: "Passeios e Atrações", category: "lazer", estimated_amount: 3000 },
  { title: "Alimentação", category: "alimentacao", estimated_amount: 2500 },
  { title: "Transporte Local", category: "transporte", estimated_amount: 1000 },
  { title: "Compras/Souvenirs", category: "compras", estimated_amount: 2000 },
  { title: "Visto (se necessário)", category: "documentos", estimated_amount: 800 },
];

export const goalTemplates: GoalTemplate[] = [
  {
    id: "wedding",
    name: "Casamento",
    icon: "heart",
    description: "Checklist completo para organizar seu casamento",
    items: weddingItems,
    has_event_date: true,
    has_car_value: false,
  },
  {
    id: "car",
    name: "Comprar Carro",
    icon: "car",
    description: "Simulação de custos e impacto no orçamento",
    items: [],
    has_event_date: false,
    has_car_value: true,
  },
  {
    id: "travel",
    name: "Viagem Internacional",
    icon: "plane",
    description: "Planeje todos os custos da sua viagem",
    items: travelItems,
    has_event_date: true,
    has_car_value: false,
  },
  {
    id: "custom",
    name: "Personalizado",
    icon: "target",
    description: "Crie seu objetivo do zero",
    items: [],
    has_event_date: false,
    has_car_value: false,
  },
];

// Car cost calculation utilities
export interface CarCostSimulation {
  carValue: number;
  ipva: number; // 4% annual
  insurance: number; // ~5% annual
  maintenanceMonthly: number;
  fuelMonthly: number;
  totalMonthly: number;
  totalAnnual: number;
  financingMonthly?: number; // if financed
}

export function calculateCarCosts(carValue: number, financeMonths: number = 0): CarCostSimulation {
  const ipvaAnnual = carValue * 0.04;
  const insuranceAnnual = carValue * 0.05;
  const maintenanceMonthly = carValue * 0.005; // ~0.5% per month average
  const fuelMonthly = 400; // Average estimate
  
  const ipvaMonthly = ipvaAnnual / 12;
  const insuranceMonthly = insuranceAnnual / 12;
  
  let financingMonthly = 0;
  if (financeMonths > 0) {
    // Simple financing calculation with ~1.5% monthly interest
    const monthlyRate = 0.015;
    financingMonthly = carValue * (monthlyRate * Math.pow(1 + monthlyRate, financeMonths)) / 
      (Math.pow(1 + monthlyRate, financeMonths) - 1);
  }
  
  const totalMonthly = ipvaMonthly + insuranceMonthly + maintenanceMonthly + fuelMonthly + financingMonthly;
  const totalAnnual = (ipvaAnnual + insuranceAnnual) + (maintenanceMonthly * 12) + (fuelMonthly * 12) + (financingMonthly * 12);
  
  return {
    carValue,
    ipva: ipvaAnnual,
    insurance: insuranceAnnual,
    maintenanceMonthly,
    fuelMonthly,
    totalMonthly,
    totalAnnual,
    financingMonthly: financeMonths > 0 ? financingMonthly : undefined,
  };
}

export function getCarAffordabilityWarning(
  monthlyIncome: number,
  daysOfOxygen: number,
  totalMonthlyCarCost: number,
  isSurvivalMode: boolean
): { canAfford: boolean; message: string; severity: "success" | "warning" | "danger" } {
  const incomePercentage = (totalMonthlyCarCost / monthlyIncome) * 100;
  
  // Survival mode check
  if (isSurvivalMode && daysOfOxygen < 180) {
    return {
      canAfford: false,
      message: `Seu sonho é legítimo, mas seu Runway atual é de apenas ${daysOfOxygen} dias. Recomendamos primeiro atingir 6 meses de reserva antes de assumir este compromisso de R$ ${totalMonthlyCarCost.toFixed(0)}/mês.`,
      severity: "danger",
    };
  }
  
  if (incomePercentage > 30) {
    return {
      canAfford: false,
      message: `Este carro consumirá ${incomePercentage.toFixed(0)}% da sua renda mensal. Especialistas recomendam no máximo 20-25% para transporte. Seu fluxo de caixa não suporta este sonho agora.`,
      severity: "danger",
    };
  }
  
  if (incomePercentage > 20) {
    return {
      canAfford: true,
      message: `Este carro consumirá ${incomePercentage.toFixed(0)}% da sua renda mensal. É um compromisso alto, mas gerenciável. Avalie bem antes de prosseguir.`,
      severity: "warning",
    };
  }
  
  return {
    canAfford: true,
    message: `Este carro consumirá ${incomePercentage.toFixed(0)}% da sua renda mensal. Seu fluxo de caixa suporta este investimento!`,
    severity: "success",
  };
}
