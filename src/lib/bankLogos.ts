/**
 * Local bank SVG logos.
 * Vite resolves these as hashed asset URLs automatically.
 * In dark mode, BankAvatar applies filter: brightness(0) invert(1) to make them white.
 */

import nubankLogo      from "@/bank-icons/Nu Pagamentos S.A/nubank-logo-2021.svg";
import interLogo       from "@/bank-icons/Banco Inter S.A/inter.svg";
import santanderLogo   from "@/bank-icons/Banco Santander Brasil S.A/banco-santander-logo.svg";
import bradescoLogo    from "@/bank-icons/Bradesco S.A/bradesco.svg";
import itauLogo        from "@/bank-icons/Itaú Unibanco S.A/itau.svg";
import bbLogo          from "@/bank-icons/Banco do Brasil S.A/banco-do-brasil-sem-fundo.svg";
import caixaLogo       from "@/bank-icons/Caixa Econômica Federal/caixa-economica-federal-1.svg";
import c6Logo          from "@/bank-icons/Banco C6 S.A/c6 bank.svg";
import picpayLogo      from "@/bank-icons/PicPay/Logo-PicPay.svg";
import mercadopagoLogo from "@/bank-icons/Mercado Pago/mercado-pago.svg";
import pagbankLogo     from "@/bank-icons/PagSeguro Internet S.A/logo-pagbank.svg";
import neonLogo        from "@/bank-icons/Neon/header-logo-neon.svg";
import originalLogo    from "@/bank-icons/Banco Original S.A/banco-original-logo-verde.svg";
import sicoobLogo      from "@/bank-icons/Sicoob/sicoob-vector-logo.svg";
import sicrediLogo     from "@/bank-icons/Sicredi/logo-svg2.svg";

/** Map of bank name (matches BANK_PRESETS keys) → local SVG asset URL */
export const BANK_LOGOS: Record<string, string> = {
  "Nubank":          nubankLogo,
  "Inter":           interLogo,
  "Santander":       santanderLogo,
  "Bradesco":        bradescoLogo,
  "Itaú":           itauLogo,
  "Banco do Brasil": bbLogo,
  "Caixa":           caixaLogo,
  "C6 Bank":         c6Logo,
  "PicPay":          picpayLogo,
  "Mercado Pago":    mercadopagoLogo,
  "PagBank":         pagbankLogo,
  "Neon":            neonLogo,
  "Original":        originalLogo,
  "Sicoob":          sicoobLogo,
  "Sicredi":         sicrediLogo,
};
