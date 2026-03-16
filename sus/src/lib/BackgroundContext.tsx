"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { BACKGROUND_THEMES, getEnabledBackgroundTheme } from "./backgroundThemes";

type BackgroundVariant = "default" | "valid" | "invalid";
type ColorScheme = "light" | "dark" | "system";

type PreferencesState = {
  colorScheme: ColorScheme;
  themeId: string;
  backgroundAnimationEnabled: boolean;
};

interface BackgroundContextType {
  variant: BackgroundVariant;
  colorScheme: ColorScheme;
  effectiveColorScheme: "light" | "dark";
  themeId: string;
  backgroundAnimationEnabled: boolean;
  themes: typeof BACKGROUND_THEMES;
  setVariant: (variant: BackgroundVariant) => void;
  flashInvalid: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setThemeId: (themeId: string) => void;
  setBackgroundAnimationEnabled: (enabled: boolean) => void;
  replacePreferences: (next: Partial<PreferencesState>) => void;
}

const LOCAL_STORAGE_KEY = "sus.preferences.v2";
const DEFAULT_PREFERENCES: PreferencesState = {
  colorScheme: "system",
  themeId: "classico",
  backgroundAnimationEnabled: true,
};

const BackgroundContext = createContext<BackgroundContextType>({
  variant: "default",
  colorScheme: "system",
  effectiveColorScheme: "light",
  themeId: "classico",
  backgroundAnimationEnabled: true,
  themes: BACKGROUND_THEMES,
  setVariant: () => undefined,
  flashInvalid: () => undefined,
  setColorScheme: () => undefined,
  setThemeId: () => undefined,
  setBackgroundAnimationEnabled: () => undefined,
  replacePreferences: () => undefined,
});

function readStoredPreferences(): PreferencesState {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PREFERENCES;
    }

    const parsed = JSON.parse(raw) as Partial<PreferencesState>;
    return {
      colorScheme:
        parsed.colorScheme === "light" ||
        parsed.colorScheme === "dark" ||
        parsed.colorScheme === "system"
          ? parsed.colorScheme
          : DEFAULT_PREFERENCES.colorScheme,
      themeId: getEnabledBackgroundTheme(parsed.themeId).id,
      backgroundAnimationEnabled:
        typeof parsed.backgroundAnimationEnabled === "boolean"
          ? parsed.backgroundAnimationEnabled
          : DEFAULT_PREFERENCES.backgroundAnimationEnabled,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [variant, setVariant] = useState<BackgroundVariant>("default");
  const [preferences, setPreferences] = useState<PreferencesState>(() => readStoredPreferences());
  const [systemScheme, setSystemScheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncScheme = () => setSystemScheme(media.matches ? "dark" : "light");
    syncScheme();
    media.addEventListener("change", syncScheme);
    return () => media.removeEventListener("change", syncScheme);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const persistPreferences = useCallback((next: PreferencesState) => {
    setPreferences(next);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
    }
  }, []);

  const replacePreferences = useCallback((next: Partial<PreferencesState>) => {
    setPreferences((current) => {
      const merged = {
        colorScheme:
          next.colorScheme === "light" ||
          next.colorScheme === "dark" ||
          next.colorScheme === "system"
            ? next.colorScheme
            : current.colorScheme,
        themeId: getEnabledBackgroundTheme(next.themeId ?? current.themeId).id,
        backgroundAnimationEnabled:
          typeof next.backgroundAnimationEnabled === "boolean"
            ? next.backgroundAnimationEnabled
            : current.backgroundAnimationEnabled,
      };

      if (typeof window !== "undefined") {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
      }

      return merged;
    });
  }, []);

  const flashInvalid = useCallback(() => {
    setVariant("invalid");
    window.setTimeout(() => setVariant("default"), 1200);
  }, []);

  const effectiveColorScheme =
    preferences.colorScheme === "system"
      ? systemScheme
      : preferences.colorScheme;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.colorScheme = effectiveColorScheme;
    root.dataset.themeId = preferences.themeId;
    root.classList.toggle("dark", effectiveColorScheme === "dark");
    root.classList.toggle("light", effectiveColorScheme === "light");
  }, [effectiveColorScheme, preferences.themeId]);

  const value = useMemo<BackgroundContextType>(
    () => ({
      variant,
      colorScheme: preferences.colorScheme,
      effectiveColorScheme,
      themeId: preferences.themeId,
      backgroundAnimationEnabled: preferences.backgroundAnimationEnabled,
      themes: BACKGROUND_THEMES,
      setVariant,
      flashInvalid,
      setColorScheme: (scheme) =>
        persistPreferences({ ...preferences, colorScheme: scheme }),
      setThemeId: (themeId) =>
        persistPreferences({
          ...preferences,
          themeId: getEnabledBackgroundTheme(themeId).id,
        }),
      setBackgroundAnimationEnabled: (enabled) =>
        persistPreferences({ ...preferences, backgroundAnimationEnabled: enabled }),
      replacePreferences,
    }),
    [effectiveColorScheme, flashInvalid, persistPreferences, preferences, replacePreferences, variant]
  );

  return (
    <BackgroundContext.Provider value={value}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  return useContext(BackgroundContext);
}
