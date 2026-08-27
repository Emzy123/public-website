import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how SINet collects, uses, and protects your personal information. Your privacy matters to us.',
  openGraph: {
    title: 'Privacy Policy | SINet',
    description: 'Learn how SINet collects, uses, and protects your personal information.',
  },
};

const EFFECTIVE_DATE = 'April 1, 2026';

const sections = [
  {
    id: '1',
    title: 'Information We Collect',
    content: (
      <>
        <p className="text-slate-600 leading-relaxed mb-4">We may collect personal information that you voluntarily provide to us when you:</p>
        <ul className="list-disc pl-6 text-slate-600 space-y-1 mb-4 text-sm leading-relaxed">
          <li>Submit inquiries through our contact form</li>
          <li>Join our waitlist</li>
          <li>Communicate with us via WhatsApp, email, or phone</li>
          <li>Express interest in investment opportunities</li>
        </ul>
        <p className="text-slate-600 leading-relaxed mb-4">This information may include: full name, email address, phone number, investment interest amount, how you heard about us, and any additional information you choose to provide.</p>
      </>
    ),
  },
  {
    id: '2',
    title: 'How We Use Your Information',
    content: (
      <ul className="list-disc pl-6 text-slate-600 space-y-1 text-sm leading-relaxed">
        <li>Respond to your inquiries and provide requested information</li>
        <li>Follow up on investment expressions of interest</li>
        <li>Send updates about SINet&apos;s activities, cycles, and opportunities</li>
        <li>Improve our website and services</li>
        <li>Comply with legal obligations</li>
      </ul>
    ),
  },
  {
    id: '3',
    title: 'How We Share Your Information',
    content: (
      <>
        <p className="text-slate-600 leading-relaxed mb-4">We do not sell, trade, or rent your personal information to third parties. We may share information with:</p>
        <ul className="list-disc pl-6 text-slate-600 space-y-2 text-sm leading-relaxed">
          <li><strong className="text-[#0d1a4a]">Service Providers:</strong> Third-party vendors who help us operate our website (e.g., Resend for email, Vercel for hosting)</li>
          <li><strong className="text-[#0d1a4a]">Legal Requirements:</strong> When required by law or to protect our rights</li>
          <li><strong className="text-[#0d1a4a]">With Your Consent:</strong> When you have given us permission to do so</li>
        </ul>
      </>
    ),
  },
  {
    id: '4',
    title: 'Data Security',
    content: (
      <p className="text-slate-600 leading-relaxed">We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure. We strive to protect your information but cannot guarantee absolute security.</p>
    ),
  },
  {
    id: '5',
    title: 'Your Rights',
    content: (
      <>
        <p className="text-slate-600 leading-relaxed mb-4">Depending on your location, you may have the right to:</p>
        <ul className="list-disc pl-6 text-slate-600 space-y-1 text-sm leading-relaxed mb-4">
          <li>Access the personal information we hold about you</li>
          <li>Request correction of inaccurate information</li>
          <li>Request deletion of your information</li>
          <li>Withdraw consent at any time</li>
          <li>Opt out of marketing communications</li>
        </ul>
        <p className="text-slate-600 text-sm">To exercise these rights, contact us at <a href="mailto:sinetworkinggobal@gmail.com" className="text-[#d9711b] hover:underline font-medium">sinetworkinggobal@gmail.com</a>.</p>
      </>
    ),
  },
  {
    id: '6',
    title: 'Data Retention',
    content: (
      <p className="text-slate-600 leading-relaxed">We retain your personal information only for as long as necessary to provide the requested service, meet legal obligations, resolve disputes, and enforce agreements. Marketing contact details are reviewed periodically and removed or anonymized when no longer needed; investment and application records may be retained longer where required by law.</p>
    ),
  },
  {
    id: '7',
    title: 'Nigeria Data Protection Act',
    content: (
      <p className="text-slate-600 leading-relaxed">SINet processes personal information in line with applicable Nigerian data-protection law, including the Nigeria Data Protection Act 2023. You can exercise your access, correction, deletion, objection, and consent-withdrawal rights by contacting our data-protection contact using the details below.</p>
    ),
  },
  {
    id: '8',
    title: "Children's Privacy",
    content: (
      <p className="text-slate-600 leading-relaxed">Our website is not intended for individuals under the age of 18. We do not knowingly collect personal information from minors.</p>
    ),
  },
  {
    id: '9',
    title: 'Changes to This Policy',
    content: (
      <p className="text-slate-600 leading-relaxed">We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page with an updated effective date.</p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="bg-[#0d1a4a] pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <span className="text-xs text-[#d9711b] uppercase tracking-[0.3em] font-semibold">Legal</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mt-3 mb-3">Privacy Policy</h1>
          <p className="text-slate-400 text-sm">Effective Date: {EFFECTIVE_DATE}</p>
        </div>
      </section>

      {/* Gold accent */}
      <div className="h-1 bg-gradient-to-r from-[#d9711b] via-[#eccb7c] to-[#d9711b]" />

      {/* Content */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          {/* Lead */}
          <p className="text-lg text-slate-700 leading-relaxed mb-12 pb-8 border-b border-slate-100">
            At SINet (Student Investment Network), we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
          </p>

          {/* Sections */}
          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.id} className="scroll-mt-24" id={`section-${section.id}`}>
                <h2 className="text-xl font-extrabold text-[#0d1a4a] mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#d9711b] flex items-center justify-center text-[#0d1a4a] text-sm font-extrabold flex-shrink-0">{section.id}</span>
                  {section.title}
                </h2>
                <div className="pl-11">{section.content}</div>
              </div>
            ))}

            {/* Contact section */}
            <div id="section-10" className="border-t border-slate-100 pt-10">
              <h2 className="text-xl font-extrabold text-[#0d1a4a] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#d9711b] flex items-center justify-center text-[#0d1a4a] text-sm font-extrabold flex-shrink-0">10</span>
                Contact Us
              </h2>
              <div className="pl-11">
                <p className="text-slate-600 leading-relaxed mb-4">If you have questions about this Privacy Policy or our data practices, please contact us:</p>
                <div className="bg-[#f6f2e8] rounded-2xl p-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-[#d9711b]">✉️</span>
                    <a href="mailto:sinetworkinggobal@gmail.com" className="text-[#0d1a4a] font-medium hover:text-[#d9711b] transition-colors">sinetworkinggobal@gmail.com</a>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-[#d9711b]">💬</span>
                    <a href="https://wa.me/2349028239706" target="_blank" rel="noopener noreferrer" className="text-[#0d1a4a] font-medium hover:text-[#d9711b] transition-colors">WhatsApp: 0902 823 9706</a>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-[#d9711b]">📍</span>
                    <span className="text-slate-600">Kogi State, Nigeria</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer nav */}
          <div className="mt-12 pt-8 border-t border-slate-100 flex flex-wrap gap-4">
            <Link href="/terms" className="text-sm font-semibold text-[#d9711b] hover:text-[#0d1a4a] transition-colors">
              Terms of Service →
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
