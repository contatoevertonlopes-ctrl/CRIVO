import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from "react";

export type AppMode = "survival" | "prosperity";

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export const AppModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<AppMode>(() => {
    const saved = localStorage.getItem("appMode");
    return (saved as AppMode) || "prosperity";
  });

  const setMode = useCallback((newMode: AppMode) => {
    setModeState(newMode);
    localStorage.setItem("appMode", newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const newMode = prev === "survival" ? "prosperity" : "survival";
      localStorage.setItem("appMode", newMode);
      return newMode;
    });
  }, []);

  const value = useMemo(
    () => ({ mode, setMode, toggleMode }),
    [mode, setMode, toggleMode]
  );

  return (
    <AppModeContext.Provider value={value}>
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
