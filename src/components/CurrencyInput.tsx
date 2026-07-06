import type { FocusEventHandler } from "react";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const formatPtBr = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const digitsToDecimalString = (digits: string) => {
  const int = parseInt(digits || "0", 10);
  return (int / 100).toFixed(2);
};

const decimalStringToDigits = (value: string) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  return String(Math.round(numeric * 100));
};

export interface CurrencyInputProps {
  value: string;
  onValueChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  prefix?: string;
  disabled?: boolean;
  onBlur?: FocusEventHandler<HTMLInputElement>;
}

export default function CurrencyInput({
  value,
  onValueChange,
  placeholder = "0,00",
  className,
  inputClassName,
  prefix,
  disabled,
  onBlur,
}: CurrencyInputProps) {
  const [digits, setDigits] = useState<string>("");

  useEffect(() => {
    // Keep internal digits in sync when value changes externally.
    setDigits(value ? decimalStringToDigits(value) : "");
  }, [value]);

  const display = useMemo(() => {
    if (!digits) return "";
    const asNumber = Number(digitsToDecimalString(digits));
    return `${prefix ? `${prefix} ` : ""}${formatPtBr(asNumber)}`;
  }, [digits, prefix]);

  return (
    <div className={cn("relative", className)}>
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={display}
        disabled={disabled}
        placeholder={prefix ? `${prefix} ${placeholder}` : placeholder}
        autoComplete="off"
        onChange={(e) => {
          const nextDigits = (e.target.value || "").replace(/\D/g, "");
          setDigits(nextDigits);
          onValueChange(nextDigits ? digitsToDecimalString(nextDigits) : "");
        }}
        onBlur={onBlur}
        className={cn("finance-value", inputClassName)}
      />
    </div>
  );
}
