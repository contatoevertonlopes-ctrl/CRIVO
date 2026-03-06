/**
 * Shared currency formatter for BRL.
 * Use this across all components instead of duplicating Intl.NumberFormat.
 */
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const formatCurrency = (value: number): string => {
  return currencyFormatter.format(value);
};
