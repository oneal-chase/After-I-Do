import { type WeddingConfig, STORAGE_KEY, getDefaultConfig, slugify } from "../config/designTokens";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

function weddingKey(slug: string): string {
  return `wedding:${slugify(slug)}`;
}

export function listLocalWeddings(): WeddingConfig[] {
  const out: WeddingConfig[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith("wedding:")) continue;
    try {
      const v = localStorage.getItem(k);
      if (v) out.push(JSON.parse(v) as WeddingConfig);
    } catch { /* ignore */ }
  }
  return out;
}

export async function saveWedding(config: WeddingConfig): Promise<void> {
  const slug = slugify(config.slug || config.coupleNames);
  const toSave: WeddingConfig = {
    ...config,
    slug,
    weddingId: config.weddingId || `${slug}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: config.createdAt || new Date().toISOString(),
  };
  localStorage.setItem(weddingKey(slug), JSON.stringify(toSave));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));

  // 1) Supabase (preferred, FOSS) — upsert by slug
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("weddings")
        .upsert(
          {
            slug,
            wedding_id: toSave.weddingId,
            owner_id: user?.id || null,
            couple_names: toSave.coupleNames,
            config: toSave,
            gas_endpoint: toSave.gasEndpoint || null,
            gas_token: toSave.gasToken || null,
            published: true,
          },
          { onConflict: "slug" },
        );
      if (!error) return;
    } catch { /* fall through to GAS/local */ }
  }

  // 2) Best-effort publish to master GAS sheet — no throw on failure
  if (toSave.gasEndpoint) {
    try {
      await fetch(toSave.gasEndpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "saveWedding",
          weddingId: toSave.weddingId,
          slug: toSave.slug,
          config: toSave,
          token: toSave.gasToken || undefined,
        }),
      });
    } catch { /* offline or GAS not supporting action — local is source of truth for now */ }
  }
}

export async function loadWedding(slug: string): Promise<WeddingConfig | null> {
  const key = weddingKey(slug);
  const normalized = slugify(slug);

  // 0) Supabase (preferred) — public read, no auth needed for published weddings
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("weddings")
        .select("config")
        .eq("slug", normalized)
        .eq("published", true)
        .maybeSingle();
      if (!error && data?.config) {
        const cfg = { ...getDefaultConfig(), ...(data.config as WeddingConfig) } as WeddingConfig;
        try { localStorage.setItem(key, JSON.stringify(cfg)); } catch { /* ignore */ }
        return cfg;
      }
    } catch { /* fall through */ }
  }

  // 1) local per-wedding
  try {
    const local = localStorage.getItem(key);
    if (local) return { ...getDefaultConfig(), ...JSON.parse(local) } as WeddingConfig;
  } catch { /* ignore */ }

  // 2) try master GAS fetch (if owner has published)
  const ownerRaw = localStorage.getItem(STORAGE_KEY);
  let endpoint = "";
  try {
    if (ownerRaw) {
      const owner = JSON.parse(ownerRaw) as WeddingConfig;
      if (slugify(owner.slug) === normalized) return { ...getDefaultConfig(), ...owner };
      endpoint = owner.gasEndpoint || (import.meta.env.VITE_GAS_WEBHOOK_URL as string) || "";
    } else {
      endpoint = (import.meta.env.VITE_GAS_WEBHOOK_URL as string) || "";
    }
  } catch { /* ignore */ }

  if (endpoint) {
    try {
      const resp = await fetch(`${endpoint}?action=getConfig&slug=${encodeURIComponent(normalized)}`);
      const data = await resp.json();
      if (data?.status === "success" && data.config) {
        const cfg = { ...getDefaultConfig(), ...data.config } as WeddingConfig;
        try { localStorage.setItem(key, JSON.stringify(cfg)); } catch { /* ignore */ }
        return cfg;
      }
    } catch { /* offline */ }
  }

  return null;
}

export function getCurrentSlugFromPath(): string | null {
  const m = window.location.pathname.match(/^\/w\/([^/]+)/);
  return m ? slugify(m[1]) : null;
}
