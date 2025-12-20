import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  onDateChange: (from: Date | undefined, to: Date | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  dateFrom,
  dateTo,
  onDateChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectingStart, setSelectingStart] = useState(true);

  const handleSelect = (date: Date | undefined) => {
    if (selectingStart) {
      onDateChange(date, dateTo);
      setSelectingStart(false);
    } else {
      // Ensure end date is after start date
      if (date && dateFrom && date < dateFrom) {
        onDateChange(date, dateFrom);
      } else {
        onDateChange(dateFrom, date);
      }
      setSelectingStart(true);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onDateChange(undefined, undefined);
    setSelectingStart(true);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !dateFrom && !dateTo && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateFrom ? (
            dateTo ? (
              <>
                {format(dateFrom, "dd/MM/yy", { locale: ptBR })} -{" "}
                {format(dateTo, "dd/MM/yy", { locale: ptBR })}
              </>
            ) : (
              <>
                {format(dateFrom, "dd/MM/yy", { locale: ptBR })} - Selecione
              </>
            )
          ) : (
            <span>Período personalizado</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b border-border">
          <p className="text-xs text-muted-foreground">
            {selectingStart ? "Selecione a data inicial" : "Selecione a data final"}
          </p>
        </div>
        <Calendar
          mode="single"
          selected={selectingStart ? dateFrom : dateTo}
          onSelect={handleSelect}
          initialFocus
          locale={ptBR}
          className={cn("p-3 pointer-events-auto")}
        />
        {(dateFrom || dateTo) && (
          <div className="p-3 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="w-full text-muted-foreground"
            >
              Limpar seleção
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
