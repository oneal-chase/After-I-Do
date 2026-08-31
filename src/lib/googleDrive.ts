// One-click Google Drive for non-technical couples (OAuth via Google Identity Services)
// No service account, no folder ID typing. Platform owner does one-time GCP setup (client ID),
// couples just click "Connect Drive" — we create their wedding folder automatically.

const GSI_SRC = "https://accounts.google.com/gsi/client";
const SCOPES = "https://www.googleapis.com/auth/drive.file";
const TOKEN_KEY = "google-drive-token";
const TOKEN_EXP_KEY = "google-drive-token-exp";
const FOLDER_KEY = "google-drive-folder-id";

type TokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
};

let gsiLoading: Promise<void> | null = null;

function loadGsi(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if ((window as unknown as { google?: unknown }).google) return Promise.resolve();
  if (gsiLoading) return gsiLoading;
  gsiLoading = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = GSI_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(s);
  });
  return gsiLoading;
}

export function getDriveToken(): { token: string; expiresAt: number } | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const exp = Number(localStorage.getItem(TOKEN_EXP_KEY) || 0);
    if (!token) return null;
    if (exp && Date.now() > exp - 60_000) return null; // 1min buffer
    return { token, expiresAt: exp };
  } catch { return null; }
}

export function clearDriveToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXP_KEY);
  } catch { /* ignore */ }
}

export function getDriveFolderId(): string | null {
  try { return localStorage.getItem(FOLDER_KEY); } catch { return null; }
}
export function setDriveFolderId(id: string): void {
  try { localStorage.setItem(FOLDER_KEY, id); } catch { /* ignore */ }
}

export async function requestDriveAccess(): Promise<string> {
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();
  if (!clientId) throw new Error("Google Drive not configured — ask the site owner to add VITE_GOOGLE_CLIENT_ID");

  await loadGsi();

  const google = (window as unknown as { google: { accounts: { oauth2: { initTokenClient: (c: unknown) => { requestAccessToken: () => void } } } } }).google;

  return new Promise<string>((resolve, reject) => {
    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: (resp: any) => {
          const r = resp as TokenResponse & { error?: string };
          if (r.error || !r.access_token) {
            reject(new Error(r.error || "Drive permission denied"));
            return;
          }
          const expiresAt = Date.now() + (r.expires_in || 3600) * 1000;
          try {
            localStorage.setItem(TOKEN_KEY, r.access_token);
            localStorage.setItem(TOKEN_EXP_KEY, String(expiresAt));
          } catch { /* ignore */ }
          resolve(r.access_token);
        },
        error_callback: (err: unknown) => reject(err instanceof Error ? err : new Error(String(err))),
      } as unknown);
      client.requestAccessToken();
    } catch (e) {
      reject(e instanceof Error ? e : new Error(String(e)));
    }
  });
}

async function driveFetch(path: string, token: string, init?: RequestInit): Promise<Response> {
  return fetch(`https://www.googleapis.com${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init?.headers || {}) },
  });
}

export async function ensureDriveFolder(token: string, name: string, parentId?: string | null): Promise<string> {
  const folderName = name.trim() || "Wedding Photos";
  // search
  const q = `'${(parentId || "root").replace(/'/g, "\\'")}' in parents and name='${folderName.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const list = await driveFetch(`/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true`, token);
  if (list.ok) {
    const data = await list.json() as { files?: { id: string }[] };
    if (data.files?.[0]?.id) return data.files[0].id;
  }
  const res = await driveFetch("/drive/v3/files?supportsAllDrives=true", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: folderName, mimeType: "application/vnd.google-apps.folder", parents: parentId ? [parentId] : undefined }),
  });
  const created = await res.json() as { id?: string; error?: unknown };
  if (!created.id) throw new Error(`Could not create Drive folder: ${JSON.stringify(created)}`);
  return created.id;
}

export async function uploadImageToDrive(opts: {
  token: string;
  weddingSlug: string;
  phaseName: string;
  imageBase64: string;
  driveFolderId?: string | null;
}): Promise<{ fileId: string; imageUrl: string }> {
  const { token, weddingSlug, phaseName, imageBase64 } = opts;
  let rootId = opts.driveFolderId || getDriveFolderId();
  if (!rootId) {
    // first time: create app root folder, then per-wedding folder
    const appRoot = await ensureDriveFolder(token, "Wedding Capture");
    rootId = await ensureDriveFolder(token, weddingSlug, appRoot);
    setDriveFolderId(rootId);
  } else {
    // ensure phase subfolder exists
    // rootId is already wedding folder
  }
  const phaseFolderId = await ensureDriveFolder(token, phaseName || "00_General", rootId);

  const b64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: "image/jpeg" });

  const metadata = { name: `PHOTO_${Date.now()}.jpg`, parents: [phaseFolderId] };
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("media", blob);

  const file = await driveFetch("/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id", token, {
    method: "POST",
    body: form,
  }).then((r) => r.json() as Promise<{ id?: string; error?: unknown }>);
  if (!file.id) throw new Error(`Drive upload failed: ${JSON.stringify(file)}`);

  await driveFetch(`/drive/v3/files/${file.id}/permissions?supportsAllDrives=true`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  }).catch(() => {});

  return { fileId: file.id!, imageUrl: `https://lh3.googleusercontent.com/d/${file.id}` };
}
