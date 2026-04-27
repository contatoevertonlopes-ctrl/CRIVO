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
  cleaned = cleaned.replace(/[^\d.-]/g, "");
  
  return parseFloat(cleaned) || 0;
};

export interface ParsedDateResult {
  date: string;
  usedFallback: boolean;
  originalValue?: string;
}

// Convert Excel serial date to YYYY-MM-DD
const excelSerialToDate = (serial: number): string => {
  // Excel's epoch starts at December 30, 1899
  const excelEpoch = new Date(1899, 11, 30);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const date = new Date(excelEpoch.getTime() + serial * millisecondsPerDay);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  
  return `${year}-${month}-${day}`;
};

// Pad single digit to two digits
const pad = (n: string): string => n.padStart(2, "0");

// Convert 2-digit year to 4-digit year
const expandYear = (yy: string): string => {
  const year = parseInt(yy, 10);
  // Assume 00-49 is 2000s, 50-99 is 1900s
  return year < 50 ? `20${pad(yy)}` : `19${pad(yy)}`;
};

export const parseDate = (dateStr: string): ParsedDateResult => {
  const today = new Date().toISOString().split("T")[0];
  
  if (!dateStr || !dateStr.trim()) {
    return { date: today, usedFallback: true, originalValue: dateStr };
  }
  
  const cleaned = dateStr.trim();
  
  // Check if it's an Excel serial number (5 digits, typically 40000-50000 range for recent dates)
  const serialMatch = cleaned.match(/^(\d{5})$/);
  if (serialMatch) {
    const serial = parseInt(serialMatch[1], 10);
    if (serial >= 1 && serial <= 99999) {
      const date = excelSerialToDate(serial);
      return { date, usedFallback: false, originalValue: cleaned };
    }
  }
  
  // Try common formats (ordered by likelihood for Brazilian users)
  const formats = [
    // YYYY-MM-DD (ISO format)
    { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, format: (m: RegExpMatchArray) => `${m[1]}-${pad(m[2])}-${pad(m[3])}` },
    // DD/MM/YYYY (Brazilian) or MM/DD/YYYY (American) — disambiguate by value range
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, format: (m: RegExpMatchArray) => {
      const first = parseInt(m[1], 10);
      const second = parseInt(m[2], 10);
      // If second part > 12 and first <= 12, it must be MM/DD/YYYY
      if (second > 12 && first <= 12) return `${m[3]}-${pad(m[1])}-${pad(m[2])}`;
      // Default: DD/MM/YYYY (Brazilian)
      return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
    }},
    // DD-MM-YYYY
    { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, format: (m: RegExpMatchArray) => `${m[3]}-${pad(m[2])}-${pad(m[1])}` },
    // DD.MM.YYYY
    { regex: /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, format: (m: RegExpMatchArray) => `${m[3]}-${pad(m[2])}-${pad(m[1])}` },
    // DD/MM/YY (Brazilian with 2-digit year)
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/, format: (m: RegExpMatchArray) => `${expandYear(m[3])}-${pad(m[2])}-${pad(m[1])}` },
    // DD-MM-YY
    { regex: /^(\d{1,2})-(\d{1,2})-(\d{2})$/, format: (m: RegExpMatchArray) => `${expandYear(m[3])}-${pad(m[2])}-${pad(m[1])}` },
    // YYYYMMDD (OFX/compact format)
    { regex: /^(\d{4})(\d{2})(\d{2})$/, format: (m: RegExpMatchArray) => `${m[1]}-${m[2]}-${m[3]}` },
    // YYYY/MM/DD
    { regex: /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, format: (m: RegExpMatchArray) => `${m[1]}-${pad(m[2])}-${pad(m[3])}` },
  ];
  
  for (const { regex, format } of formats) {
    const match = cleaned.match(regex);
    if (match) {
      const result = format(match);
      if (result) {
        return { date: result, usedFallback: false, originalValue: cleaned };
      }
    }
  }
  
  // Try to parse with Date object as last resort
  try {
    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, "0");
      const day = String(parsed.getDate()).padStart(2, "0");
      const result = `${year}-${month}-${day}`;
      return { date: result, usedFallback: false, originalValue: cleaned };
    }
  } catch {
    // Ignore parsing errors
  }
  
  return { date: today, usedFallback: true, originalValue: cleaned };
};

// Simple wrapper that returns just the date string (for backward compatibility)
export const parseDateString = (dateStr: string): string => {
  return parseDate(dateStr).date;
};

export const generateTransactionId = (): string => {
  return `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
