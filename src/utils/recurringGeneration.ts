import { addDays, addMonths, addWeeks, addYears } from "date-fns";

export type RecurringInterval = "weekly" | "biweekly" | "monthly" | "yearly" | string;

export const getRecurringGenerationCount = (interval: RecurringInterval) => {
  switch (interval) {
    case "weekly":
      return 52; // ~1 year
    case "biweekly":
      return 26; // ~1 year
    case "monthly":
      return 24; // ~2 years
    case "yearly":
      return 5; // ~5 years
    default:
      return 24;
  }
};

export const getNextRecurringDate = (baseDate: Date, index: number, interval: RecurringInterval) => {
  switch (interval) {
    case "weekly":
      return addWeeks(baseDate, index);
    case "biweekly":
      // Quinzenal: manter compatibilidade com o app (15 dias)
      return addDays(baseDate, index * 15);
    case "yearly":
      return addYears(baseDate, index);
    case "monthly":
    default:
      return addMonths(baseDate, index);
  }
};
