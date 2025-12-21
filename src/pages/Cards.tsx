import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCards } from "@/hooks/useCards";
import Sidebar from "@/components/Sidebar";
import CreditCardVisual from "@/components/cards/CreditCardVisual";
import CardDialog from "@/components/cards/CardDialog";
import CardExpenseDialog from "@/components/cards/CardExpenseDialog";
import FutureCommitmentsChart from "@/components/cards/FutureCommitmentsChart";
import RealBalanceWidget from "@/components/cards/RealBalanceWidget";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Cards = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    cards,
    loading: cardsLoading,
    createCard,
    updateCard,
    addCardExpense,
    getFutureCommitments,
    getTotalOpenBills,
  } = useCards();

  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<typeof cards[0] | null>(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("current_balance, monthly_income")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setCurrentBalance(Number(data.current_balance) || 0);
        setMonthlyIncome(Number(data.monthly_income) || 0);
      }
    };

    fetchProfileData();
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSaveCard = async (cardData: Parameters<typeof createCard>[0]) => {
    if (editingCard) {
      await updateCard(editingCard.id, cardData);
    } else {
      await createCard(cardData);
    }
    setEditingCard(null);
  };

  const handleCardClick = (card: typeof cards[0]) => {
    setEditingCard(card);
    setCardDialogOpen(true);
  };

  const handleAddCard = () => {
    setEditingCard(null);
    setCardDialogOpen(true);
  };

  const futureCommitments = getFutureCommitments();
  const totalOpenBills = getTotalOpenBills();

  if (authLoading || cardsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 min-w-0 pt-16 pb-24 lg:pt-0 lg:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-4 lg:px-6 lg:py-6 flex flex-col gap-6">
          {/* Header */}
          <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Gestão de Cartões</h1>
                <p className="text-sm text-muted-foreground">
                  Controle seus cartões e faturas
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpenseDialogOpen(true)}
                disabled={cards.length === 0}
              >
                <Wallet className="w-4 h-4 mr-2" />
                Lançar Gasto
              </Button>
              <Button size="sm" onClick={handleAddCard}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Cartão
              </Button>
            </div>
          </header>

          {/* Real Balance Widget */}
          <RealBalanceWidget
            currentBalance={currentBalance}
            totalOpenBills={totalOpenBills}
          />

          {/* Cards Grid */}
          {cards.length > 0 ? (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                Seus Cartões
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((card) => (
                  <CreditCardVisual
                    key={card.id}
                    card={card}
                    onClick={() => handleCardClick(card)}
                  />
                ))}

                {/* Add Card Button */}
                <button
                  onClick={handleAddCard}
                  className="aspect-[1.586/1] rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                >
                  <Plus className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Adicionar Cartão</span>
                </button>
              </div>
            </section>
          ) : (
            <section className="py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto flex items-center justify-center mb-4">
                <CreditCard className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Nenhum cartão cadastrado</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Adicione seu primeiro cartão de crédito para começar a controlar suas faturas.
              </p>
              <Button onClick={handleAddCard}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Cartão
              </Button>
            </section>
          )}

          {/* Future Commitments Chart */}
          {cards.length > 0 && (
            <FutureCommitmentsChart data={futureCommitments} />
          )}

          {/* Dialogs */}
          <CardDialog
            open={cardDialogOpen}
            onOpenChange={setCardDialogOpen}
            card={editingCard}
            onSave={handleSaveCard}
          />

          <CardExpenseDialog
            open={expenseDialogOpen}
            onOpenChange={setExpenseDialogOpen}
            cards={cards}
            onSave={addCardExpense}
            monthlyIncome={monthlyIncome}
          />
        </div>
      </main>

      {/* FABs */}
      <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 flex flex-col gap-2 z-40">
        {cards.length > 0 && (
          <Button
            size="lg"
            variant="outline"
            className="rounded-full w-14 h-14 shadow-lg"
            onClick={() => setExpenseDialogOpen(true)}
          >
            <Wallet className="w-5 h-5" />
          </Button>
        )}
        <Button
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg"
          onClick={handleAddCard}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

export default Cards;
