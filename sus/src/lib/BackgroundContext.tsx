"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

type BackgroundVariant = "default" | "valid" | "invalid";

interface BackgroundContextType {
  variant: BackgroundVariant;
  setVariant: (v: BackgroundVariant) => void;
  flashInvalid: () => void;
}

const BackgroundContext = createContext<BackgroundContextType>({
  variant: "default",
  setVariant: () => {},
  flashInvalid: () => {},
});

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [variant, setVariant] = useState<BackgroundVariant>("default");

  const flashInvalid = useCallback(() => {
    setVariant("invalid");
    setTimeout(() => setVariant("default"), 1200);
  }, []);

  return (
    <BackgroundContext.Provider value={{ variant, setVariant, flashInvalid }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  return useContext(BackgroundContext);
}
