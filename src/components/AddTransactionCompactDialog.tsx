import React, { useEffect, useMemo, useState } from "react";
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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import TransactionForm, { type TransactionFormData } from "@/components/TransactionForm";
import { toast } from "sonner";
import { addDays, addMonths, addWeeks } from "date-fns";
import { getNextRecurringDate, getRecurringGenerationCount } from "@/utils/recurringGeneration";
import { createRecurringSeries as createRecurringSeriesInDb } from "@/hooks/useRecurringSeries";
import { computeUnpaidStatus, toDbStatus } from "@/lib/statusUtils";
import { useIsMobile } from "@/hooks/use-mobile";

interface AddTransactionCompactDialogProps {
  trigger?: React.ReactElement;
  onSuccess?: () => void;
  contentClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: "create" | "edit";
  transactionId?: string;
  initialFormData?: TransactionFormData;
  dialogTitle?: string;
  dialogDescription?: string;
  submitLabel?: string;
  showInstallment?: boolean;
}

const getDefaultFormData = (): TransactionFormData => {
  const today = new Date().toISOString().split("T")[0];
  return {
    description: "",
    amount: "",
    category: "Outros",
    type: "expense",
    status: computeUnpaidStatus(today),
    date: today,
    is_recurring: false,
    recurring_interval: "monthly",
    frequency: "monthly",
    paid_date: "",
    tag: "",
    is_installment: false,
    installment_count: "2",
    installment_interval: "monthly",
    payment_method: "",
    bank_account_id: "",
    card_id: "",
  };
};

