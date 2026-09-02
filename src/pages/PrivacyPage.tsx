import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-cream">
      <div className="flex items-center px-4 py-3 bg-navy text-cream">
        <Link to="/" className="p-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Back to home">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="flex-1 text-center font-display text-sm font-medium">Privacy Policy</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 px-6 py-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-parchment p-6 md:p-8 shadow-lg shadow-navy/5">
          <div className="text-center border-b border-parchment pb-6 mb-6">
            <p className="font-display text-2xl text-navy">Privacy Policy</p>
            <p className="font-body text-xs text-floral-slate mt-1">After I Do — Wedding Capture</p>
            <p className="font-body text-[11px] text-parchment mt-2">Effective: December 11, 2025 • Last updated: December 11, 2025</p>
          </div>

          <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 mb-6">
            <p className="font-body text-sm font-medium text-navy">Summary</p>
            <p className="font-body text-xs text-floral-slate mt-1 leading-relaxed">
              After I Do helps couples collect guest photos + notes for their wedding via a private link. We store your wedding design, your account, and the photos guests choose to share. Guests don’t need an account. We don’t sell your data or show ads.
            </p>
          </div>

          <div className="space-y-6 font-body text-sm text-floral-slate leading-relaxed">
            <section>
              <h2 className="font-display text-base text-navy mb-2">1. Who we are</h2>
              <p>
                This service is operated by <span className="text-navy font-medium">After I Do</span>. Contact:{" "}
                <a href="mailto:privacy@afterido.co" className="underline decoration-parchment underline-offset-4 hover:text-navy">privacy@afterido.co</a>.
                If you are in the EU/UK, After I Do is the data controller for couple accounts and wedding content.
              </p>
            </section>

            <section>
              <h2 className="font-display text-base text-navy mb-2">2. What we collect</h2>
              <ul className="list-disc ml-5 space-y-1 text-xs">
                <li><span className="text-navy font-medium">Account:</span> email, password hash (or Google OAuth profile: email, name, avatar) when you create a wedding. We also store your slug, weddingId, and consent timestamp.</li>
                <li><span className="text-navy font-medium">Wedding design:</span> couple names, date, venue, timezone, colors, fonts, monogram/background images (base64 or URL), timeline phases, and site slug. Stored in Supabase <span className="font-mono text-navy">weddings</span> table and in your browser localStorage (wedding-config, wedding:slug) for offline use.</li>
                <li><span className="text-navy font-medium">Guest uploads (only if a guest chooses to):</span> Polaroid-stamped photo (JPEG), optional 280-character note, phase, wedding slug, timestamp. No audio is collected.</li>
                <li><span className="text-navy font-medium">Google Drive (optional):</span> if you tap “Connect Google Drive,” we request <span className="font-mono text-navy">drive.file</span> scope — we can only create files the app created (in <span className="font-mono">My Drive / Wedding Capture / your-slug</span>). We store an access token and expiry in localStorage (`google-drive-token`). We do not read your existing Drive files.</li>
                <li><span className="text-navy font-medium">Technical:</span> Supabase auth session cookies (`sb-*`), localStorage queue (`wedding-photo-queue`) for offline uploads, and anonymous storage logs.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-base text-navy mb-2">3. Why we use it</h2>
              <p>To create and host your private wedding link (<span className="font-mono text-navy">/w/your-slug</span>), theme the guest splash/camera in your colors/fonts, save guest photos to your Drive (if connected) and/or Supabase Storage, and show the live wall.</p>
            </section>

            <section>
              <h2 className="font-display text-base text-navy mb-2">4. Where it’s stored</h2>
              <p>
                Primary DB is Supabase (Postgres + Storage <span className="font-mono text-navy">wedding-photos</span> + Realtime) — see <span className="font-mono">supabase/migrations/</span>. If you connect Drive, a copy of each photo is also saved to your Google Drive via the Edge Function or direct GIS upload. Legacy Google Apps Script / Sheets is no longer required. Data is encrypted in transit (HTTPS) and at rest by Supabase/Google.
              </p>
            </section>

            <section>
              <h2 className="font-display text-base text-navy mb-2">5. Sharing</h2>
              <p>
                We share data only with service providers needed to run the app: Supabase (hosting), Google (if you connect Drive), Cloudflare/Vercel (hosting), and fonts.googleapis.com (display). We do not sell personal data, and we do not use your photos for ads or model training.
              </p>
            </section>

            <section>
              <h2 className="font-display text-base text-navy mb-2">6. Retention</h2>
              <p>
                Wedding config and photos are kept until you delete them in the Dashboard or request deletion at <a href="mailto:privacy@afterido.co" className="underline decoration-parchment hover:text-navy">privacy@afterido.co</a>. Local browser data can be cleared by clearing site data. Backups rotate per Supabase retention.
              </p>
            </section>

            <section>
              <h2 className="font-display text-base text-navy mb-2">7. Your rights</h2>
              <p>
                You can access, correct, export, or delete your wedding and photos at any time (Dashboard → Edit wedding / ask to delete). California residents have CCPA rights to know/delete/opt-out of sale (we don’t sell). EU/UK residents have GDPR rights to access, rectify, erase, restrict, and data portability. Contact us to exercise rights — we respond within 30 days.
              </p>
            </section>

            <section>
              <h2 className="font-display text-base text-navy mb-2">8. Cookies &amp; local storage</h2>
              <p>
                We use essential cookies/localStorage for login (Supabase <span className="font-mono">sb-*</span>), wedding config, and offline photo queue. No advertising cookies. You can block cookies, but login and offline capture will not work.
              </p>
            </section>

            <section>
              <h2 className="font-display text-base text-navy mb-2">9. Children</h2>
              <p>Guests should be 13+ or have parental permission. If you believe a child’s data was shared without consent, contact us for prompt removal.</p>
            </section>

            <section>
              <h2 className="font-display text-base text-navy mb-2">10. Changes</h2>
              <p>We’ll update this page and the “Last updated” date for material changes. Continued use after changes means you accept the updated policy.</p>
            </section>

            <p className="font-body text-[11px] text-parchment border-t border-parchment pt-6">
              This is a general product privacy policy and not legal advice. Consider review by counsel for your jurisdiction.
            </p>
          </div>
        </div>

        <p className="font-body text-[11px] text-parchment text-center mt-6">
          Questions? <a href="mailto:privacy@afterido.co" className="underline decoration-parchment hover:text-navy">privacy@afterido.co</a> · <Link to="/terms" className="underline decoration-parchment hover:text-navy">Terms of Service</Link>
        </p>
      </div>
    </div>
  );
}
