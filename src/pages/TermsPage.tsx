import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-cream">
      <div className="flex items-center px-4 py-3 bg-navy text-cream">
        <Link to="/" className="p-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Back to home">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="flex-1 text-center font-display text-sm font-medium">Terms of Service</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 px-6 py-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-parchment p-6 md:p-8 shadow-lg shadow-navy/5">
          <div className="text-center border-b border-parchment pb-6 mb-6">
            <p className="font-display text-2xl text-navy">Terms of Service</p>
            <p className="font-body text-xs text-floral-slate mt-1">After I Do — Wedding Capture</p>
            <p className="font-body text-[11px] text-parchment mt-2">Effective: December 11, 2025 • Last updated: December 11, 2025</p>
          </div>

          <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 mb-6">
            <p className="font-body text-sm font-medium text-navy">In short</p>
            <p className="font-body text-xs text-floral-slate mt-1 leading-relaxed">
              After I Do provides a private link per wedding for guests to share photos + notes. You own your photos and wedding design. Be kind, don’t upload illegal or harassing content. We provide the service as-is.
            </p>
          </div>

          <div className="space-y-6 font-body text-sm text-floral-slate leading-relaxed">
            <section>
              <h2 className="font-display text-base text-navy mb-2">1. Acceptance</h2>
              <p>By creating a wedding, logging in, or as a guest submitting a photo/note, you agree to these Terms and our Privacy Policy.</p>
            </section>

            <section>
              <h2 className="font-display text-base text-navy mb-2">2. Eligibility &amp; accounts</h2>
              <p>You must be 13+ and able to form a contract. You are responsible for your login (email + per-wedding password or Google) and for the privacy of your slug link. Don’t share your Dashboard login.</p>
            </section>

            <section>
              <h2 className="font-display text-base text-navy mb-2">3. Your content</h2>
              <p>
                You and your guests own the photos and notes you submit. You grant After I Do a limited license to store, display (live wall), and deliver them for your wedding. You represent you have permission to share any photo (especially of guests). You can delete weddings/photos via the Dashboard or by emailing <a href="mailto:oneal.chase95@gmail.com" className="underline decoration-parchment hover:text-navy">oneal.chase95@gmail.com</a>.
              </p>
            </section>

            <section>
              <h2 className="font-display text-base text-navy mb-2">4. Acceptable use</h2>
              <ul className="list-disc ml-5 space-y-1 text-xs">
                <li>Don’t upload illegal, harassing, hateful, or non-consensual imagery.</li>
                <li>Don’t attempt to access another couple’s private slug or data.</li>
                <li>Don’t scrape or reverse-engineer the service.</li>
              </ul>
              <p className="mt-2 text-xs">We may moderate or remove content and suspend weddings that violate these rules.</p>
            </section>

            <section>
              <h2 className="font-display text-base text-navy mb-2">5. Google Drive (optional)</h2>
              <p>
                If you tap “Connect Google Drive,” you grant drive.file scope so we can create files we created in <span className="font-mono text-navy">My Drive / Wedding Capture</span>. We don’t read your existing Drive. You can disconnect at any time in your Dashboard or Google Account permissions.
              </p>
            </section>

            <section>
              <h2 className="font-display text-base text-navy mb-2">6. Service availability</h2>
              <p>We aim for high availability but do not guarantee uninterrupted service (venue Wi-Fi, device cameras, and third parties like Supabase/Google affect delivery). Offline capture queues photos and syncs when online.</p>
            </section>

            <section>
              <h2 className="font-display text-base text-navy mb-2">7. Disclaimer &amp; liability</h2>
              <p>The service is provided “as is” without warranties. To the extent permitted by law, After I Do’s liability is limited to the amount you paid for the service in the 12 months before the claim.</p>
            </section>

            <section>
              <h2 className="font-display text-base text-navy mb-2">8. Termination</h2>
              <p>You can delete your wedding at any time. We may suspend or terminate weddings that violate these Terms or harm the service.</p>
            </section>

            <section>
              <h2 className="font-display text-base text-navy mb-2">9. Changes</h2>
              <p>We’ll update the “Last updated” date for material changes. Continued use after changes means you accept them.</p>
            </section>

            <section>
              <h2 className="font-display text-base text-navy mb-2">10. Contact</h2>
              <p>
                After I Do — <a href="mailto:oneal.chase95@gmail.com" className="underline decoration-parchment hover:text-navy">oneal.chase95@gmail.com</a>
              </p>
            </section>

            <p className="font-body text-[11px] text-parchment border-t border-parchment pt-6">
              This template is for product use and not legal advice. Consider review by counsel.
            </p>
          </div>
        </div>

        <p className="font-body text-[11px] text-parchment text-center mt-6">
          <Link to="/privacy" className="underline decoration-parchment hover:text-navy">Privacy Policy</Link> · Questions? <a href="mailto:oneal.chase95@gmail.com" className="underline decoration-parchment hover:text-navy">oneal.chase95@gmail.com</a>
        </p>
      </div>
    </div>
  );
}
