export const EXPO_TOKENS_TS = String.raw`export const colors = {
  gray: {
    0: "#ffffff",
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617"
  },
  accent: {
    50: "#eef2ff",
    100: "#e0e7ff",
    500: "#6366f1",
    600: "#4f46e5",
    700: "#4338ca"
  },
  semantic: {
    text: "#0f172a",
    textMuted: "#475569",
    surface: "#ffffff",
    surfaceMuted: "#f8fafc",
    border: "#e2e8f0",
    accent: "#4f46e5",
    success: "#15803d",
    warning: "#a16207",
    danger: "#b91c1c"
  }
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80
} as const;

export const radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  pill: 999
} as const;

export const typography = {
  fontFamily: "System",
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 21,
    "2xl": 26,
    "3xl": 34
  },
  lineHeight: {
    tight: 1.1,
    heading: 1.2,
    body: 1.5
  },
  weight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700"
  }
} as const;

export const motion = {
  duration: {
    fast: 160,
    normal: 260,
    slow: 420
  },
  reducedMotion: "respect-system-preference"
} as const;`;
