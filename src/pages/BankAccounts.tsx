import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBankAccounts, BankAccount } from "@/hooks/useBankAccounts";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BankAccountCard } from "@/components/accounts/BankAccountCard";
import { BankAccountDialog } from "@/components/accounts/BankAccountDialog";
import { TransferDialog } from "@/components/accounts/TransferDialog";
import { Plus, Landmark, TrendingUp, Wallet, ArrowRightLeft } from "lucide-react";
import { Navigate } from "react-router-dom";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const BankAccounts = () => {
  const { user, loading: authLoading } = useAuth();
  const { 
    accounts, 
    isLoading, 
    totalPatrimony,
    createAccount,
    updateAccount,
    deleteAccount,
    isCreating,
    isUpdating,
  } = useBankAccounts();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<BankAccount | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Landmark className="w-12 h-12 text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account);
    setDialogOpen(true);
  };

  const handleDelete = (account: BankAccount) => {
    setDeletingAccount(account);
  };

  const handleSave = async (data: {
    name: string;
    bank_name: string;
    account_type: "checking" | "savings";
    balance: number;
    color: string;
    icon: string;
  }) => {
    if (editingAccount) {
      await updateAccount({ id: editingAccount.id, ...data });
    } else {
      await createAccount({
        ...data,
        is_active: true,
      });
    }
    setEditingAccount(null);
  };

  const confirmDelete = async () => {
    if (deletingAccount) {
      await deleteAccount(deletingAccount.id);
      setDeletingAccount(null);
    }
  };

  const positiveAccounts = accounts.filter(a => a.balance >= 0);
  const negativeAccounts = accounts.filter(a => a.balance < 0);
  const totalPositive = positiveAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalNegative = Math.abs(negativeAccounts.reduce((sum, a) => sum + a.balance, 0));

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar />
      
      <main className="flex-1 min-w-0 pt-16 pb-24 lg:pt-0 lg:pb-0">
        <div className="max-w-6xl mx-auto px-4 py-4 lg:px-6 lg:py-6 flex flex-col gap-4 lg:gap-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Landmark className="w-6 h-6 text-primary" />
              Minhas Contas
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie suas contas bancárias e acompanhe seu patrimônio
            </p>
          </div>
          
          <div className="flex gap-2">
            {accounts.length >= 2 && (
              <Button
                variant="outline"
                onClick={() => setTransferOpen(true)}
              >
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Transferir
              </Button>
            )}
            <Button
              onClick={() => {
                setEditingAccount(null);
                setDialogOpen(true);
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Patrimony */}
          <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur card-shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Patrimônio Total</p>
                  <p className={`text-xl font-bold ${totalPatrimony >= 0 ? "text-primary" : "text-destructive"}`}>
                    {formatCurrency(totalPatrimony)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Positive */}
          <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur card-shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldos Positivos</p>
                  <p className="text-xl font-bold text-green-500">
                    {formatCurrency(totalPositive)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Accounts */}
          <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur card-shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Landmark className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total de Contas</p>
                  <p className="text-xl font-bold">{accounts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accounts Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-10 w-10 rounded-xl mb-3" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-32" />
              </Card>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Landmark className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma conta cadastrada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione suas contas bancárias para ter controle total do seu patrimônio
            </p>
            <Button
              onClick={() => {
                setEditingAccount(null);
                setDialogOpen(true);
              }}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar primeira conta
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {accounts.map((account) => (
              <BankAccountCard
                key={account.id}
                account={account}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
        </div>
      </main>

      {/* Dialogs */}
      <BankAccountDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingAccount(null);
        }}
        account={editingAccount}
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
      />

      <TransferDialog 
        open={transferOpen} 
        onOpenChange={setTransferOpen} 
      />

      <AlertDialog open={!!deletingAccount} onOpenChange={() => setDeletingAccount(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover conta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a conta "{deletingAccount?.name}" ({deletingAccount?.bank_name})?
              As transações vinculadas a esta conta não serão excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BankAccounts;
