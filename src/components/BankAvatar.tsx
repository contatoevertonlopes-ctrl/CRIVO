import { useState } from "react";
import { BANK_PRESETS } from "@/hooks/useBankAccounts";
import { BANK_LOGOS } from "@/lib/bankLogos";
import { useTheme } from "next-themes";

interface BankAvatarProps {
  /** The bank_name — used to look up the local SVG logo & brand color */
  bankName: string;
  /** Override color (e.g. from the account's own color field) */
  color?: string;
  size?: number;
  className?: string;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  if (normalized.length === 6) {
    return {
      r: parseInt(normalized.substring(0, 2), 16),
      g: parseInt(normalized.substring(2, 4), 16),
      b: parseInt(normalized.substring(4, 6), 16),
    };
  }
  return null;
}

function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255 > 0.55;
}

function getAccentColor(hex: string, isDark: boolean): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  if (isDark && luminance < 0.15) {
    const blend = (c: number) => Math.round(c * 0.35 + 255 * 0.65);
    return `rgb(${blend(rgb.r)}, ${blend(rgb.g)}, ${blend(rgb.b)})`;
  }
  return hex;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Fuzzy key lookup: exact → presetKey.startsWith(input) → input.startsWith(presetKey).
 * Handles cases like "C6" → "C6 Bank".
 */
function findPresetKey(keys: string[], input: string): string | undefined {
  const lower = input?.toLowerCase() ?? "";
  return (
    keys.find((k) => k.toLowerCase() === lower) ??
    keys.find((k) => k.toLowerCase().startsWith(lower)) ??
    keys.find((k) => lower.startsWith(k.toLowerCase()))
  );
}

/**
 * Displays a bank logo from local SVG assets with a graceful fallback to
 * a colored circle with the bank's initials.
 *
 * Light mode: white circle + original-colored logo
 * Dark mode:  brand-colored circle + white logo (CSS filter invert)
 */
const BankAvatar = ({ bankName, color, size = 36, className = "" }: BankAvatarProps) => {
  const [imgError, setImgError] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Fuzzy lookup: exact → presetKey.startsWith(input) → input.startsWith(presetKey)
  const presetKey = findPresetKey(Object.keys(BANK_PRESETS), bankName);
  const preset = presetKey ? BANK_PRESETS[presetKey] : undefined;

  const brandColor = color ?? preset?.color ?? "#6366f1";
  const accentDisplay = getAccentColor(brandColor, isDark);
  const textColor = isLightColor(brandColor) && !isDark ? "#111" : "#fff";

  // Fuzzy lookup for local SVG logo
  const logoKey = findPresetKey(Object.keys(BANK_LOGOS), bankName);
  const logoUrl = logoKey ? BANK_LOGOS[logoKey] : undefined;

  const sizeStyle = { width: size, height: size, minWidth: size };
  const iconSize = size * 0.62;

  // Show local logo if available and not errored
  if (logoUrl && !imgError) {
    return (
      <div
        className={`rounded-full overflow-hidden flex items-center justify-center shrink-0 ${className}`}
        style={{
          ...sizeStyle,
          backgroundColor: isDark ? accentDisplay : "#fff",
          border: isDark ? "none" : "1.5px solid hsl(var(--border) / 0.4)",
        }}
      >
        <img
          src={logoUrl}
          alt={bankName}
          onError={() => setImgError(true)}
          style={{
            width: iconSize,
            height: iconSize,
            objectFit: "contain",
            // In dark mode: make logo white so it shows on the colored background
            filter: isDark ? "brightness(0) invert(1)" : "none",
          }}
          draggable={false}
        />
      </div>
    );
  }

  // Fallback: colored circle with initials
  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 font-bold leading-none ${className}`}
      style={{
        ...sizeStyle,
        backgroundColor: accentDisplay,
        color: textColor,
        fontSize: size * 0.3,
      }}
    >
      {getInitials(bankName || "?")}
    </div>
  );
};

export default BankAvatar;
