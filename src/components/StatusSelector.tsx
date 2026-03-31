import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { normalizeStatus, toDbStatus } from "@/lib/statusUtils";

interface StatusSelectorProps {
  transactionId: string;
  currentStatus: string;
  onStatusChange?: () => void;
  size?: "sm" | "md";
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Em aberto" },
  { value: "upcoming", label: "A vencer" },
  { value: "overdue", label: "Vencido" },
  { value: "paid", label: "Pago" },
];

const StatusSelector = ({ transactionId, currentStatus, onStatusChange, size = "md" }: StatusSelectorProps) => {
  const getStatusStyle = (status: string) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case "paid":
        return "bg-primary/20 border-primary/30 text-primary";
      case "upcoming":
        return "bg-warning/20 border-warning/30 text-warning";
      case "overdue":
        return "bg-destructive/20 border-destructive/30 text-destructive";
      default:
        return "bg-secondary/50 border-secondary text-muted-foreground";
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const dbStatus = toDbStatus(newStatus);
      // When marking as paid, also set paid_date
      const updatePayload: Record<string, unknown> = { status: dbStatus };
      if (newStatus === "paid") {
        updatePayload.paid_date = new Date().toISOString().split("T")[0];
      }

      const { error } = await supabase
        .from("transactions")
        .update(updatePayload)
        .eq("id", transactionId);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Status atualizado!");
      onStatusChange?.();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(error?.message || "Erro ao atualizar status");
    }
  };

  const normalizedStatus = normalizeStatus(currentStatus);
  const sizeClasses = size === "sm"
    ? "h-7 text-[10px] px-2 min-w-[90px]"
    : "h-8 text-xs px-2.5 min-w-[100px]";

  return (
    <Select value={normalizedStatus} onValueChange={handleStatusChange}>
      <SelectTrigger
        className={`${sizeClasses} rounded-full border ${getStatusStyle(normalizedStatus)} focus:ring-0 focus:ring-offset-0 [&>svg]:h-3 [&>svg]:w-3`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-xs">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default StatusSelector;
