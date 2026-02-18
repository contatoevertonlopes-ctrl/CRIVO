import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  allLabel?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Selecionar...",
  allLabel = "Todos",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const isAllSelected = selected.length === 0;

  const getDisplayText = () => {
    if (isAllSelected) return allLabel;
    if (selected.length === 1) {
      return options.find((o) => o.value === selected[0])?.label ?? selected[0];
    }
    return `${selected.length} selecionados`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-10 w-full justify-between text-sm font-normal bg-background hover:bg-background border-input",
            !isAllSelected && "text-foreground",
            isAllSelected && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{getDisplayText()}</span>
          <div className="flex items-center gap-1 ml-1 shrink-0">
            {!isAllSelected && (
              <span
                role="button"
                tabIndex={0}
                onClick={clearAll}
                onKeyDown={(e) => { if (e.key === "Enter") clearAll(e as unknown as React.MouseEvent); }}
                className="rounded-full hover:bg-muted p-0.5"
              >
                <X className="w-3 h-3" />
              </span>
            )}
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 max-h-[60vh] flex flex-col" align="start">
        <div
          className="overflow-y-auto flex-1 min-h-0"
          style={{ maxHeight: "min(16rem, 50vh)", touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* All option */}
          <button
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors",
              isAllSelected && "font-medium"
            )}
            onPointerDown={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}
            onClick={() => onChange([])}
          >
            <div
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded border border-primary",
                isAllSelected ? "bg-primary text-primary-foreground" : "opacity-50"
              )}
            >
              {isAllSelected && <Check className="w-3 h-3" />}
            </div>
            <span>{allLabel}</span>
          </button>

          <div className="border-t border-border/50 my-1" />

          {options.map((option) => {
            const isSelected = selected.includes(option.value);
            return (
              <button
                key={option.value}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors",
                  isSelected && "font-medium"
                )}
                onPointerDown={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}
                onClick={() => toggle(option.value)}
              >
                <div
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded border border-primary shrink-0",
                    isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                  )}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                </div>
                <span className="truncate">{option.label}</span>
              </button>
            );
          })}
        </div>

        {!isAllSelected && selected.length > 0 && (
          <div className="border-t border-border/50 p-2">
            <div className="flex flex-wrap gap-1">
              {selected.map((v) => {
                const label = options.find((o) => o.value === v)?.label ?? v;
                return (
                  <Badge
                    key={v}
                    variant="secondary"
                    className="text-xs gap-1 cursor-pointer"
                    onClick={() => toggle(v)}
                  >
                    {label}
                    <X className="w-2.5 h-2.5" />
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
