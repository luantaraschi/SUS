export type BackgroundThemeConfig = {
  id: string;
  title: string;
  icon: string;
  enabled: boolean;
  comingSoon?: boolean;
};

export const BACKGROUND_THEMES: BackgroundThemeConfig[] = [
  { id: "classico", title: "Classico", icon: "star", enabled: true },
  { id: "futebol", title: "Futebol", icon: "football", enabled: false, comingSoon: true },
  { id: "area-da-saude", title: "Area da Saude", icon: "health", enabled: false, comingSoon: true },
  { id: "tecnologia", title: "Tecnologia", icon: "laptop", enabled: false, comingSoon: true },
  { id: "disney", title: "Disney", icon: "sparkles", enabled: false, comingSoon: true },
  { id: "harry-potter", title: "Harry Potter", icon: "bolt", enabled: false, comingSoon: true },
  { id: "naruto", title: "Naruto", icon: "leaf", enabled: false, comingSoon: true },
  { id: "valorant", title: "Valorant", icon: "target", enabled: false, comingSoon: true },
  { id: "league-of-legends", title: "League of Legends", icon: "swords", enabled: false, comingSoon: true },
  { id: "minecraft", title: "Minecraft", icon: "pickaxe", enabled: false, comingSoon: true },
  { id: "one-piece", title: "One Piece", icon: "skull", enabled: false, comingSoon: true },
  { id: "fortnite", title: "Fortnite", icon: "blaster", enabled: false, comingSoon: true },
  { id: "pokemon", title: "Pokemon", icon: "pokeball", enabled: false, comingSoon: true },
  { id: "star-wars", title: "Star Wars", icon: "lightsaber", enabled: false, comingSoon: true },
  { id: "game-of-thrones", title: "Game of Thrones", icon: "crown", enabled: false, comingSoon: true },
  { id: "jujutsu-kaisen", title: "Jujutsu Kaisen", icon: "fist", enabled: false, comingSoon: true },
  { id: "demon-slayer", title: "Demon Slayer", icon: "katana", enabled: false, comingSoon: true },
  { id: "friends", title: "Friends", icon: "coffee", enabled: false, comingSoon: true },
  { id: "clash", title: "Clash", icon: "shield", enabled: false, comingSoon: true },
];

export function getEnabledBackgroundTheme(themeId?: string) {
  return (
    BACKGROUND_THEMES.find((theme) => theme.id === themeId && theme.enabled) ??
    BACKGROUND_THEMES[0]
  );
}
