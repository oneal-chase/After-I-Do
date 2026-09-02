export interface ColorTokens {
  cream: string;
  navy: string;
  floralSlate: string;
  mauve: string;
  gold: string;
  parchment: string;
}

export interface FontDef {
  name: string;
  googleName: string;
  fallback: string;
  stack: string;
}

export interface FontTokens {
  script: string;
  display: string;
  body: string;
}

export interface ImageTokens {
  monogram: string;
  background: string;
}

export interface WeddingConfig {
  onboardingComplete: boolean;
  weddingId: string;
  slug: string;
  createdAt: string;
  coupleNames: string;
  monogram: string;
  weddingDate: string;
  venue: string;
  timezone: string;
  colors: ColorTokens;
  fonts: FontTokens;
  images: ImageTokens;
  timeline: {
    id: string;
    name: string;
    folderName: string;
    start: string;
    end: string;
  }[];
  gasEndpoint: string;
  gasToken: string;
  consentAt?: string;
  privacyVersion?: string;
}

export const STORAGE_KEY = "wedding-config";

export const DEFAULT_COLORS: ColorTokens = {
  cream: "#FAF7F2", // Soft Cream
  navy: "#1A2530", // Midnight Ink
  floralSlate: "#2C3E50", // Deep Slate
  mauve: "#C59B9B",
  gold: "#C5A059", // Champagne Gold
  parchment: "#E8DEC8",
};

export const FONT_OPTIONS: FontDef[] = [
  {
    name: "Pinyon Script",
    googleName: "Pinyon+Script",
    fallback: "Great Vibes",
    stack: '"Pinyon Script", "Great Vibes", cursive',
  },
  {
    name: "Great Vibes",
    googleName: "Great+Vibes",
    fallback: "Dancing Script",
    stack: '"Great Vibes", "Dancing Script", cursive',
  },
  {
    name: "Dancing Script",
    googleName: "Dancing+Script",
    fallback: "Great Vibes",
    stack: '"Dancing Script", "Great Vibes", cursive',
  },
  {
    name: "Parisienne",
    googleName: "Parisienne",
    fallback: "Great Vibes",
    stack: '"Parisienne", "Great Vibes", cursive',
  },
  {
    name: "Sacramento",
    googleName: "Sacramento",
    fallback: "Pacifico",
    stack: '"Sacramento", "Pacifico", cursive',
  },
];

export const DISPLAY_FONT_OPTIONS: FontDef[] = [
  {
    name: "Cinzel",
    googleName: "Cinzel",
    fallback: "Cormorant Garamond",
    stack: '"Cinzel", "Cormorant Garamond", serif',
  },
  {
    name: "Cormorant Garamond",
    googleName: "Cormorant+Garamond",
    fallback: "EB Garamond",
    stack: '"Cormorant Garamond", "EB Garamond", serif',
  },
  {
    name: "Playfair Display",
    googleName: "Playfair+Display",
    fallback: "Cormorant Garamond",
    stack: '"Playfair Display", "Cormorant Garamond", serif',
  },
  {
    name: "Libre Baskerville",
    googleName: "Libre+Baskerville",
    fallback: "EB Garamond",
    stack: '"Libre Baskerville", "EB Garamond", serif',
  },
  {
    name: "EB Garamond",
    googleName: "EB+Garamond",
    fallback: "Cormorant Garamond",
    stack: '"EB Garamond", "Cormorant Garamond", serif',
  },
];

export const BODY_FONT_OPTIONS: FontDef[] = [
  {
    name: "Plus Jakarta Sans",
    googleName: "Plus+Jakarta+Sans",
    fallback: "Inter",
    stack: '"Plus Jakarta Sans", "Inter", sans-serif',
  },
  {
    name: "Inter",
    googleName: "Inter",
    fallback: "Montserrat",
    stack: '"Inter", "Montserrat", sans-serif',
  },
  {
    name: "Montserrat",
    googleName: "Montserrat",
    fallback: "Inter",
    stack: '"Montserrat", "Inter", sans-serif',
  },
  {
    name: "Lato",
    googleName: "Lato",
    fallback: "Montserrat",
    stack: '"Lato", "Montserrat", sans-serif',
  },
  {
    name: "Raleway",
    googleName: "Raleway",
    fallback: "Montserrat",
    stack: '"Raleway", "Montserrat", sans-serif',
  },
  {
    name: "Nunito Sans",
    googleName: "Nunito+Sans",
    fallback: "Inter",
    stack: '"Nunito Sans", "Inter", sans-serif',
  },
];

