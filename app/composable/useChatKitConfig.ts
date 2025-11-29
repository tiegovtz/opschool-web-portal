export const CHATKIT_CONFIG = {
  STARTER_PROMPTS: [
    {
      label: "What can you do?",
      prompt: "What can you do?",
      icon: "circle-question",
    },
  ],
  PLACEHOLDER_INPUT: "Ask anything...",
  GREETING: "How can I help you today?",
};

export const getThemeConfig = (theme: 'light' | 'dark' = 'light') => ({
  color: {
    grayscale: {
      hue: 220,
      tint: 6,
      shade: theme === "dark" ? -1 : -4,
    },
    accent: {
      primary: theme === "dark" ? "#f1f5f9" : "#0f172a",
      level: 1,
    },
  },
  radius: "round",
});




