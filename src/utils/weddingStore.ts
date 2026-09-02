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

export async function deleteWedding(slug: string): Promise<void> {
  const normalized = slugify(slug);
  // local
  try {
    localStorage.removeItem(weddingKey(normalized));
    const curRaw = localStorage.getItem(STORAGE_KEY);
    if (curRaw) {
      const cur = JSON.parse(curRaw) as WeddingConfig;
      if (slugify(cur.slug) === normalized) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    // owner mapping
    const ownersRaw = localStorage.getItem("wedding-owners");
    if (ownersRaw) {
      const map = JSON.parse(ownersRaw) as Record<string, unknown>;
      if (map[normalized]) {
        delete map[normalized];
        localStorage.setItem("wedding-owners", JSON.stringify(map));
      }
    }
    const sessRaw = localStorage.getItem("wedding-session");
    if (sessRaw) {
      const sess = JSON.parse(sessRaw) as { slug?: string };
      if (sess.slug && slugify(sess.slug) === normalized) {
        localStorage.removeItem("wedding-session");
      }
    }
  } catch { /* ignore */ }

  // Supabase — best effort; RLS requires owner_id = auth.uid() for delete, so anon demo rows (owner_id null) need Dashboard SQL
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from("weddings").delete().eq("slug", normalized);
      if (error) console.warn("Supabase delete failed (need owner login or run SQL in Dashboard):", error.message);
      // also delete photos for this wedding
      await supabase.from("photos").delete().eq("wedding_slug", normalized).then(() => {});
      // try storage cleanup best-effort (requires service_role, ignore)
      try {
        const { data: files } = await supabase.storage.from("wedding-photos").list(normalized);
        if (files?.length) {
          const paths = files.map((f) => `${normalized}/${f.name}`);
          await supabase.storage.from("wedding-photos").remove(paths);
        }
      } catch { /* ignore */ }
    } catch { /* ignore */ }
  }
}

export function getCurrentSlugFromPath(): string | null {
  const m = window.location.pathname.match(/^\/w\/([^/]+)/);
  return m ? slugify(m[1]) : null;
}
