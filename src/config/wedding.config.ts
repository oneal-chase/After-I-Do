import { getDefaultConfig, type WeddingConfig } from "./designTokens";

function loadConfig(): WeddingConfig {
  try {
    const saved = localStorage.getItem("wedding-config");
    if (saved) {
      return { ...getDefaultConfig(), ...JSON.parse(saved) };
    }
  } catch { /* ignore */ }
  return getDefaultConfig();
}

export function getWeddingConfig(): WeddingConfig {
  return loadConfig();
}

export function getCurrentPhase(date: Date = new Date()): string {
  const config = getWeddingConfig();
  const opts: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: config.timezone,
  };
  const now = date.toLocaleTimeString("en-US", opts);
  const nowMinutes = timeToMinutes(now);

  for (const phase of config.timeline) {
    const start = timeToMinutes(phase.start);
    const end = timeToMinutes(phase.end);
    if (nowMinutes >= start && nowMinutes < end) {
      return phase.folderName;
    }
  }

  return config.timeline[0]?.folderName ?? "00_Pre_Ceremony";
}

export function getPhaseDisplayName(folderName: string): string {
  const config = getWeddingConfig();
  const phase = config.timeline.find((p) => p.folderName === folderName);
  return phase?.name ?? "General";
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export type { WeddingConfig };
