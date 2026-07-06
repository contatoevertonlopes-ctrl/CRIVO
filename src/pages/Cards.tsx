import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useCards, CardWithBill } from "@/hooks/useCards";
import Sidebar from "@/components/Sidebar";
import CreditCardVisual from "@/components/cards/CreditCardVisual";
import CardDialog from "@/components/cards/CardDialog";
import CardDetailsDrawer from "@/components/cards/CardDetailsDrawer";
import FutureCommitmentsChart from "@/components/cards/FutureCommitmentsChart";
import RealBalanceWidget from "@/components/cards/RealBalanceWidget";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard } from "lucide-react";
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
import ThemeToggle from "@/components/ThemeToggle";

const Cards = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    cards,
    cardTransactions,
    loading: cardsLoading,
    createCard,
    updateCard,
    deleteCard,
    getFutureCommitments,
    getTotalOpenBills,
    invalidateCards,
  } = useCards();

  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardWithBill | null>(null);
  const [editingCard, setEditingCard] = useState<CardWithBill | null>(null);
  const { totalPatrimony } = useBankAccounts();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user) {
      invalidateCards();
    }
  }, [authLoading, user, invalidateCards]);

  const handleSaveCard = async (cardData: Parameters<typeof createCard>[0]) => {
    if (editingCard) {
      await updateCard(editingCard.id, cardData);
    } else {
      await createCard(cardData);
    }
    setEditingCard(null);
  };

  const handleCardClick = (card: CardWithBill) => {
    setSelectedCard(card);
    setDetailsDrawerOpen(true);
  };

  const handleAddCard = () => {
    setEditingCard(null);
    setCardDialogOpen(true);
  };

  const handleEditCard = () => {
    setEditingCard(selectedCard);
    setDetailsDrawerOpen(false);
    setCardDialogOpen(true);
  };

  const handleDeleteCard = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCard = async () => {
    if (selectedCard) {
      await deleteCard(selectedCard.id);
      setSelectedCard(null);
      setDetailsDrawerOpen(false);
      setDeleteDialogOpen(false);
    }
  };

  const futureCommitments = getFutureCommitments();
  const totalOpenBills = getTotalOpenBills();

  if (authLoading || cardsLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar />

      <main className="flex-1 min-w-0 pt-16 pb-nav-safe lg:pt-0 lg:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-4 lg:px-6 lg:py-6 flex flex-col gap-6">
          {/* Header */}
          <header className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-primary" />
                Cartões
              </h1>
              <p className="text-sm text-muted-foreground hidden sm:block mt-1">
                Controle e acompanhe suas faturas
              </p>
            </div>
            <ThemeToggle />
          </header>

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
              </div>
            </section>
          ) : (
            <section className="py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto flex items-center justify-center mb-4">
                <CreditCard className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Nenhum cartão cadastrado</h2>
              <p className="text-sm text-muted-foreground">
                Use o botão + para adicionar seu primeiro cartão.
              </p>
            </section>
          )}

          {/* Future Commitments Chart */}
          {cards.length > 0 && (
            <FutureCommitmentsChart data={futureCommitments} />
          )}

          {/* Saúde Financeira (por último) */}
          <RealBalanceWidget
            currentBalance={totalPatrimony}
            totalOpenBills={totalOpenBills}
          />

          {/* Card Details Drawer */}
          <CardDetailsDrawer
            open={detailsDrawerOpen}
            onOpenChange={setDetailsDrawerOpen}
            card={selectedCard}
            transactions={cardTransactions}
            onEdit={handleEditCard}
            onDelete={handleDeleteCard}
          />

          {/* Card Edit Dialog */}
          <CardDialog
            open={cardDialogOpen}
            onOpenChange={setCardDialogOpen}
            card={editingCard}
            onSave={handleSaveCard}
          />

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover Cartão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja remover o cartão "{selectedCard?.name}"? 
                  O histórico de transações será mantido, mas o cartão não aparecerá mais na lista.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={confirmDeleteCard}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>

      {/* FABs */}
      <div className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 flex flex-col gap-2 z-40">
        <Button
          size="lg"
          className="rounded-full w-14 h-14 shadow-float bg-gradient-to-br from-primary to-primary/80 hover:from-primary/95 hover:to-primary/75 hover:scale-105 active:scale-95 transition-all duration-200"
          onClick={handleAddCard}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

export default Cards;