export interface PalettePreset {
  name: string;
  colors: ColorTokens;
}

export const PALETTE_PRESETS: PalettePreset[] = [
  {
    name: "Classic Navy & Gold",
    colors: {
      cream: "#FBF8F3",
      navy: "#1E2D3D",
      floralSlate: "#5B7B94",
      mauve: "#C59B9B",
      gold: "#C2A676",
      parchment: "#E8DEC8",
    },
  },
  {
    name: "Blush Garden",
    colors: {
      cream: "#FFF5F5",
      navy: "#2D1B2E",
      floralSlate: "#7A9E7E",
      mauve: "#E8A0BF",
      gold: "#D4A574",
      parchment: "#F0E4D7",
    },
  },
  {
    name: "Coastal Sunset",
    colors: {
      cream: "#FFF8F0",
      navy: "#1B3A4B",
      floralSlate: "#6B9AC4",
      mauve: "#E8998D",
      gold: "#D4A76A",
      parchment: "#F5E6D3",
    },
  },
  {
    name: "Forest Romance",
    colors: {
      cream: "#F5F5F0",
      navy: "#2C3E2D",
      floralSlate: "#5B7B6A",
      mauve: "#C4A882",
      gold: "#B8956A",
      parchment: "#E8E0D0",
    },
  },
  {
    name: "Dusty Rose",
    colors: {
      cream: "#FFF5F5",
      navy: "#3D2B3D",
      floralSlate: "#8B7D8B",
      mauve: "#D4A0A0",
      gold: "#C9A96E",
      parchment: "#F0E4E4",
    },
  },
  {
    name: "Modern Minimal",
    colors: {
      cream: "#FAFAFA",
      navy: "#1A1A2E",
      floralSlate: "#6C757D",
      mauve: "#ADB5BD",
      gold: "#C9B99A",
      parchment: "#E9ECEF",
    },
  },
  {
    name: "Tuscan Sun",
    colors: {
      cream: "#FFF8E7",
      navy: "#4A3728",
      floralSlate: "#8B6F4E",
      mauve: "#C9956B",
      gold: "#D4A745",
      parchment: "#F0E4C8",
    },
  },
  {
    name: "Midnight Garden",
    colors: {
      cream: "#F0F0F5",
      navy: "#1A1A3E",
      floralSlate: "#4A5899",
      mauve: "#9B7EB8",
      gold: "#C9A96E",
      parchment: "#E0DCE8",
    },
  },
];

export const DEFAULT_FONTS: FontTokens = {
  script: "Pinyon Script",
  display: "Cormorant Garamond",
  body: "Plus Jakarta Sans",
};

export const DEFAULT_TIMELINE = [
  { id: "pre-ceremony", name: "Pre-Ceremony", folderName: "00_Pre_Ceremony", start: "00:00", end: "17:00" },
  { id: "ceremony", name: "Ceremony", folderName: "01_Ceremony", start: "17:00", end: "18:00" },
  { id: "cocktail-hour", name: "Cocktail Hour", folderName: "02_Cocktail_Hour", start: "18:00", end: "19:30" },
  { id: "reception", name: "Reception Party", folderName: "03_Reception_Party", start: "19:30", end: "23:59" },
];

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "wedding";
}

export function makeWeddingId(slugBase: string): string {
  const rand = Math.random().toString(36).slice(2, 6);
  return `${slugBase || "wedding"}-${rand}`;
}

function normalizeSiteUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // bare domain like after-i-do.app -> https://after-i-do.app
  return `https://${trimmed}`;
}

