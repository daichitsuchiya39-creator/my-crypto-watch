import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"] ,
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        panel: "#1e293b",
        accent: "#10b981",
        danger: "#f43f5e",
        highlight: "#f59e0b",
        muted: "#94a3b8",
      },
    },
  },
  plugins: [],
};

export default config;