const AddTransactionCompactDialog = ({
  trigger,
  onSuccess,
  contentClassName,
  open: controlledOpen,
  onOpenChange,
  mode = "create",
  transactionId,
  initialFormData,
  dialogTitle,
  dialogDescription,
  submitLabel,
  showInstallment,
}: AddTransactionCompactDialogProps) => {
  const { user } = useAuth();
  const { subscribed } = useSubscription();
  const { householdId } = useHouseholdId();
  const isMobile = useIsMobile();

  const isControlled = typeof controlledOpen === "boolean";
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const [formData, setFormData] = useState<TransactionFormData>(() => initialFormData ?? getDefaultFormData());

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const resetForm = () => setFormData(getDefaultFormData());

  useEffect(() => {
    if (!open) return;
    if (initialFormData) {
      setFormData(initialFormData);
      return;
    }
    resetForm();
  }, [open, initialFormData]);

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

  const createCardTransactionsSeries = async (params: {
    cardId: string;
    purchaseDateStr: string;
    description: string;
    totalAmount: number;
    installments: number;
    transactionIds?: string[];
  }) => {
    if (!user) throw new Error("User not authenticated");

    const { data: card, error: cardError } = await supabase
      .from("cards")
      .select("closing_day")
      .eq("id", params.cardId)
      .single();
    if (cardError) throw cardError;

    const purchaseDate = new Date(params.purchaseDateStr + "T00:00:00");
    const purchaseDay = purchaseDate.getDate();

    let firstBillingMonth = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), 1);
    if (purchaseDay > Number(card?.closing_day)) {
      firstBillingMonth.setMonth(firstBillingMonth.getMonth() + 1);
    }

    const installmentAmount = Math.round((params.totalAmount / params.installments) * 100) / 100;
    const firstDescription = params.installments > 1
      ? `${params.description} (1/${params.installments})`
      : params.description;

    const { data: root, error: rootError } = await supabase
      .from("card_transactions")
      .insert({
        card_id: params.cardId,
        transaction_id: params.transactionIds?.[0] ?? null,
        user_id: user.id,
        household_id: householdId,
        description: firstDescription,
        amount: installmentAmount,
        purchase_date: params.purchaseDateStr,
        installment_number: 1,
        total_installments: params.installments,
        billing_month: firstBillingMonth.toISOString().split("T")[0],
      })
      .select("id")
      .single();
    if (rootError) throw rootError;

    const rootId = root?.id as string | undefined;
    if (!rootId) throw new Error("Falha ao criar gasto no cartão");

    if (params.installments > 1) {
      const rows: any[] = [];
      for (let i = 2; i <= params.installments; i++) {
        const billingMonth = new Date(firstBillingMonth);
        billingMonth.setMonth(billingMonth.getMonth() + (i - 1));
        rows.push({
          card_id: params.cardId,
          transaction_id: params.transactionIds?.[i - 1] ?? null,
          user_id: user.id,
          household_id: householdId,
          description: `${params.description} (${i}/${params.installments})`,
          amount: installmentAmount,
          purchase_date: params.purchaseDateStr,
          installment_number: i,
          total_installments: params.installments,
          parent_card_transaction_id: rootId,
          billing_month: billingMonth.toISOString().split("T")[0],
        });
      }
      const { error: rowsError } = await supabase.from("card_transactions").insert(rows);
      if (rowsError) throw rowsError;
    }
  };

  const createRecurringSeries = async (root: {
    description: string;
    amount: number;
    category: string;
    type: "income" | "expense";
    status: string;
    date: string;
    recurring_interval: string;
    tag: string | null;
    paid_date: string | null;
    payment_method: string | null;
    bank_account_id: string | null;
    card_id: string | null;
  }) => {
    if (!user) throw new Error("Missing user");

    const interval = root.recurring_interval as "weekly" | "biweekly" | "monthly" | "yearly";

    return createRecurringSeriesInDb(
      {
        user_id: user.id,
        household_id: householdId,
        description: root.description,
        amount: root.amount,
        category: root.category,
        type: root.type,
        interval,
        start_date: root.date,
        tag: root.tag,
        payment_method: root.payment_method,
        bank_account_id: root.bank_account_id,
        card_id: root.card_id,
      },
      {
        date: root.date,
        status: root.status,
        paid_date: root.paid_date,
      },
      user.id,
      householdId,
    );
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
      const normalizedStatus = toDbStatus(formData.status || computeUnpaidStatus(formData.date));
      const isPaid = normalizedStatus === "pagamento_concluido";
      const normalizedPaidDate = isPaid
        ? (formData.paid_date || todayStr)
        : null;

      if (formData.is_installment && parseInt(formData.installment_count) > 1) {
        const totalAmount = parseFloat(formData.amount);
        const numInstallments = parseInt(formData.installment_count);
        const installmentAmount = Math.round((totalAmount / numInstallments) * 100) / 100;
        const baseDate = new Date(formData.date);

        const firstInstallmentDate = getNextInstallmentDate(baseDate, 0, formData.installment_interval);
        const firstDateStr = firstInstallmentDate.toISOString().split("T")[0];

        const { data: rootTx, error: rootTxError } = await supabase
          .from("transactions")
          .insert({
            user_id: user.id,
            household_id: householdId,
            description: `${formData.description} 1/${numInstallments}`,
            category: normalizedCategory,
            type: formData.type,
            amount: installmentAmount,
            status: normalizedStatus,
            date: firstDateStr,
            tag: formData.tag || null,
            is_recurring: false,
            recurring_interval: null,
            frequency: null,
            paid_date: normalizedPaidDate,
            payment_method: formData.payment_method || null,
            bank_account_id: formData.bank_account_id || null,
            card_id: formData.card_id || null,
          })
          .select("id")
          .single();
        if (rootTxError) throw rootTxError;

        const rootTransactionId = rootTx?.id as string | undefined;
        if (!rootTransactionId) throw new Error("Falha ao criar transação raiz do parcelamento");

        const childRows: any[] = [];
        for (let i = 1; i < numInstallments; i++) {
          const installmentDate = getNextInstallmentDate(baseDate, i, formData.installment_interval);
          const installmentDateStr = installmentDate.toISOString().split("T")[0];
          childRows.push({
            user_id: user.id,
            household_id: householdId,
            description: `${formData.description} ${i + 1}/${numInstallments}`,
            category: normalizedCategory,
            type: formData.type,
            amount: installmentAmount,
            status: computeUnpaidStatus(installmentDateStr),
            date: installmentDateStr,
            tag: formData.tag || null,
            is_recurring: false,
            recurring_interval: null,
            frequency: null,
            paid_date: null,
            payment_method: formData.payment_method || null,
            parent_transaction_id: rootTransactionId,
            bank_account_id: formData.bank_account_id || null,
            card_id: formData.card_id || null,
          });
        }

        let transactionIds: string[] = [rootTransactionId];
        if (childRows.length > 0) {
          const { data: insertedChildren, error: childrenError } = await supabase
            .from("transactions")
            .insert(childRows)
            .select("id");
          if (childrenError) throw childrenError;
          transactionIds = transactionIds.concat((insertedChildren || []).map((r: any) => r.id));
        }

        if (formData.payment_method === "credit_card" && formData.card_id) {
          await createCardTransactionsSeries({
            cardId: formData.card_id,
            purchaseDateStr: formData.date,
            description: formData.description,
            totalAmount,
            installments: numInstallments,
            transactionIds,
          });
        }

        toast.success(`${numInstallments} parcelas criadas com sucesso!`);
      } else {
        let createdTransactionId: string | null = null;
        if (subscribed && formData.is_recurring) {
          createdTransactionId = await createRecurringSeries({
            description: formData.description,
            amount: parseFloat(formData.amount),
            category: normalizedCategory,
            type: formData.type,
            status: normalizedStatus,
            date: formData.date,
            recurring_interval: formData.recurring_interval,
            tag: formData.tag || null,
            paid_date: normalizedPaidDate,
            payment_method: formData.payment_method || null,
            bank_account_id: formData.bank_account_id || null,
            card_id: formData.card_id || null,
          });
          toast.success("Transação fixa criada com lançamentos futuros!");
        } else {
          const { data: created, error } = await supabase
            .from("transactions")
            .insert({
            user_id: user.id,
            household_id: householdId,
            description: formData.description,
            amount: parseFloat(formData.amount),
            category: normalizedCategory,
            type: formData.type,
            status: normalizedStatus,
            date: formData.date,
            is_recurring: false,
            recurring_interval: null,
            frequency: null,
            tag: formData.tag || null,
            paid_date: normalizedPaidDate,
            payment_method: formData.payment_method || null,
            bank_account_id: formData.bank_account_id || null,
            card_id: formData.card_id || null,
            })
            .select("id")
            .single();

          if (error) throw error;
          createdTransactionId = (created?.id as string | undefined) ?? null;
          toast.success("Transação adicionada com sucesso!");
        }

        if (formData.payment_method === "credit_card" && formData.card_id) {
          await createCardTransactionsSeries({
            cardId: formData.card_id,
            purchaseDateStr: formData.date,
            description: formData.description,
            totalAmount: parseFloat(formData.amount),
            installments: 1,
            transactionIds: createdTransactionId ? [createdTransactionId] : undefined,
          });
        }
      }

      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Erro ao adicionar transação");
    }
  };

  const handleEdit = async () => {
    if (!user || !transactionId) return;

    if (!formData.description || !formData.amount) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (formData.is_recurring && !subscribed) {
      toast.error("Transações recorrentes são exclusivas do Plano Pro");
      return;
    }

    try {
      const normalizedCategory = (formData.category || "").trim() || "Outros";
      const isPaid = formData.status === "paid" || formData.status === "pagamento_concluido" || formData.status === "confirmed";
      // Normalize status to DB Portuguese format
      const TO_DB_MAP: Record<string, string> = {
        paid: "pagamento_concluido",
        pending: "em_aberto",
        upcoming: "a_vencer",
        overdue: "vencido",
      };
      const dbStatus = TO_DB_MAP[formData.status] ?? formData.status;
      // Respect manually entered paid_date; only fallback to today if none set
      const normalizedPaidDate = isPaid ? (formData.paid_date || todayStr) : null;

      const { error } = await supabase
        .from("transactions")
        .update({
          description: formData.description,
          amount: parseFloat(formData.amount),
          category: normalizedCategory,
          type: formData.type,
          status: dbStatus,
          date: formData.date,
          is_recurring: subscribed ? formData.is_recurring : false,
          recurring_interval: formData.is_recurring ? formData.recurring_interval : null,
          frequency: formData.is_recurring ? formData.recurring_interval : null,
          paid_date: normalizedPaidDate,
          tag: formData.tag || null,
          payment_method: formData.payment_method || null,
          bank_account_id: formData.bank_account_id || null,
          card_id: formData.card_id || null,
        })
        .eq("id", transactionId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Transação atualizada com sucesso!");
      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error("Erro ao atualizar transação");
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
  };

  const resolvedTitle = dialogTitle ?? (mode === "edit" ? "Editar Transação" : "Adicionar Transação");
  const resolvedDescription = dialogDescription ?? "";
  const resolvedSubmitLabel = submitLabel ?? (mode === "edit" ? "Salvar Alterações" : "Adicionar");
  const resolvedShowInstallment = showInstallment ?? mode !== "edit";

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        {trigger ? <DrawerTrigger asChild>{trigger}</DrawerTrigger> : null}
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle>{resolvedTitle}</DrawerTitle>
            {resolvedDescription ? <DrawerDescription>{resolvedDescription}</DrawerDescription> : null}
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-auto">
            <TransactionForm
              formData={formData}
              setFormData={(data) => setFormData(data)}
              onSubmit={mode === "edit" ? handleEdit : handleAdd}
              submitLabel={resolvedSubmitLabel}
              subscribed={subscribed}
              showInstallment={resolvedShowInstallment}
              variant="compact"
              disableAutoStatus={mode === "edit"}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className={contentClassName}>
        <DialogHeader>
          <DialogTitle>{resolvedTitle}</DialogTitle>
          {resolvedDescription ? <DialogDescription>{resolvedDescription}</DialogDescription> : null}
        </DialogHeader>
        <TransactionForm
          formData={formData}
          setFormData={(data) => setFormData(data)}
          onSubmit={mode === "edit" ? handleEdit : handleAdd}
          submitLabel={resolvedSubmitLabel}
          subscribed={subscribed}
          showInstallment={resolvedShowInstallment}
          variant="compact"
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionCompactDialog;
