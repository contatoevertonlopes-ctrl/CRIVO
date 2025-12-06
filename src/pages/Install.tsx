import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Check, Share, Monitor } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if running on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);
    
    // Check if running on Mac
    const isMacDevice = /Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.userAgent) && !isIOSDevice;
    setIsMac(isMacDevice);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>App Instalado!</CardTitle>
            <CardDescription>
              O Club Finance Track já está instalado no seu dispositivo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Ir para o Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Instalar Club Finance Track</CardTitle>
          <CardDescription>
            Instale o app no seu dispositivo para acesso rápido e offline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isIOS ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Para instalar no iOS:
              </p>
              <ol className="text-sm space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-medium">1</span>
                  <span>Toque no botão <Share className="inline w-4 h-4" /> Compartilhar</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-medium">2</span>
                  <span>Role para baixo e toque em "Adicionar à Tela de Início"</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-medium">3</span>
                  <span>Toque em "Adicionar" no canto superior direito</span>
                </li>
              </ol>
            </div>
          ) : isMac ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Para instalar no Mac:
              </p>
              <ol className="text-sm space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-medium">1</span>
                  <span>Use o navegador <strong>Chrome</strong> ou <strong>Edge</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-medium">2</span>
                  <span>Clique no ícone <Monitor className="inline w-4 h-4" /> na barra de endereços</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-medium">3</span>
                  <span>Clique em "Instalar" na janela que aparecer</span>
                </li>
              </ol>
              {deferredPrompt && (
                <Button onClick={handleInstall} className="w-full" size="lg">
                  <Download className="w-4 h-4 mr-2" />
                  Instalar Agora
                </Button>
              )}
            </div>
          ) : deferredPrompt ? (
            <Button onClick={handleInstall} className="w-full" size="lg">
              <Download className="w-4 h-4 mr-2" />
              Instalar Agora
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              Use o menu do navegador para adicionar à tela inicial ou acesse pelo Chrome/Edge para a melhor experiência.
            </p>
          )}
          
          <Button variant="outline" onClick={() => navigate("/")} className="w-full">
            Continuar no Navegador
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
