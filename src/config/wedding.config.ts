export interface TimelinePhase {
  id: string;
  name: string;
  folderName: string;
  start: string;
  end: string;
}

export const WEDDING_CONFIG = {
  coupleNames: "Kendra & Diego",
  weddingDate: "2026-09-11",
  venue: "The Starlight Garden • Spring, TX",
  timezone: "America/Chicago",
  gasEndpoint: import.meta.env.VITE_GAS_WEBHOOK_URL ?? "",
  timeline: [
    {
      id: "pre-ceremony",
      name: "Pre-Ceremony",
      folderName: "00_Pre_Ceremony",
      start: "00:00",
      end: "17:00",
    },
    {
      id: "ceremony",
      name: "Ceremony",
      folderName: "01_Ceremony",
      start: "17:00",
      end: "18:00",
    },
    {
      id: "cocktail-hour",
      name: "Cocktail Hour",
      folderName: "02_Cocktail_Hour",
      start: "18:00",
      end: "19:30",
    },
    {
      id: "reception",
      name: "Reception Party",
      folderName: "03_Reception_Party",
      start: "19:30",
      end: "23:59",
    },
  ] satisfies TimelinePhase[],
} as const;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function getCurrentPhase(date: Date = new Date()): string {
  const opts: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: WEDDING_CONFIG.timezone,
  };
  const now = date.toLocaleTimeString("en-US", opts);
  const nowMinutes = timeToMinutes(now);

  for (const phase of WEDDING_CONFIG.timeline) {
    const start = timeToMinutes(phase.start);
    const end = timeToMinutes(phase.end);
    if (nowMinutes >= start && nowMinutes < end) {
      return phase.folderName;
    }
  }

  return WEDDING_CONFIG.timeline[0].folderName;
}

export function getPhaseDisplayName(folderName: string): string {
  const phase = WEDDING_CONFIG.timeline.find(
    (p) => p.folderName === folderName,
  );
  return phase?.name ?? "General";
}
