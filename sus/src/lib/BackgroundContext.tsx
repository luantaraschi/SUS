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
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
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
  const profile = useQuery(api.profiles.current);
  const remotePreferences = useQuery(api.preferences.current);
  const updatePreferences = useMutation(api.preferences.update);

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

  const resolvedPreferences = useMemo<PreferencesState>(() => {
    if (!profile || remotePreferences === undefined || remotePreferences === null) {
      return preferences;
    }

    return {
      colorScheme: remotePreferences.colorScheme,
      themeId: getEnabledBackgroundTheme(remotePreferences.backgroundThemeId).id,
      backgroundAnimationEnabled: remotePreferences.backgroundAnimationEnabled,
    };
  }, [preferences, profile, remotePreferences]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(resolvedPreferences));
  }, [resolvedPreferences]);

  const persistPreferences = useCallback(
    (next: PreferencesState) => {
      setPreferences(next);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      }

      if (profile) {
        void updatePreferences({
          colorScheme: next.colorScheme,
          backgroundThemeId: next.themeId,
          backgroundAnimationEnabled: next.backgroundAnimationEnabled,
        });
      }
    },
    [profile, updatePreferences]
  );

  const flashInvalid = useCallback(() => {
    setVariant("invalid");
    window.setTimeout(() => setVariant("default"), 1200);
  }, []);

  const effectiveColorScheme =
    resolvedPreferences.colorScheme === "system"
      ? systemScheme
      : resolvedPreferences.colorScheme;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.colorScheme = effectiveColorScheme;
    root.dataset.themeId = resolvedPreferences.themeId;
    root.classList.toggle("dark", effectiveColorScheme === "dark");
    root.classList.toggle("light", effectiveColorScheme === "light");
  }, [effectiveColorScheme, resolvedPreferences.themeId]);

  const value = useMemo<BackgroundContextType>(
    () => ({
      variant,
      colorScheme: resolvedPreferences.colorScheme,
      effectiveColorScheme,
      themeId: resolvedPreferences.themeId,
      backgroundAnimationEnabled: resolvedPreferences.backgroundAnimationEnabled,
      themes: BACKGROUND_THEMES,
      setVariant,
      flashInvalid,
      setColorScheme: (scheme) =>
        persistPreferences({ ...resolvedPreferences, colorScheme: scheme }),
      setThemeId: (themeId) =>
        persistPreferences({
          ...resolvedPreferences,
          themeId: getEnabledBackgroundTheme(themeId).id,
        }),
      setBackgroundAnimationEnabled: (enabled) =>
        persistPreferences({ ...resolvedPreferences, backgroundAnimationEnabled: enabled }),
    }),
    [effectiveColorScheme, flashInvalid, persistPreferences, resolvedPreferences, variant]
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