export function getWeddingUrl(slug: string, path: string = "/camera"): string {
  const base = normalizeSiteUrl(import.meta.env.VITE_SITE_URL as string | undefined) || window.location.origin;
  const cleanSlug = slugify(slug);
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/$/, "")}/w/${cleanSlug}${cleanPath}`;
}

export function generateMonogram(names: string): string {
  return names
    .split(/[&+]/)
    .map((n) => n.trim().charAt(0).toUpperCase())
    .join(" ");
}

export function getDefaultConfig(): WeddingConfig {
  const baseSlug = slugify("Kendra & Diego");
  return {
    onboardingComplete: false,
    weddingId: makeWeddingId(baseSlug),
    slug: baseSlug,
    createdAt: new Date().toISOString(),
    coupleNames: "Kendra & Diego",
    monogram: "K D",
    weddingDate: "2026-09-11",
    venue: "The Starlight Garden • Spring, TX",
    timezone: "America/Chicago",
    colors: { ...DEFAULT_COLORS },
    fonts: { ...DEFAULT_FONTS },
    images: { monogram: "", background: "" },
    timeline: DEFAULT_TIMELINE.map((t) => ({ ...t })),
    gasEndpoint: import.meta.env.VITE_GAS_WEBHOOK_URL ?? "",
    gasToken: import.meta.env.VITE_GAS_TOKEN ?? "",
  };
}

export function getFontByName(name: string, type: "script" | "display" | "body"): FontDef {
  const options = type === "script" ? FONT_OPTIONS : type === "display" ? DISPLAY_FONT_OPTIONS : BODY_FONT_OPTIONS;
  return options.find((f) => f.name === name) ?? options[0];
}

export function getFontStack(name: string): string {
  const map: Record<string, string> = {
    "Pinyon Script": '"Pinyon Script", "Great Vibes", cursive',
    "Great Vibes": '"Great Vibes", "Dancing Script", cursive',
    "Dancing Script": '"Dancing Script", "Great Vibes", cursive',
    "Parisienne": '"Parisienne", "Great Vibes", cursive',
    "Sacramento": '"Sacramento", "Pacifico", cursive',
    "Cinzel": '"Cinzel", "Cormorant Garamond", serif',
    "Cormorant Garamond": '"Cormorant Garamond", "EB Garamond", serif',
    "Playfair Display": '"Playfair Display", "Cormorant Garamond", serif',
    "Libre Baskerville": '"Libre Baskerville", "EB Garamond", serif',
    "EB Garamond": '"EB Garamond", "Cormorant Garamond", serif',
    "Montserrat": '"Montserrat", "Inter", sans-serif',
    "Inter": '"Inter", "Montserrat", sans-serif',
    "Lato": '"Lato", "Montserrat", sans-serif',
    "Raleway": '"Raleway", "Montserrat", sans-serif',
    "Nunito Sans": '"Nunito Sans", "Inter", sans-serif',
  };
  return map[name] ?? `"${name}", sans-serif`;
}

export function buildGoogleFontsUrl(fonts: FontTokens): string {
  const script = getFontByName(fonts.script, "script");
  const display = getFontByName(fonts.display, "display");
  const body = getFontByName(fonts.body, "body");

  const families = [
    `${script.googleName}`,
    `${display.googleName}:wght@400;500;600;700`,
    `${body.googleName}:wght@300;400;500;600`,
  ];

  return `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f}`).join("&")}&display=swap`;
}

export function extractColorsFromImage(imageUrl: string): Promise<ColorTokens> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const size = 100;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      const pixels: [number, number, number][] = [];
      for (let i = 0; i < data.length; i += 16) {
        pixels.push([data[i], data[i + 1], data[i + 2]]);
      }

      const sorted = pixels.sort((a, b) => {
        const lumA = a[0] * 0.299 + a[1] * 0.587 + a[2] * 0.114;
        const lumB = b[0] * 0.299 + b[1] * 0.587 + b[2] * 0.114;
        return lumA - lumB;
      });

      const pick = (idx: number): string => {
        const p = sorted[Math.floor((idx / 6) * sorted.length)] ?? sorted[0];
        return `#${p[0].toString(16).padStart(2, "0")}${p[1].toString(16).padStart(2, "0")}${p[2].toString(16).padStart(2, "0")}`;
      };

      resolve({
        cream: pick(5),
        navy: pick(0),
        floralSlate: pick(2),
        mauve: pick(3),
        gold: pick(4),
        parchment: pick(1),
      });
    };
    img.onerror = () => resolve({ ...DEFAULT_COLORS });
    img.src = imageUrl;
  });
}
