import { type WeddingConfig, STORAGE_KEY, getDefaultConfig, slugify } from "../config/designTokens";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

// Supabase is the single source of truth. Nothing here touches localStorage.

export function isStorageConfigured(): boolean {
  return isSupabaseConfigured;
}

async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function saveWedding(config: WeddingConfig): Promise<void> {
  const slug = slugify(config.slug || config.coupleNames);
  const toSave: WeddingConfig = {
    ...config,
    slug,
    weddingId: config.weddingId || `${slug}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: config.createdAt || new Date().toISOString(),
  };

  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase not configured — cannot save wedding");
  }

  const ownerId = await currentUserId();
  const { error } = await supabase
    .from("weddings")
    .upsert(
      {
        slug,
        wedding_id: toSave.weddingId,
        owner_id: ownerId,
        couple_names: toSave.coupleNames,
        config: toSave,
        gas_endpoint: toSave.gasEndpoint || null,
        gas_token: toSave.gasToken || null,
        published: true,
      },
      { onConflict: "slug" },
    );
  if (error) throw new Error(`Save failed: ${error.message}`);
}

export async function loadWedding(slug: string): Promise<WeddingConfig | null> {
  const normalized = slugify(slug);
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from("weddings")
    .select("config")
    .eq("slug", normalized)
    .eq("published", true)
    .maybeSingle();
  if (error || !data?.config) return null;
  return { ...getDefaultConfig(), ...(data.config as WeddingConfig) } as WeddingConfig;
}

export async function loadWeddingForOwner(userId: string): Promise<WeddingConfig | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from("weddings")
    .select("config")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data?.config) return null;
  return { ...getDefaultConfig(), ...(data.config as WeddingConfig) } as WeddingConfig;
}

export async function slugExists(slug: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { data } = await supabase
    .from("weddings")
    .select("slug")
    .eq("slug", slugify(slug))
    .maybeSingle();
  return !!data;
}

export async function deleteWedding(slug: string): Promise<void> {
  const normalized = slugify(slug);
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase not configured");

  // RLS: deletes are allowed by 003/001 policies (owner or anon-permissive dev policies)
  const { error: photoErr } = await supabase.from("photos").delete().eq("wedding_slug", normalized);
  if (photoErr) console.warn("photos delete:", photoErr.message);

  const { error: weddingErr } = await supabase.from("weddings").delete().eq("slug", normalized);
  if (weddingErr) throw new Error(weddingErr.message);

  // Best-effort storage cleanup for this wedding's folder
  try {
    const { data: files } = await supabase.storage.from("wedding-photos").list(normalized, { limit: 100 });
    if (files?.length) {
      const paths: string[] = [];
      for (const f of files) {
        const { data: sub } = await supabase.storage.from("wedding-photos").list(`${normalized}/${f.name}`, { limit: 100 });
        if (sub?.length) {
          for (const s of sub) paths.push(`${normalized}/${f.name}/${s.name}`);
        } else {
          paths.push(`${normalized}/${f.name}`);
        }
      }
      if (paths.length) await supabase.storage.from("wedding-photos").remove(paths);
    }
  } catch { /* best effort */ }
}

export function getCurrentSlugFromPath(): string | null {
  const m = window.location.pathname.match(/^\/w\/([^/]+)/);
  return m ? slugify(m[1]) : null;
}

// Kept for import-compat during migration; no longer a data store.
export { STORAGE_KEY };
