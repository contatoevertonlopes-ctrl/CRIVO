import { createContext, useContext, useState, ReactNode } from "react";

export type AppMode = "survival" | "prosperity";

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export const AppModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<AppMode>(() => {
    const saved = localStorage.getItem("appMode");
    return (saved as AppMode) || "prosperity";
  });

  const handleSetMode = (newMode: AppMode) => {
    setMode(newMode);
    localStorage.setItem("appMode", newMode);
  };

  const toggleMode = () => {
    const newMode = mode === "survival" ? "prosperity" : "survival";
    handleSetMode(newMode);
  };

  return (
    <AppModeContext.Provider value={{ mode, setMode: handleSetMode, toggleMode }}>
      {children}
    </AppModeContext.Provider>
  );
};

export const useAppMode = () => {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error("useAppMode must be used within AppModeProvider");
  }
  return context;
};
