import { cn } from "@/lib/utils";

interface AppLogoProps {
  size?: number;
  className?: string;
  color?: string;
}

const AppLogo = ({ size = 32, className, color }: AppLogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
    >
      {/* Incomplete circle that morphs into upward arrow */}
      <path
        d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C16.268 4 9.59 8.732 6.5 15.5"
        stroke={color || "currentColor"}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrow tip pointing upward from the break */}
      <path
        d="M6.5 15.5L12 10M6.5 15.5L2 10"
        stroke={color || "currentColor"}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

export default AppLogo;
