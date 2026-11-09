/**
 * Brand tokens for JavaScript / WebGL consumers.
 * CSS consumes the same values from `@theme` in globals.css — keep them in sync.
 *
 * 60% Ivory · 30% Emerald · 10% Vermilion. Emerald leads.
 */
export const brand = {
  ivory: {
    50: "#FBF9F3",
    100: "#F3EFE4", // brand ivory
    200: "#E9E3D3",
    300: "#DAD2BD",
    400: "#BFB59C",
  },
  emerald: {
    50: "#E8F7F1",
    100: "#CFF0E4",
    200: "#9FE0CA",
    300: "#5CC9A7",
    400: "#1FAE87",
    500: "#009473", // brand emerald
    600: "#007A5F",
    700: "#00614C",
    800: "#014A3A",
    900: "#023428",
    950: "#02211A",
    990: "#01130F",
  },
  vermilion: {
    100: "#FBE3DF",
    400: "#EC6A5A",
    500: "#E34234", // brand vermilion
    600: "#C7321F",
    700: "#A3271A",
  },
} as const;
