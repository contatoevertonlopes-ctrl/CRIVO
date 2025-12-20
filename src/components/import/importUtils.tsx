// Category keywords for auto-categorization
export const categoryKeywords: Record<string, string[]> = {
  "Alimentação": [
    "restaurante", "lanchonete", "pizzaria", "ifood", "uber eats", "rappi", 
    "mercado", "supermercado", "padaria", "açougue", "hortifruti", "food", 
    "burger", "mcdonald", "subway", "starbucks", "café", "cafeteria", "delivery",
    "pao de acucar", "carrefour", "extra", "assai", "atacadao", "sams club"
  ],
  "Transporte": [
    "uber", "99", "taxi", "combustível", "gasolina", "etanol", "posto", 
    "estacionamento", "pedágio", "ipva", "seguro auto", "oficina", "borracharia", 
    "onibus", "metro", "trem", "99app", "uber *trip", "cabify", "shell", "ipiranga", "br"
  ],
  "Moradia": [
    "aluguel", "condomínio", "iptu", "luz", "energia", "água", "gás", 
    "internet", "telefone", "celular", "tv cabo", "netflix", "spotify", 
    "amazon prime", "hbo", "disney", "globoplay", "vivo", "tim", "claro", "oi",
    "cpfl", "enel", "sabesp", "copasa", "cemig"
  ],
  "Saúde": [
    "farmácia", "drogaria", "hospital", "clínica", "médico", "dentista", 
    "laboratório", "exame", "plano de saúde", "unimed", "bradesco saúde", 
    "sulamerica", "hapvida", "notredame", "drogasil", "droga raia", "pague menos"
  ],
  "Educação": [
    "escola", "faculdade", "universidade", "curso", "livro", "livraria", 
    "papelaria", "udemy", "coursera", "alura", "hotmart", "domestika"
  ],
  "Lazer": [
    "cinema", "teatro", "show", "ingresso", "parque", "viagem", "hotel", 
    "airbnb", "booking", "decolar", "latam", "gol", "azul", "cinemark",
    "uci", "kinoplex", "game", "steam", "playstation", "xbox", "nintendo"
  ],
  "Compras": [
    "shopping", "loja", "magazine", "americanas", "amazon", "mercado livre", 
    "aliexpress", "shein", "renner", "c&a", "riachuelo", "zara", "h&m",
    "marisa", "hering", "netshoes", "kabum", "pichau"
  ],
  "Serviços": [
    "banco", "tarifa", "iof", "ted", "pix", "doc", "anuidade", "cartão", 
    "seguro", "juros", "multa", "taxa"
  ],
  "Salário": [
    "salário", "salario", "pagamento", "folha", "holerite", "pro-labore", 
    "prolabore", "remuneração", "adiantamento", "férias", "13o", "decimo"
  ],
  "Investimentos": [
    "investimento", "aplicação", "resgate", "dividendo", "jcp", "rendimento", 
    "cdb", "tesouro", "ações", "fii", "btg", "xp", "rico", "clear", "nuinvest"
  ],
  "Freelance": [
    "freelance", "projeto", "consultoria", "serviço prestado", "nota fiscal", 
    "nf-e", "pj", "mei"
  ],
  "Assinaturas": [
    "assinatura", "subscription", "mensal", "anual", "prime", "plus", 
    "premium", "pro", "recorrente"
  ],
};

export const allCategories = [
  "Alimentação",
  "Transporte", 
  "Moradia",
  "Saúde",
  "Educação",
  "Lazer",
  "Compras",
  "Serviços",
  "Salário",
  "Investimentos",
  "Freelance",
  "Assinaturas",
  "Outros",
];

export const autoCategorize = (description: string, existingCategory?: string): { category: string; suggested: boolean } => {
  // If already has a meaningful category, keep it
  if (existingCategory && existingCategory !== "Importado" && existingCategory !== "Outros" && existingCategory.trim()) {
    return { category: existingCategory, suggested: false };
  }
  
  const descLower = description.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      const keywordNormalized = keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (descLower.includes(keywordNormalized)) {
        return { category, suggested: true };
      }
    }
  }
  
  return { category: "Outros", suggested: false };
};

export const parseMonetaryValue = (value: string): number => {
  if (!value) return 0;
  
  // Remove currency symbols and whitespace
  let cleaned = value.replace(/[R$\s]/g, "").trim();
  
  // Detect format: Brazilian (1.234,56) vs American (1,234.56)
  const hasCommaDecimal = /,\d{2}$/.test(cleaned);
  const hasDotDecimal = /\.\d{2}$/.test(cleaned);
  
  if (hasCommaDecimal) {
    // Brazilian format: remove dots (thousands), replace comma with dot
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (hasDotDecimal) {
    // American format: remove commas (thousands)
    cleaned = cleaned.replace(/,/g, "");
  } else {
    // Try to guess - if has comma followed by 1-2 digits at end, treat as decimal
    if (/,\d{1,2}$/.test(cleaned)) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  }
  
  // Keep only numbers, dots, and minus sign
  cleaned = cleaned.replace(/[^\\d.-]/g, "");
  
  return parseFloat(cleaned) || 0;
};

export const parseDate = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  
  const cleaned = dateStr.trim();
  
  // Try common formats
  const formats = [
    { regex: /^(\d{4})-(\d{2})-(\d{2})/, format: (m: RegExpMatchArray) => `${m[1]}-${m[2]}-${m[3]}` },
    { regex: /^(\d{2})\/(\d{2})\/(\d{4})/, format: (m: RegExpMatchArray) => `${m[3]}-${m[2]}-${m[1]}` },
    { regex: /^(\d{2})-(\d{2})-(\d{4})/, format: (m: RegExpMatchArray) => `${m[3]}-${m[2]}-${m[1]}` },
    { regex: /^(\d{2})\.(\d{2})\.(\d{4})/, format: (m: RegExpMatchArray) => `${m[3]}-${m[2]}-${m[1]}` },
    { regex: /^(\d{4})(\d{2})(\d{2})/, format: (m: RegExpMatchArray) => `${m[1]}-${m[2]}-${m[3]}` }, // OFX format
  ];
  
  for (const { regex, format } of formats) {
    const match = cleaned.match(regex);
    if (match) {
      return format(match);
    }
  }
  
  return new Date().toISOString().split("T")[0];
};

export const generateTransactionId = (): string => {
  return `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
