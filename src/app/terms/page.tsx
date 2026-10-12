import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the terms and conditions governing your use of the SINet website and investment opportunities.',
  openGraph: {
    title: 'Terms of Service | SINet',
    description: 'Terms and conditions governing use of the SINet website and investment opportunities.',
  },
};

const EFFECTIVE_DATE = 'April 1, 2026';

export default function TermsPage() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="bg-[#0d1a4a] pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <span className="text-xs text-[#d9711b] uppercase tracking-[0.3em] font-semibold">Legal</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mt-3 mb-3">Terms of Service</h1>
          <p className="text-slate-400 text-sm">Effective Date: {EFFECTIVE_DATE}</p>
        </div>
      </section>
      <div className="h-1 bg-gradient-to-r from-[#d9711b] via-[#eccb7c] to-[#d9711b]" />

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          {/* Lead */}
          <p className="text-lg text-slate-700 leading-relaxed mb-8 pb-8 border-b border-slate-100">
            By accessing or using the SINet website (www.sinet.africa), you agree to be bound by these Terms of Service. If you do not agree, please do not use our website.
          </p>

          {/* Important disclaimer banner */}
          {/* Important disclaimer banner */}
          <div className="flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-12">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div>
              {/* TODO-VERIFY: CEO approval needed for disclaimer wording */}
              <p className="font-bold text-amber-800 mb-1">Important Notice</p>
              <p className="text-sm text-amber-700 leading-relaxed">
                SINet is a business ecosystem offering products, services, partnerships, and community membership — not primarily an investment platform. Content on this website is for educational and informational purposes. Participation in trade and commercial programs involves operational considerations; members and partners should review all terms carefully.
              </p>
            </div>
          </div>

          <div className="space-y-10">
            {[
              {
                // TODO-VERIFY: CEO approval needed for removal of 'Student Investment Network / connects investors / returns / investment model'
                n: '1', title: 'About SINet',
                body: (
                  <p className="text-slate-600 leading-relaxed text-sm">SINet is a student-driven business and commerce ecosystem connecting students, entrepreneurs, and partners across agriculture, trade &amp; distribution, and real estate. Our website provides information about our community programs, commercial initiatives, products, and partnership opportunities.</p>
                ),
              },
              {
                // TODO-VERIFY: CEO approval needed for legal/advisory scope wording
                n: '2', title: 'Informational Content',
                body: (
                  <p className="text-slate-600 leading-relaxed text-sm">Nothing on this website constitutes financial, investment, or legal advice. All information is provided &ldquo;as is&rdquo; without warranties of any kind. You are solely responsible for evaluating the merits and risks associated with any commercial or community opportunity. We encourage consulting with qualified professionals before making significant business decisions.</p>
                ),
              },
              {
                // TODO-VERIFY: CEO approval needed for 'Community & Program Participation' replacing 'Investment Participation'
                n: '3', title: 'Program & Community Participation',
                body: (
                  <>
                    <p className="text-slate-600 leading-relaxed text-sm mb-3">Participating in SINet programs, trade activities, or community initiatives requires mutual commitment and adherence to guidelines:</p>
                    <ul className="list-disc pl-6 text-slate-600 space-y-1 text-sm leading-relaxed">
                      <li>You acknowledge that you have read and understood our ecosystem model</li>
                      <li>You accept that commercial outcomes depend on real market conditions</li>
                      <li>You understand that past activity does not guarantee future results</li>
                      <li>You confirm that you participate willingly and in compliance with applicable laws</li>
                    </ul>
                  </>
                ),
              },
              {
                n: '4', title: 'Eligibility',
                body: (
                  <>
                    <p className="text-slate-600 leading-relaxed text-sm mb-3">To participate in SINet programs, commercial partnerships, or community initiatives, you must:</p>
                    <ul className="list-disc pl-6 text-slate-600 space-y-1 text-sm leading-relaxed">
                      <li>Be at least 18 years of age</li>
                      <li>Have the legal capacity to enter into binding agreements</li>
                      <li>Provide accurate and complete information</li>
                      <li>Not be located in a jurisdiction where such participation is prohibited</li>
                    </ul>
                  </>
                ),
              },
              {
                n: '5', title: 'Intellectual Property',
                body: (
                  <p className="text-slate-600 leading-relaxed text-sm">All content on this website, including text, graphics, logos, images, and software, is the property of SINet or its content suppliers and is protected by copyright and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our prior written consent.</p>
                ),
              },
              {
                // TODO-VERIFY: CEO approval needed for limitation of liability scope update
                n: '6', title: 'Limitation of Liability',
                body: (
                  <>
                    <p className="text-slate-600 leading-relaxed text-sm mb-3">To the maximum extent permitted by law, SINet and its founders, officers, employees, and affiliates shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from:</p>
                    <ul className="list-disc pl-6 text-slate-600 space-y-1 text-sm leading-relaxed">
                      <li>Your use of or inability to use the website</li>
                      <li>Any commercial decision made based on information from this website</li>
                      <li>Any business interruption or operational loss</li>
                      <li>Any errors or omissions in website content</li>
                    </ul>
                  </>
                ),
              },
              {
                n: '7', title: 'Third-Party Links',
                body: (
                  <p className="text-slate-600 leading-relaxed text-sm">Our website may contain links to third-party websites. We do not endorse or assume responsibility for the content or practices of these sites. You access them at your own risk.</p>
                ),
              },
              {
                n: '8', title: 'Termination',
                body: (
                  <p className="text-slate-600 leading-relaxed text-sm">We reserve the right to terminate or suspend access to our website at any time, without notice, for conduct that violates these Terms or is harmful to other users.</p>
                ),
              },
              {
                n: '9', title: 'Governing Law',
                body: (
                  <p className="text-slate-600 leading-relaxed text-sm">These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising from these Terms shall be resolved in the courts of Kogi State, Nigeria.</p>
                ),
              },
              {
                n: '10', title: 'Changes to Terms',
                body: (
                  <p className="text-slate-600 leading-relaxed text-sm">We may modify these Terms at any time. Continued use of the website after changes constitutes acceptance of the modified Terms.</p>
                ),
              },
            ].map((s) => (
              <div key={s.n} id={`section-${s.n}`}>
                <h2 className="text-xl font-extrabold text-[#0d1a4a] mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#d9711b] flex items-center justify-center text-[#0d1a4a] text-sm font-extrabold flex-shrink-0">{s.n}</span>
                  {s.title}
                </h2>
                <div className="pl-11">{s.body}</div>
              </div>
            ))}

            {/* Contact */}
            <div className="border-t border-slate-100 pt-10">
              <h2 className="text-xl font-extrabold text-[#0d1a4a] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#d9711b] flex items-center justify-center text-[#0d1a4a] text-sm font-extrabold flex-shrink-0">11</span>
                Contact Information
              </h2>
              <div className="pl-11">
                <p className="text-slate-600 text-sm mb-4">For questions about these Terms, please contact us:</p>
                <div className="bg-[#f6f2e8] rounded-2xl p-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-[#d9711b]">✉️</span>
                    <a href="mailto:sinetworkinggobal@gmail.com" className="text-[#0d1a4a] font-medium hover:text-[#d9711b] transition-colors">sinetworkinggobal@gmail.com</a>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-[#d9711b]">💬</span>
                    <a href="https://wa.me/2349028239706" target="_blank" rel="noopener noreferrer" className="text-[#0d1a4a] font-medium hover:text-[#d9711b] transition-colors">WhatsApp: 0902 823 9706</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer nav */}
          <div className="mt-12 pt-8 border-t border-slate-100 flex flex-wrap gap-4">
            <Link href="/privacy" className="text-sm font-semibold text-[#d9711b] hover:text-[#0d1a4a] transition-colors">
              Privacy Policy →
            </Link>
            <Link href="/transparency" className="text-sm text-slate-500 hover:text-[#0d1a4a] transition-colors">
              Transparency & FAQ
            </Link>
            <Link href="/connect" className="text-sm text-slate-500 hover:text-[#0d1a4a] transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
