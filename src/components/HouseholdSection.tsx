import { useState } from "react";
import { useHousehold } from "@/hooks/useHousehold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Users, Copy, UserPlus, Check, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const HouseholdSection = () => {
  const { household, members, invites, loading, createInvite, acceptInvite, updateHouseholdName } = useHousehold();
  const { toast } = useToast();
  const [householdName, setHouseholdName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  const handleGenerateInvite = async () => {
    setIsGenerating(true);
    const invite = await createInvite();
    setIsGenerating(false);

    if (invite) {
      toast({
        title: "Convite gerado!",
        description: "Compartilhe o código com seu parceiro(a).",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível gerar o convite.",
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({
      title: "Código copiado!",
      description: "Compartilhe com seu parceiro(a).",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAcceptInvite = async () => {
    if (!inviteCode.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Digite o código do convite.",
      });
      return;
    }

    setIsAccepting(true);
    const result = await acceptInvite(inviteCode.trim());
    setIsAccepting(false);

    if (result.success) {
      setShowJoinDialog(false);
      setInviteCode("");
      toast({
        title: "Sucesso!",
        description: "Você agora faz parte do espaço compartilhado.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error || "Convite inválido ou expirado.",
      });
    }
  };

  const handleUpdateName = async () => {
    if (!householdName.trim()) return;

    setIsSaving(true);
    const success = await updateHouseholdName(householdName.trim());
    setIsSaving(false);

    if (success) {
      toast({
        title: "Nome atualizado!",
        description: "O nome do espaço foi alterado.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o nome.",
      });
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-bl from-background to-black border border-secondary shadow-[0_18px_45px_rgba(3,7,18,0.65)] p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-base sm:text-lg font-semibold">Espaço Compartilhado</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-bl from-background to-black border border-primary/30 shadow-[0_18px_45px_rgba(3,7,18,0.65)] p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <h2 className="text-base sm:text-lg font-semibold">Espaço Compartilhado</h2>
      </div>

      <p className="text-xs sm:text-sm text-muted-foreground mb-4">
        Gerencie suas finanças em casal. Convide seu parceiro(a) para visualizar e editar as mesmas transações.
      </p>

      {/* Household Name */}
      {household && (
        <div className="mb-6">
          <Label htmlFor="householdName" className="text-sm">Nome do espaço</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="householdName"
              value={householdName || household.name}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="Ex: Casa do João e Maria"
              className="bg-secondary/50 border-border/50"
            />
            <Button
              onClick={handleUpdateName}
              disabled={isSaving || !householdName.trim() || householdName === household.name}
              size="sm"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </div>
      )}

      {/* Members */}
      <div className="mb-6">
        <Label className="text-sm">Membros ({members.length})</Label>
        <div className="flex flex-wrap gap-3 mt-2">
          {members.map((member) => (
            <div
              key={member.user_id}
              className="flex items-center gap-2 bg-secondary/30 rounded-full px-3 py-1.5"
            >
              <Avatar className="w-6 h-6">
                <AvatarImage src={member.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-primary/20 text-primary">
                  {getInitials(member.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{member.full_name || "Usuário"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleGenerateInvite}
          disabled={isGenerating}
          className="bg-gradient-to-r from-primary to-green-600"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <UserPlus className="w-4 h-4 mr-2" />
          )}
          Convidar Parceiro(a)
        </Button>

        <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">
              Tenho um código
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Entrar em um espaço</DialogTitle>
              <DialogDescription>
                Digite o código de convite que você recebeu para se juntar ao espaço compartilhado.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Código do convite</Label>
                <Input
                  id="inviteCode"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Ex: A1B2C3D4"
                  className="bg-secondary/50 text-center text-lg tracking-widest"
                  maxLength={8}
                />
              </div>
              <Button
                onClick={handleAcceptInvite}
                disabled={isAccepting || !inviteCode.trim()}
                className="w-full bg-gradient-to-r from-primary to-green-600"
              >
                {isAccepting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Entrar no espaço
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Invites */}
      {invites.length > 0 && (
        <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/30">
          <Label className="text-sm text-primary">Convites ativos</Label>
          <div className="mt-2 space-y-2">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between bg-background/50 rounded-lg px-3 py-2"
              >
                <div>
                  <span className="font-mono text-lg tracking-widest">
                    {invite.invite_code.toUpperCase()}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Expira em {new Date(invite.expires_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopyCode(invite.invite_code.toUpperCase())}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HouseholdSection;
