/**
 * scripts/rebake-polaroids.cjs
 *
 * Re-bakes stored photos so their baked Polaroid geometry matches the current
 * format (equal top/side borders 5.5%, caption band 19%). Photos uploaded with
 * older geometries (flush-top, square, etc.) keep their baked borders, so this
 * extracts the inner square using the known geometry of their version and
 * re-composites it, uploading a fresh copy to Storage and updating the row.
 *
 * Run with the dev server up (module imports come from the running Vite app):
 *   npm run dev &            # localhost:5174
 *   NODE_PATH="$(pwd)/node_modules" node scripts/rebake-polaroids.cjs
 *
 * Detects version by card aspect ratio:
 *   0.9234 → flush-top   (photo y ∈ [0.0100, 0.8419] of card)
 *   0.8916 → equal-border (current — skipped)
 *   1.0    → raw square, no card (re-bake directly)
 */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1200, height: 800 } })).newPage();
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
  const result = await page.evaluate(async () => {
    const m = await import('/src/utils/frameProcessor.ts');
    const lib = await import('/src/lib/supabase.ts');
    const sb = lib.supabase;
    const { data: rows, error } = await sb.from('photos').select('*');
    if (error) return { error: error.message };
    const out = [];
    for (const row of rows) {
      try {
        const probe = await new Promise((res, rej) => {
          const i = new Image();
          i.onload = () => res({ w: i.naturalWidth, h: i.naturalHeight });
          i.onerror = rej;
          i.src = row.image_url;
        });
        const aspect = probe.w / probe.h;
        let fx0; let fy0; let fx1; let fy1;
        if (Math.abs(aspect - 0.9234) < 0.012) {
          fx0 = 0.0495; fy0 = 0.00998; fx1 = 0.9505; fy1 = 0.8419; // flush-top legacy
        } else if (Math.abs(aspect - 0.8916) < 0.012) {
          out.push({ id: row.id, skipped: 'already current geometry' });
          continue;
        } else if (Math.abs(aspect - 1.0) < 0.02) {
          fx0 = 0; fy0 = 0; fx1 = 1; fy1 = 1; // raw square
        } else {
          out.push({ id: row.id, skipped: 'unknown aspect ' + aspect.toFixed(4) });
          continue;
        }
        const resp = await fetch(row.image_url);
        const blob = await resp.blob();
        const bmp = await createImageBitmap(blob);
        const x0 = Math.round(fx0 * bmp.width);
        const y0 = Math.round(fy0 * bmp.height);
        const x1 = Math.round(fx1 * bmp.width);
        const y1 = Math.round(fy1 * bmp.height);
        const side = Math.min(x1 - x0, y1 - y0);
        if (side < 50) { out.push({ id: row.id, skipped: 'inner square too small' }); continue; }
        const c = document.createElement('canvas');
        c.width = side; c.height = side;
        c.getContext('2d').drawImage(bmp, x0, y0, side, side, 0, 0, side, side);
        const innerBlob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.92));
        const reBaked = await m.formatPolaroidImage(innerBlob);
        const path = `${row.wedding_slug}/${row.phase}/REBAKE_${Date.now()}_${row.id.slice(0, 6)}.jpg`;
        const bytes = new Uint8Array(await reBaked.arrayBuffer());
        const { error: upErr } = await sb.storage.from('wedding-photos').upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
        if (upErr) { out.push({ id: row.id, error: 'upload: ' + upErr.message }); continue; }
        const publicUrl = `${sb.supabaseUrl}/storage/v1/object/public/wedding-photos/${path}`;
        const { error: updErr } = await sb.from('photos')
          .update({ image_url: publicUrl, file_id: path })
          .eq('id', row.id);
        out.push({ id: row.id, ok: !updErr, err: updErr ? updErr.message : undefined, from: aspect.toFixed(3) });
      } catch (e) {
        out.push({ id: row.id, error: e.message });
      }
    }
    return { rows: out };
  });
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
