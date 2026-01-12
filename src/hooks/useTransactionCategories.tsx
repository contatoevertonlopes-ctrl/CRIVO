import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_TRANSACTION_CATEGORIES,
  type TransactionCategory,
  findCategoryByName,
  normalizeCategoryName,
} from "@/lib/transactionCategories";

const STORAGE_KEY = "transactionCategories";

type StoredCategory = Omit<TransactionCategory, "isDefault">;

const safeParse = (value: string | null): StoredCategory[] | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    return parsed as StoredCategory[];
  } catch {
    return null;
  }
};

export const useTransactionCategories = () => {
  const [custom, setCustom] = useState<StoredCategory[]>([]);

  useEffect(() => {
    const stored = safeParse(localStorage.getItem(STORAGE_KEY));
    if (stored) setCustom(stored);
  }, []);

  const categories = useMemo(() => {
    const merged: TransactionCategory[] = [...DEFAULT_TRANSACTION_CATEGORIES];

    for (const c of custom) {
      if (!c?.name) continue;
      if (findCategoryByName(merged, c.name)) continue;
      merged.push({ ...c, isDefault: false });
    }

    return merged;
  }, [custom]);

  const addCategory = (category: Omit<StoredCategory, "id"> & { id?: string }) => {
    const name = category.name.trim();
    if (!name) return;

    const id = category.id ?? `custom_${normalizeCategoryName(name).replace(/\s+/g, "_")}`;
    const next: StoredCategory = {
      id,
      name,
      icon: category.icon,
      color: category.color,
    };

    setCustom((prev) => {
      const exists = prev.some((c) => normalizeCategoryName(c.name) === normalizeCategoryName(name));
      if (exists) return prev;
      const updated = [next, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return {
    categories,
    addCategory,
  };
};
