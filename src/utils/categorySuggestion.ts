export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Alimentação": [
    "pizza",
    "lanche",
    "restaurante",
    "ifood",
    "almoço",
    "jantar",
    "café",
    "mercado",
    "supermercado",
    "padaria",
    "açougue",
  ],
  "Transporte": [
    "uber",
    "99",
    "gasolina",
    "combustível",
    "abastecimento",
    "posto",
    "estacionamento",
    "ônibus",
    "metrô",
    "táxi",
    "pedágio",
  ],
  "Casa": [
    "aluguel",
    "condomínio",
    "iptu",
    "luz",
    "água",
    "gás",
    "internet",
    "energia",
  ],
  "Saúde": [
    "farmácia",
    "remédio",
    "médico",
    "consulta",
    "exame",
    "hospital",
    "dentista",
  ],
  "Lazer e hobbies": [
    "cinema",
    "show",
    "festa",
    "bar",
    "balada",
    "netflix",
    "spotify",
    "jogo",
    "viagem",
  ],
  "Educação": ["curso", "livro", "escola", "faculdade", "mensalidade"],
  "Compras": ["roupa", "sapato", "eletrônico", "celular", "presente"],
  "Salário": ["salário", "pagamento", "freelance", "bônus"],
  "Investimentos": ["dividendo", "rendimento", "juros", "investimento"],
};

export const detectCategory = (text: string): string => {
  const lowerText = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      return category;
    }
  }
  return "Outros";
};
