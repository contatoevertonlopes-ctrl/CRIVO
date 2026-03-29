/**
 * Landing.tsx — CRIVO public landing page
 * Route: /landing (or configure as / for unauthenticated users)
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart2,
  Check,
  CreditCard,
  LinkIcon,
  Menu,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserPlus,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePrices } from "@/hooks/usePrices";
import AppLogo from "@/components/AppLogo";

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

/** Reusable section badge pill */
const SectionBadge = ({
  children,
  light = false,
}: {
  children: React.ReactNode;
  light?: boolean;
}) => (
  <span
    className={cn(
      "inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-widest mb-4",
      light
        ? "bg-white/20 text-white"
        : "bg-[hsl(156,62%,49%)]/10 text-[hsl(156,83%,34%)]"
    )}
  >
    {children}
  </span>
);

/** Hook: adds `is-visible` class to .reveal elements via IntersectionObserver */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
const Landing = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const { prices, loading: pricesLoading, formatPrice } = usePrices();

  useScrollReveal();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    const offset = (navRef.current?.offsetHeight ?? 68) + 16;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: "smooth" });
  };

  const goToAuth = (tab?: string) => navigate(tab ? `/auth?tab=${tab}` : "/auth");

  return (
    <>
      <style>{`
        .reveal{opacity:0;transform:translateY(28px);transition:opacity .6s cubic-bezier(.4,0,.2,1),transform .6s cubic-bezier(.4,0,.2,1)}
        .reveal--right{transform:translateX(28px)}
        .reveal.is-visible{opacity:1;transform:translate(0,0)}
        @keyframes floatBadge{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .float-1{animation:floatBadge 3s ease-in-out infinite}
        .float-2{animation:floatBadge 3s ease-in-out infinite 1.5s}
        @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .slide-down{animation:slideDown .22s ease}
      `}</style>

      <div className="min-h-screen bg-[#F8F9FA] font-sans antialiased overflow-x-hidden">

        {/* ═══ NAVBAR ═══ */}
        <header
          ref={navRef}
          className={cn(
            "fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E5E7EB] transition-shadow duration-200",
            scrolled && "shadow-md"
          )}
        >
          <div className="max-w-6xl mx-auto px-6 h-[68px] flex items-center gap-8">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2.5 flex-shrink-0 hover:opacity-80 transition-opacity"
              aria-label="CRIVO — topo"
            >
              <AppLogo size={28} />
              <span className="text-lg font-bold tracking-[2px] uppercase text-[#1A2E4A]">
                CRIVO
              </span>
            </button>

            <nav className="hidden md:flex items-center gap-1 ml-auto" aria-label="Menu principal">
              {[
                { label: "Recursos", id: "features" },
                { label: "Planos", id: "plans" },
                { label: "Como funciona", id: "how" },
              ].map(({ label, id }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="px-3.5 py-1.5 text-[0.9375rem] font-medium text-[#6B7280] rounded-full
                             hover:text-[#1A2E4A] hover:bg-[#F3F4F6] transition-colors"
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              <Button variant="ghost" className="rounded-full font-semibold text-[#1A2E4A]" onClick={() => goToAuth()}>
                Entrar
              </Button>
              <Button
                className="rounded-full bg-[#1A2E4A] hover:bg-[#243d5e] text-white font-bold shadow-none
                           hover:shadow-[0_4px_20px_rgba(26,46,74,.25)] transition-all"
                onClick={() => goToAuth("register")}
              >
                Criar conta
              </Button>
            </div>

            <button
              className="md:hidden ml-auto p-2 rounded-lg hover:bg-[#F3F4F6] transition-colors"
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {menuOpen && (
            <div className="md:hidden slide-down border-t border-[#E5E7EB] bg-white px-6 pb-6 pt-4 flex flex-col gap-2">
              {[
                { label: "Recursos", id: "features" },
                { label: "Planos", id: "plans" },
                { label: "Como funciona", id: "how" },
              ].map(({ label, id }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="text-left px-3 py-2.5 text-base font-medium text-[#6B7280] rounded-lg
                             hover:bg-[#F3F4F6] hover:text-[#1A2E4A] transition-colors"
                >
                  {label}
                </button>
              ))}
              <div className="flex flex-col gap-2 mt-2">
                <Button variant="outline" className="w-full rounded-full font-semibold" onClick={() => goToAuth()}>
                  Entrar
                </Button>
                <Button
                  className="w-full rounded-full bg-[#1A2E4A] hover:bg-[#243d5e] text-white font-bold"
                  onClick={() => goToAuth("register")}
                >
                  Criar conta
                </Button>
              </div>
            </div>
          )}
        </header>

        <main>

          {/* ═══ HERO ═══ */}
          <section
            id="home"
            className="relative overflow-hidden pt-[calc(68px+80px)] pb-24
                       bg-gradient-to-br from-[#F8F9FA] to-[#EEF4F9]"
          >
            <div className="absolute -top-32 -right-24 w-[520px] h-[520px] rounded-full
                            bg-[#2ECC9A]/8 blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-16 -left-20 w-[320px] h-[320px] rounded-full
                            bg-[#1A2E4A]/5 blur-[80px] pointer-events-none" />

            <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 items-center gap-16 relative">
              <div className="reveal">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border
                                 border-[#2ECC9A]/30 text-[#0F9E6A] text-[0.8125rem] font-semibold
                                 rounded-full shadow-sm mb-6">
                  ✦ Passe pelo crivo.
                </span>

                <h1 className="text-[clamp(2.25rem,5.5vw,3.5rem)] font-bold leading-[1.1]
                               tracking-tight text-[#1A2E4A] mb-5">
                  Suas finanças,<br />
                  com{" "}
                  <span className="text-[#2ECC9A]">
                    clareza.
                  </span>{" "}
                  Sem ruído.
                </h1>

                <p className="text-lg text-[#6B7280] leading-relaxed mb-9 max-w-[480px]">
                  Filtre o que importa. Decida com inteligência. O CRIVO reúne gastos, cartões, metas
                  e relatórios — para você tomar decisões financeiras com confiança.
                </p>

                <div className="flex flex-wrap gap-3 mb-5">
                  <Button
                    size="lg"
                    className="rounded-xl bg-[#2ECC9A] hover:bg-[#25b889] text-[#1A2E4A] font-bold
                               hover:shadow-[0_4px_20px_rgba(46,204,154,.35)] transition-all gap-2"
                    onClick={() => goToAuth("register")}
                  >
                    Passe suas finanças pelo crivo <ArrowRight size={16} />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-xl border-[#1A2E4A] text-[#1A2E4A] hover:bg-[#1A2E4A]/5 font-semibold"
                    onClick={() => scrollTo("how")}
                  >
                    Ver como funciona
                  </Button>
                </div>

                <p className="text-[0.8125rem] text-[#9CB8D4]">
                  Sem cartão de crédito. Grátis para sempre no plano básico.
                </p>
              </div>

              <div className="reveal reveal--right relative flex justify-center">
                <DashboardPreview />
                <div className="float-1 absolute -bottom-4 -left-4 sm:-left-8
                                hidden sm:flex items-center gap-2 px-3.5 py-2
                                bg-white border border-[#E5E7EB] rounded-full shadow-md
                                text-[0.8125rem] font-semibold text-[#0F9E6A] whitespace-nowrap z-10">
                  <TrendingUp size={15} className="text-[#2ECC9A]" />
                  Clareza no controle
                </div>
                <div className="float-2 absolute top-6 -right-4 sm:-right-6
                                hidden sm:flex items-center gap-2 px-3.5 py-2
                                bg-white border border-[#E5E7EB] rounded-full shadow-md
                                text-[0.8125rem] font-semibold text-[#1A2E4A] whitespace-nowrap z-10">
                  <ShieldCheck size={15} className="text-[#1A2E4A]" />
                  Dados seguros
                </div>
              </div>
            </div>
          </section>

          {/* ═══ FEATURES ═══ */}
          <section id="features" className="py-24 bg-white">
            <div className="max-w-6xl mx-auto px-6">
              <div className="text-center max-w-xl mx-auto mb-16 reveal">
                <SectionBadge>Recursos</SectionBadge>
                <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-[#1A2E4A] leading-tight mb-4">
                  Tudo que você precisa<br />para filtrar o ruído financeiro
                </h2>
                <p className="text-[1.0625rem] text-[#6B7280] leading-relaxed">
                  Do lançamento manual à análise automática — o CRIVO cobre todo o ciclo financeiro.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {FEATURES.map((f, i) => (
                  <article
                    key={f.title}
                    className={cn(
                      "reveal border border-[#E5E7EB] rounded-2xl p-8 bg-white",
                      "hover:-translate-y-1 hover:shadow-lg hover:border-[#2ECC9A]/40 transition-all duration-200"
                    )}
                    style={{ transitionDelay: `${i * 80}ms` }}
                  >
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-5", f.iconBg)}>
                      <f.icon size={22} className={f.iconColor} />
                    </div>
                    <h3 className="text-[1.0625rem] font-bold text-[#1A2E4A] mb-2">{f.title}</h3>
                    <p className="text-[0.9375rem] text-[#6B7280] leading-relaxed">{f.desc}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* ═══ HOW IT WORKS ═══ */}
          <section id="how" className="py-24 bg-[#F8F9FA]">
            <div className="max-w-6xl mx-auto px-6">
              <div className="text-center max-w-xl mx-auto mb-16 reveal">
                <SectionBadge>Como funciona</SectionBadge>
                <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-[#1A2E4A] leading-tight">
                  Em 3 passos suas finanças<br />passam pelo crivo
                </h2>
              </div>

              <div className="flex flex-col md:flex-row items-start justify-center gap-4 md:gap-0">
                {STEPS.map((step, i) => (
                  <div key={step.title}>
                    <div
                      className="reveal flex-1 max-w-sm md:max-w-none text-center group"
                      style={{ transitionDelay: `${i * 120}ms` }}
                    >
                      <p className="text-[4rem] font-black text-[#2ECC9A]/20 leading-none mb-[-8px]
                                    group-hover:text-[#2ECC9A]/30 transition-colors">
                        0{i + 1}
                      </p>
                      <div className="border border-[#E5E7EB] rounded-2xl p-7 bg-white shadow-sm
                                      group-hover:-translate-y-1 group-hover:shadow-md transition-all duration-200">
                        <div className="w-12 h-12 bg-[#2ECC9A]/10 text-[#0F9E6A] rounded-xl
                                        flex items-center justify-center mx-auto mb-4">
                          <step.icon size={22} />
                        </div>
                        <h3 className="text-[1.0625rem] font-bold text-[#1A2E4A] mb-2">{step.title}</h3>
                        <p className="text-[0.9375rem] text-[#6B7280] leading-relaxed">{step.desc}</p>
                      </div>
                    </div>

                    {i < STEPS.length - 1 && (
                      <div
                        className="hidden md:block self-center mt-10 mx-3 flex-shrink-0
                                   w-14 h-0.5 opacity-60"
                        style={{
                          background:
                            "repeating-linear-gradient(90deg,#2ECC9A 0,#2ECC9A 6px,transparent 6px,transparent 12px)",
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══ PLANS ═══ */}
          <section id="plans" className="py-24 bg-white">
            <div className="max-w-6xl mx-auto px-6">
              <div className="text-center max-w-xl mx-auto mb-16 reveal">
                <SectionBadge>Planos</SectionBadge>
                <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-[#1A2E4A] leading-tight mb-4">
                  Simples e transparente
                </h2>
                <p className="text-[1.0625rem] text-[#6B7280]">
                  Comece grátis. Faça upgrade quando precisar de mais.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 items-start">
                {buildPlans(prices, formatPrice, pricesLoading).map((plan, i) => (
                  <div
                    key={plan.name}
                    className={cn(
                      "reveal relative rounded-3xl p-9 border transition-all duration-200",
                      plan.featured
                        ? "bg-[#1A2E4A] border-transparent text-white shadow-[0_12px_40px_rgba(26,46,74,.35)] md:scale-[1.03]"
                        : "bg-white border-[#E5E7EB] shadow-sm hover:-translate-y-1 hover:shadow-lg"
                    )}
                    style={{ transitionDelay: `${i * 80}ms` }}
                  >
                    {plan.featured && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#2ECC9A]
                                       text-[#1A2E4A] text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                        Mais popular
                      </span>
                    )}

                    <p className={cn("text-sm font-semibold mb-2", plan.featured ? "text-[#9CB8D4]" : "text-[#6B7280]")}>
                      {plan.name}
                    </p>

                    <div className="flex items-baseline gap-1 mb-1">
                      {pricesLoading && plan.priceType !== "free" ? (
                        <span className="h-12 w-28 rounded-lg bg-[#E5E7EB] animate-pulse inline-block" />
                      ) : (
                        <>
                          <span className={cn("text-lg font-bold", plan.featured ? "text-[#9CB8D4]" : "text-[#6B7280]")}>R$</span>
                          <span className={cn("text-5xl font-extrabold tracking-tight leading-none",
                            plan.featured ? "text-white" : "text-[#1A2E4A]")}>
                            {plan.price}
                          </span>
                          <span className={cn("text-sm", plan.featured ? "text-[#9CB8D4]" : "text-[#6B7280]")}>
                            {plan.period}
                          </span>
                        </>
                      )}
                    </div>

                    {plan.subLabel && (
                      <p className={cn("text-xs mb-6", plan.featured ? "text-[#2ECC9A]" : "text-[#0F9E6A] font-medium")}>
                        {pricesLoading ? (
                          <span className="h-3 w-40 rounded bg-[#E5E7EB] animate-pulse inline-block" />
                        ) : plan.subLabel}
                      </p>
                    )}
                    {!plan.subLabel && <div className="mb-6" />}

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((f) => (
                        <li key={f} className={cn("flex items-center gap-2.5 text-[0.9375rem]",
                          plan.featured ? "text-white/90" : "text-[#6B7280]")}>
                          <Check size={15} className={plan.featured ? "text-[#2ECC9A]" : "text-[#0F9E6A]"} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={cn(
                        "w-full rounded-xl font-bold transition-all",
                        plan.featured
                          ? "bg-[#2ECC9A] text-[#1A2E4A] hover:bg-[#25b889]"
                          : "border-[#1A2E4A] text-[#1A2E4A] hover:bg-[#1A2E4A]/5"
                      )}
                      variant={plan.featured ? "default" : "outline"}
                      onClick={() => goToAuth("register")}
                    >
                      {plan.cta}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══ CTA FINAL ═══ */}
          <section className="py-24 bg-[#F8F9FA]">
            <div className="max-w-6xl mx-auto px-6">
              <div className="reveal relative overflow-hidden rounded-3xl
                              bg-[#1A2E4A]
                              text-center px-8 py-20
                              shadow-[0_20px_60px_rgba(26,46,74,.35)]">

                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full
                                bg-[#2ECC9A]/8 pointer-events-none" />

                <SectionBadge light>Comece hoje</SectionBadge>
                <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold text-white leading-tight mb-4">
                  Seus próximos 12 meses<br />
                  podem ser completamente diferentes.
                </h2>
                <p className="text-[1.0625rem] text-[#9CB8D4] leading-relaxed mb-10">
                  Decida agora ter mais clareza, mais controle e mais paz.<br />
                  É grátis para começar. Passe pelo crivo.
                </p>
                <Button
                  size="lg"
                  className="rounded-xl bg-[#2ECC9A] text-[#1A2E4A] hover:bg-[#25b889] font-bold gap-2
                             shadow-none hover:shadow-[0_4px_20px_rgba(46,204,154,.3)] transition-all"
                  onClick={() => goToAuth("register")}
                >
                  Criar conta gratuita <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          </section>

        </main>

        {/* ═══ FOOTER ═══ */}
        <footer className="bg-[#1A2E4A] text-[#9CB8D4] pt-16">
          <div className="max-w-6xl mx-auto px-6 pb-12 border-b border-white/8
                          grid md:grid-cols-[1fr_auto] gap-12">

            <div className="max-w-[280px]">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="flex items-center gap-2.5 hover:opacity-80 transition-opacity mb-3"
              >
                <AppLogo size={24} />
                <span className="text-lg font-bold tracking-[2px] uppercase text-white">
                  CRIVO
                </span>
              </button>
              <p className="text-[0.9375rem] text-[#9CB8D4] leading-relaxed">
                Passe pelo crivo. Clareza financeira para o dia a dia.
              </p>
            </div>

            <nav className="flex flex-wrap gap-12" aria-label="Links do footer">
              {FOOTER_LINKS.map((col) => (
                <div key={col.title} className="flex flex-col gap-2.5">
                  <h4 className="text-[0.8125rem] font-bold text-white uppercase tracking-widest mb-1">
                    {col.title}
                  </h4>
                  {col.links.map((link) =>
                    link.action ? (
                      <button
                        key={link.label}
                        onClick={link.action}
                        className="text-[0.9375rem] text-[#9CB8D4] hover:text-white text-left transition-colors"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <span key={link.label} className="text-[0.9375rem] text-[#9CB8D4] cursor-default">
                        {link.label}
                      </span>
                    )
                  )}
                </div>
              ))}
            </nav>
          </div>

          <div className="text-center py-6 text-[0.875rem] text-[#9CB8D4]/60">
            &copy; {new Date().getFullYear()} CRIVO. Todos os direitos reservados.
          </div>
        </footer>

      </div>
    </>
  );
};

export default Landing;

/* ─────────────────────────────────────────────
   Dashboard Preview component (hero visual)
───────────────────────────────────────────── */
const DashboardPreview = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 500); return () => clearTimeout(t); }, []);

  const bars = [45, 65, 50, 80, 60, 70, 55];

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[20px] shadow-2xl p-5
                    w-full max-w-[440px] relative z-[1]">

      <div className="flex items-center gap-1.5 mb-5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff6058]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
        <span className="ml-2 text-[0.6875rem] font-bold text-[#9CB8D4] tracking-[2px] uppercase">
          CRIVO
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {[
          { label: "Receitas", value: "R$ 8.540", trend: "▲ 12%", up: true, accent: true },
          { label: "Despesas", value: "R$ 3.210", trend: "▼ 4%", up: false, accent: false },
          { label: "Saldo", value: "R$ 5.330", trend: "▲ 20%", up: true, accent: false },
        ].map((m) => (
          <div
            key={m.label}
            className={cn(
              "rounded-xl p-3 border flex flex-col gap-1",
              m.accent ? "bg-[#EAFAF4] border-[#2ECC9A]/20" : "bg-[#F8F9FA] border-[#E5E7EB]"
            )}
          >
            <span className="text-[0.625rem] font-semibold uppercase tracking-widest text-[#6B7280]">
              {m.label}
            </span>
            <span className="text-[0.875rem] font-bold text-[#1A2E4A]">{m.value}</span>
            <span className={cn("text-[0.625rem] font-semibold", m.up ? "text-[#0F9E6A]" : "text-[#DC2626]")}>
              {m.trend}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl p-4 mb-4">
        <div className="flex items-end gap-1.5 h-[70px] mb-2">
          {bars.map((h, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-t transition-all duration-700 ease-out",
                i === 3 ? "bg-[#2ECC9A]" : "bg-[#E5E7EB]"
              )}
              style={{ height: mounted ? `${h}%` : "0%" }}
            />
          ))}
        </div>
        <div className="flex gap-1.5">
          {["Ago", "Set", "Out", "Nov", "Dez", "Jan", "Fev"].map((m) => (
            <span key={m} className="flex-1 text-center text-[0.5625rem] text-[#6B7280]">{m}</span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {[
          { dot: "bg-[#2ECC9A]", name: "Salário", amount: "+ R$ 5.000", positive: true },
          { dot: "bg-[#E5E7EB]", name: "Supermercado", amount: "- R$ 420", positive: false },
          { dot: "bg-[#E5E7EB]", name: "Netflix", amount: "- R$ 55", positive: false },
        ].map((tx) => (
          <div key={tx.name} className="flex items-center gap-2.5 px-2.5 py-2
                                        bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg">
            <span className={cn("w-2 h-2 rounded-full flex-shrink-0", tx.dot)} />
            <span className="flex-1 text-[0.8125rem] font-medium text-[#1A2E4A]">{tx.name}</span>
            <span className={cn("text-[0.8125rem] font-semibold",
              tx.positive ? "text-[#0F9E6A]" : "text-[#6B7280]")}>
              {tx.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Static data
───────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Wallet,
    iconBg: "bg-[#2ECC9A]/10",
    iconColor: "text-[#0F9E6A]",
    title: "Controle de gastos",
    desc: "Categorize e acompanhe cada centavo. Veja exatamente para onde seu dinheiro vai.",
  },
  {
    icon: BarChart2,
    iconBg: "bg-[#1A2E4A]/10",
    iconColor: "text-[#1A2E4A]",
    title: "Fluxo de caixa",
    desc: "Visualize entradas e saídas em gráficos por período. Antecipe tendências.",
  },
  {
    icon: CreditCard,
    iconBg: "bg-[#9CB8D4]/20",
    iconColor: "text-[#1A2E4A]",
    title: "Gestão de cartões",
    desc: "Limite, fatura e gastos de todos os seus cartões em um único painel.",
  },
  {
    icon: Sparkles,
    iconBg: "bg-[#2ECC9A]/10",
    iconColor: "text-[#2ECC9A]",
    title: "Relatórios inteligentes",
    desc: "Insights automáticos mensais sobre hábitos, metas e oportunidades de economia.",
  },
] as const;

const STEPS = [
  {
    icon: UserPlus,
    title: "Crie sua conta",
    desc: "Cadastre-se em menos de 2 minutos. Sem burocracia, sem cartão de crédito.",
  },
  {
    icon: LinkIcon,
    title: "Conecte suas contas",
    desc: "Conecte suas contas — o CRIVO cuida do resto.",
  },
  {
    icon: TrendingUp,
    title: "Tenha clareza",
    desc: "Visualize progresso, bata metas e tome decisões baseadas em dados reais.",
  },
] as const;

/* ─────────────────────────────────────────────
   Dynamic plan builder
───────────────────────────────────────────── */
interface PlanCard {
  name: string;
  priceType: "free" | "monthly" | "annual";
  price: string;
  period: string;
  subLabel?: string;
  featured: boolean;
  cta: string;
  features: readonly string[];
}

const FREE_FEATURES = [
  "Dashboard financeiro básico",
  "Até 50 transações/mês",
  "Relatórios simples",
  "1 conta bancária",
] as const;

const PRO_FEATURES = [
  "Importação ilimitada de CSV",
  "Modos Adaptativos Avançados",
  "Relatórios PDF profissionais",
  "Suporte prioritário",
  "Dashboard completo",
  "Contas ilimitadas",
  "Previsões de fluxo de caixa",
  "Backup automático na nuvem",
] as const;

const ANNUAL_FEATURES = [...PRO_FEATURES, "2 meses grátis"] as const;

function buildPlans(
  prices: ReturnType<typeof usePrices>["prices"],
  formatPrice: (n: number) => string,
  loading: boolean,
): PlanCard[] {
  const monthly = loading ? "--" : formatPrice(prices.monthly.amount);
  const annual  = loading ? "--" : formatPrice(prices.annual.amount);
  const monthlyEq = loading ? "--" : formatPrice(prices.annual.monthlyEquivalent);
  const savings = prices.annual.savings;

  return [
    {
      name: "Básico",
      priceType: "free",
      price: "0",
      period: "/mês",
      featured: false,
      cta: "Começar grátis",
      features: FREE_FEATURES,
    },
    {
      name: "Pro Mensal",
      priceType: "monthly",
      price: monthly,
      period: "/mês",
      featured: false,
      cta: "Assinar mensal",
      features: PRO_FEATURES,
    },
    {
      name: "Pro Anual",
      priceType: "annual",
      price: annual,
      period: "/ano",
      subLabel: loading ? undefined : `≈ R$ ${monthlyEq}/mês · Economize ${savings}%`,
      featured: true,
      cta: "Assinar anual",
      features: ANNUAL_FEATURES,
    },
  ];
}

const FOOTER_LINKS = [
  {
    title: "Produto",
    links: [
      { label: "Recursos", action: () => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }) },
      { label: "Planos", action: () => document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" }) },
      { label: "Como funciona", action: () => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" }) },
    ],
  },
  {
    title: "Conta",
    links: [
      { label: "Entrar", action: () => (window.location.href = "/auth") },
      { label: "Criar conta", action: () => (window.location.href = "/auth?tab=register") },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacidade" },
      { label: "Termos de uso" },
    ],
  },
] as const;
