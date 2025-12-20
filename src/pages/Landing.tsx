import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Shield, Rocket, Sparkles, Upload, FileText, Brain, Lock, 
  Users, Clock, Check, ArrowRight, Play, TrendingUp, AlertTriangle,
  Twitter, Linkedin, Instagram, ChevronRight
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const [saldo, setSaldo] = useState("");
  const [gastoMensal, setGastoMensal] = useState("");

  const calcularRunway = () => {
    const s = parseFloat(saldo) || 0;
    const g = parseFloat(gastoMensal) || 1;
    return Math.floor(s / (g / 30));
  };

  const diasRunway = calcularRunway();
  const showResult = saldo && gastoMensal && parseFloat(gastoMensal) > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-green-600 flex items-center justify-center font-bold text-lg shadow-lg">
                F
              </div>
              <span className="font-semibold text-lg hidden sm:block">ClubFinanceTrack</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#modos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Modos</a>
              <a href="#funcionalidades" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Funcionalidades</a>
              <a href="#precos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Preços</a>
            </nav>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                Entrar
              </Button>
              <Button size="sm" onClick={() => navigate("/auth")} className="bg-gradient-to-r from-primary to-green-600">
                Começar Grátis
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-6">
                <Sparkles className="w-4 h-4" />
                <span>A 1ª ferramenta financeira adaptativa do Brasil</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Assuma o <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">controle total</span> do seu dinheiro
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                Saia do sufoco com o <strong className="text-survival-primary">Modo Sobrevivência</strong> ou 
                multiplique seu patrimônio com o <strong className="text-prosperity-primary">Modo Prosperidade</strong>.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/auth")}
                  className="bg-gradient-to-r from-primary to-green-600 shadow-[0_8px_30px_rgba(34,197,94,0.4)] hover:shadow-[0_8px_40px_rgba(34,197,94,0.5)] transition-all"
                >
                  Começar Gratuitamente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" size="lg" className="group">
                  <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  Ver Demonstração
                </Button>
              </div>
            </div>

            {/* Mockup Cards */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-prosperity-primary/20 blur-3xl opacity-30" />
              
              {/* Survival Widget Mock */}
              <div className="relative z-10 p-6 rounded-2xl bg-gradient-to-br from-survival-primary/20 to-survival-accent/10 border border-survival-primary/30 shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-8 h-8 text-survival-primary" />
                  <span className="font-semibold">Modo Sobrevivência</span>
                </div>
                <p className="text-4xl font-bold text-survival-primary mb-1">47 dias</p>
                <p className="text-sm text-muted-foreground">de oxigênio financeiro</p>
              </div>

              {/* Prosperity Widget Mock */}
              <div className="relative z-20 p-6 rounded-2xl bg-gradient-to-br from-prosperity-primary/20 to-prosperity-accent/10 border border-prosperity-primary/30 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500 -mt-8 ml-12">
                <div className="flex items-center gap-3 mb-4">
                  <Rocket className="w-8 h-8 text-prosperity-primary" />
                  <span className="font-semibold">Modo Prosperidade</span>
                </div>
                <p className="text-4xl font-bold text-prosperity-primary mb-1">32%</p>
                <p className="text-sm text-muted-foreground">taxa de liberdade financeira</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Simulator */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-secondary/30 to-background">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            ⏱️ Quanto tempo dura seu dinheiro?
          </h2>
          <p className="text-muted-foreground mb-8">
            Descubra em segundos sua reserva de sobrevivência
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Saldo Atual (R$)</label>
              <Input
                type="number"
                placeholder="5.000"
                value={saldo}
                onChange={(e) => setSaldo(e.target.value)}
                className="h-12 text-lg text-center bg-background"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Gasto Mensal (R$)</label>
              <Input
                type="number"
                placeholder="3.000"
                value={gastoMensal}
                onChange={(e) => setGastoMensal(e.target.value)}
                className="h-12 text-lg text-center bg-background"
              />
            </div>
          </div>

          {showResult && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 mb-6">
                <p className="text-muted-foreground mb-2">Sua reserva dura aproximadamente</p>
                <p className={`text-5xl font-bold mb-2 ${diasRunway < 30 ? "text-red-500" : diasRunway < 90 ? "text-amber-500" : "text-primary"}`}>
                  {diasRunway} dias
                </p>
                <p className="text-sm text-muted-foreground">
                  {diasRunway < 30 ? "Você precisa de um plano de ação urgente!" : 
                   diasRunway < 90 ? "Está no caminho certo, mas pode melhorar." : 
                   "Ótima reserva! Hora de pensar em investir."}
                </p>
              </div>
              
              <Button onClick={() => navigate("/auth")} className="bg-gradient-to-r from-primary to-green-600">
                Quer aumentar esse tempo? Clique aqui
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Choose Your Mode Section */}
      <section id="modos" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Escolha seu Modo
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Duas experiências únicas. Uma única plataforma. Mude quando quiser.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Survival Card */}
            <div className="group p-8 rounded-3xl border-2 border-survival-primary/30 bg-gradient-to-br from-survival-primary/10 to-survival-accent/5 hover:border-survival-primary/60 hover:shadow-[0_0_60px_rgba(0,149,199,0.2)] transition-all duration-500 cursor-pointer">
              <div className="w-16 h-16 rounded-2xl bg-survival-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8 text-survival-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Modo Sobrevivência</h3>
              <p className="text-muted-foreground mb-6">
                Foco total em sair das dívidas, cortar gastos supérfluos e construir sua reserva de emergência.
              </p>
              <ul className="space-y-3">
                {["Medidor de Dias de Oxigênio", "Alertas de gastos excessivos", "Simulador de corte de gastos", "Metas de quitação de dívidas"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-survival-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Prosperity Card */}
            <div className="group p-8 rounded-3xl border-2 border-prosperity-primary/30 bg-gradient-to-br from-prosperity-primary/10 to-prosperity-accent/5 hover:border-prosperity-primary/60 hover:shadow-[0_0_60px_rgba(168,148,75,0.2)] transition-all duration-500 cursor-pointer">
              <div className="w-16 h-16 rounded-2xl bg-prosperity-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Rocket className="w-8 h-8 text-prosperity-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Modo Prosperidade</h3>
              <p className="text-muted-foreground mb-6">
                Construa patrimônio, acompanhe investimentos e conquiste sua liberdade financeira.
              </p>
              <ul className="space-y-3">
                {["Taxa de Liberdade Financeira", "Metas de aporte mensal", "Projeção de patrimônio", "Dias de liberdade conquistados"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-prosperity-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="funcionalidades" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ferramentas poderosas para transformar sua vida financeira
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Upload, title: "Importação CSV Inteligente", description: "Chega de digitação. Importe extratos bancários em segundos." },
              { icon: FileText, title: "Relatórios PDF Profissionais", description: "Gere relatórios detalhados prontos para impressão." },
              { icon: Brain, title: "Categorização por IA", description: "Nossa IA aprende seus padrões e categoriza automaticamente." },
              { icon: Lock, title: "Segurança Bancária", description: "Criptografia de ponta. Seus dados nunca são compartilhados." },
              { icon: TrendingUp, title: "Gráficos em Tempo Real", description: "Visualize seu fluxo de caixa com gráficos interativos." },
              { icon: AlertTriangle, title: "Alertas Inteligentes", description: "Receba notificações quando algo sair do planejado." },
            ].map((feature) => (
              <div 
                key={feature.title}
                className="p-6 rounded-2xl bg-background border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center mb-16">
            <div>
              <p className="text-4xl font-bold text-primary mb-2">+5.000</p>
              <p className="text-muted-foreground">usuários ativos</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-2">+12.000</p>
              <p className="text-muted-foreground">horas economizadas</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-2">R$ 2M+</p>
              <p className="text-muted-foreground">gerenciados na plataforma</p>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              <span className="text-sm">SSL Seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm">LGPD Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="text-sm">Suporte 24/7</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Planos simples e transparentes
            </h2>
            <p className="text-muted-foreground">
              Comece grátis. Atualize quando precisar.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 rounded-3xl bg-background border border-border">
              <h3 className="text-xl font-bold mb-2">Essencial</h3>
              <p className="text-muted-foreground text-sm mb-6">Para começar sua jornada</p>
              <p className="text-4xl font-bold mb-6">
                R$ 0<span className="text-lg font-normal text-muted-foreground">/mês</span>
              </p>
              <ul className="space-y-3 mb-8">
                {["Até 100 transações/mês", "Dashboard completo", "Modo Sobrevivência", "Importação de CSV", "1 relatório PDF/mês"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>
                Começar Grátis
              </Button>
            </div>

            {/* Premium Plan */}
            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary">
              <div className="absolute -top-3 right-6 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                Mais Popular
              </div>
              <h3 className="text-xl font-bold mb-2">Premium</h3>
              <p className="text-muted-foreground text-sm mb-6">Para quem leva a sério</p>
              <p className="text-4xl font-bold mb-6">
                R$ 29<span className="text-lg font-normal text-muted-foreground">/mês</span>
              </p>
              <ul className="space-y-3 mb-8">
                {["Transações ilimitadas", "Modo Sobrevivência + Prosperidade", "Importação ilimitada", "Relatórios PDF ilimitados", "Categorização por IA", "Alertas inteligentes", "Suporte prioritário"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-gradient-to-r from-primary to-green-600" onClick={() => navigate("/auth")}>
                Começar Teste Grátis
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Pronto para transformar suas finanças?
          </h2>
          <p className="text-muted-foreground mb-8">
            Junte-se a milhares de pessoas que já assumiram o controle do seu dinheiro.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate("/auth")}
            className="bg-gradient-to-r from-primary to-green-600 shadow-[0_8px_30px_rgba(34,197,94,0.4)]"
          >
            Criar minha conta grátis
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-green-600 flex items-center justify-center font-bold">
                  F
                </div>
                <span className="font-semibold">ClubFinanceTrack</span>
              </div>
              <p className="text-sm text-muted-foreground">
                A ferramenta financeira adaptativa para todas as fases da sua vida.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#funcionalidades" className="hover:text-foreground transition-colors">Funcionalidades</a></li>
                <li><a href="#precos" className="hover:text-foreground transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Roadmap</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">LGPD</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Redes Sociais</h4>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} ClubFinanceTrack. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
