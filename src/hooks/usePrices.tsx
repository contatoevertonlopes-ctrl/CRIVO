import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PriceData {
  monthly: {
    amount: number;
    priceId: string | null;
  };
  annual: {
    amount: number;
    priceId: string | null;
    monthlyEquivalent: number;
    savings: number;
  };
}

const DEFAULT_PRICES: PriceData = {
  monthly: { amount: 15.90, priceId: null },
  annual: { amount: 139, priceId: null, monthlyEquivalent: 11.58, savings: 27 },
};

export const usePrices = () => {
  const [prices, setPrices] = useState<PriceData>(DEFAULT_PRICES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-prices");
        
        if (error) {
          console.error("Error fetching prices:", error);
          return;
        }

        if (data && !data.error) {
          setPrices(data);
        }
      } catch (err) {
        console.error("Failed to fetch prices:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, []);

  const formatPrice = (amount: number) => {
    return amount.toLocaleString("pt-BR", {
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    });
  };

  return { prices, loading, formatPrice };
};
