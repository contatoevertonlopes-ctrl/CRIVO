import React, { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useHouseholdId } from "@/hooks/useHouseholdId";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import TransactionForm, { type TransactionFormData } from "@/components/TransactionForm";
import { toast } from "sonner";
import { addDays, addMonths, addWeeks } from "date-fns";

interface AddTransactionCompactDialogProps {
  trigger: React.ReactElement;
  onSuccess?: () => void;
  contentClassName?: string;
}

const AddTransactionCompactDialog = ({
  trigger,
  onSuccess,
  contentClassName,
}: AddTransactionCompactDialogProps) => {
  const { user } = useAuth();
  const { subscribed } = useSubscription();
  const { householdId } = useHouseholdId();

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<TransactionFormData>({
    description: "",
    amount: "",
    category: "Outros",
    type: "expense" as "income" | "expense",
    status: "em_aberto",
    date: new Date().toISOString().split("T")[0],
    is_recurring: false,
    recurring_interval: "monthly",
    paid_date: "",
    tag: "",
    is_installment: false,
    installment_count: "2",
    installment_interval: "monthly",
    payment_method: "",
    bank_account_id: "",
    card_id: "",
  });

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const computeUnpaidStatus = (dateStr: string) => {
    const d = dateStr || todayStr;
    if (d > todayStr) return "a_vencer";
    if (d < todayStr) return "vencido";
    return "em_aberto";
  };

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      category: "Outros",
      type: "expense",
      status: "em_aberto",
      date: new Date().toISOString().split("T")[0],
      is_recurring: false,
      recurring_interval: "monthly",
      paid_date: "",
      tag: "",
      is_installment: false,
      installment_count: "2",
      installment_interval: "monthly",
      payment_method: "",
      bank_account_id: "",
      card_id: "",
    });
  };

  const getNextInstallmentDate = (baseDate: Date, index: number, interval: string) => {
    switch (interval) {
      case "weekly":
        return addWeeks(baseDate, index);
      case "biweekly":
        return addDays(baseDate, index * 15);
      case "monthly":
      default:
        return addMonths(baseDate, index);
    }
  };

  const handleAdd = async () => {
    if (!user || !formData.description || !formData.amount) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (formData.is_recurring && !subscribed) {
      toast.error("Transações recorrentes são exclusivas do Plano Pro");
      return;
    }

    if (formData.is_installment && !subscribed) {
      toast.error("Parcelamento é exclusivo do Plano Pro");
      return;
    }

    try {
      const normalizedCategory = (formData.category || "").trim() || "Outros";
      const isPaid = formData.status === "pagamento_concluido";
      const normalizedStatus = isPaid ? "pagamento_concluido" : computeUnpaidStatus(formData.date);
      const normalizedPaidDate = normalizedStatus === "pagamento_concluido"
        ? (formData.paid_date || todayStr)
        : null;

      if (formData.is_installment && parseInt(formData.installment_count) > 1) {
        const totalAmount = parseFloat(formData.amount);
        const numInstallments = parseInt(formData.installment_count);
        const installmentAmount = Math.round((totalAmount / numInstallments) * 100) / 100;
        const baseDate = new Date(formData.date);

        const transactions = [];
        for (let i = 0; i < numInstallments; i++) {
          const installmentDate = getNextInstallmentDate(baseDate, i, formData.installment_interval);
          transactions.push({
            user_id: user.id,
            household_id: householdId,
            description: `${formData.description} ${i + 1}/${numInstallments}`,
            category: normalizedCategory,
            type: formData.type,
            amount: installmentAmount,
            status: i === 0 ? normalizedStatus : "em_aberto",
            date: installmentDate.toISOString().split("T")[0],
            tag: formData.tag || null,
            is_recurring: false,
            recurring_interval: null,
            paid_date: i === 0 ? normalizedPaidDate : null,
            payment_method: formData.payment_method || null,
            bank_account_id: formData.bank_account_id || null,
            card_id: formData.card_id || null,
          });
        }

        const { error } = await supabase.from("transactions").insert(transactions);
        if (error) throw error;

        toast.success(`${numInstallments} parcelas criadas com sucesso!`);
      } else {
        const { error } = await supabase.from("transactions").insert({
          user_id: user.id,
          household_id: householdId,
          description: formData.description,
          amount: parseFloat(formData.amount),
          category: normalizedCategory,
          type: formData.type,
          status: normalizedStatus,
          date: formData.date,
          is_recurring: subscribed ? formData.is_recurring : false,
          recurring_interval: formData.is_recurring ? formData.recurring_interval : null,
          tag: formData.tag || null,
          paid_date: normalizedPaidDate,
          payment_method: formData.payment_method || null,
          bank_account_id: formData.bank_account_id || null,
          card_id: formData.card_id || null,
        });

        if (error) throw error;
        toast.success("Transação adicionada com sucesso!");
      }

      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Erro ao adicionar transação");
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={contentClassName}>
        <DialogHeader>
          <DialogTitle>Adicionar Transação</DialogTitle>
          <DialogDescription>
            Preencha os campos para adicionar uma nova transação.
          </DialogDescription>
        </DialogHeader>
        <TransactionForm
          formData={formData}
          setFormData={(data) => setFormData(data)}
          onSubmit={handleAdd}
          submitLabel="Adicionar"
          subscribed={subscribed}
          variant="compact"
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionCompactDialog;
