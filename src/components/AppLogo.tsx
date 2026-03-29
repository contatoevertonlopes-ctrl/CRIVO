import { cn } from "@/lib/utils";

interface AppLogoProps {
  size?: number;
  className?: string;
  color?: string;
}

/** CRIVO logo — 4×4 dot grid sieve icon */
const AppLogo = ({ size = 32, className }: AppLogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-label="CRIVO"
    >
      <rect width="512" height="512" rx="112" fill="#1A2E4A" />
      {/* Row 1: all dim */}
      <circle cx="148" cy="148" r="28" fill="white" opacity="0.2" />
      <circle cx="224" cy="148" r="28" fill="white" opacity="0.2" />
      <circle cx="300" cy="148" r="28" fill="white" opacity="0.2" />
      <circle cx="376" cy="148" r="28" fill="white" opacity="0.2" />
      {/* Row 2: 3 dim + 1 green */}
      <circle cx="148" cy="224" r="28" fill="white" opacity="0.2" />
      <circle cx="224" cy="224" r="28" fill="white" opacity="0.2" />
      <circle cx="300" cy="224" r="28" fill="white" opacity="0.2" />
      <circle cx="376" cy="224" r="28" fill="#2ECC9A" />
      {/* Row 3: 2 dim + 2 green */}
      <circle cx="148" cy="300" r="28" fill="white" opacity="0.2" />
      <circle cx="224" cy="300" r="28" fill="white" opacity="0.2" />
      <circle cx="300" cy="300" r="28" fill="#2ECC9A" />
      <circle cx="376" cy="300" r="28" fill="#2ECC9A" />
      {/* Row 4: all green */}
      <circle cx="148" cy="376" r="28" fill="#2ECC9A" />
      <circle cx="224" cy="376" r="28" fill="#2ECC9A" />
      <circle cx="300" cy="376" r="28" fill="#2ECC9A" />
      <circle cx="376" cy="376" r="28" fill="#2ECC9A" />
    </svg>
  );
};

export default AppLogo;
