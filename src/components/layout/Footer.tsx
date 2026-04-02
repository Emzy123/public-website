import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#050D1A] text-slate-300 border-t border-slate-800">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {/* Brand */}
        <div className="lg:col-span-1">
          <Link href="/" className="inline-block mb-4">
            <Image
              src="/images/logo.jpg"
              alt="SINet Logo"
              width={130}
              height={44}
              className="object-contain h-11 w-auto"
            />
          </Link>
          <p className="text-sm leading-relaxed text-slate-400 mb-6">
            Build Africa's future. Invest in active goods trade with our structured 6-week investment cycles while co-owning Africa's next great institutions.
          </p>
          {/* Social icons */}
          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'WhatsApp', href: 'https://wa.me/2349028239706', icon: 'W' },
              { label: 'Instagram', href: 'https://instagram.com/sinet.africa', icon: 'IG' },
              { label: 'LinkedIn', href: 'https://linkedin.com/company/sinet-africa', icon: 'In' },
              { label: 'X', href: 'https://twitter.com/SINet_Africa', icon: 'X' },
              { label: 'Facebook', href: 'https://facebook.com/sinet.africa', icon: 'Fb' },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 hover:bg-[#D4AF37] hover:text-[#0A2342] hover:border-[#D4AF37] transition-all duration-200"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-widest">Platform</h4>
          <ul className="space-y-3 text-sm">
            {[
              { label: 'Home', href: '/' },
              { label: 'The SINet Blueprint', href: '/blueprint' },
              { label: 'The 5 Empires', href: '/empires' },
              { label: 'Investor Journey', href: '/investor-journey' },
              { label: 'Returns & Track Record', href: '/returns' },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-[#D4AF37] transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* More Links */}
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-widest">Company</h4>
          <ul className="space-y-3 text-sm">
            {[
              { label: 'Impact & Movement', href: '/impact' },
              { label: 'Transparency & FAQ', href: '/transparency' },
              { label: 'Connect With Us', href: '/connect' },
              { label: 'About SINet', href: '/about' },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-[#D4AF37] transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-widest">Contact</h4>
          <ul className="space-y-4 text-sm">
            <li>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">WhatsApp</p>
              <a href="https://wa.me/2349028239706" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] hover:text-[#F4D03F] font-medium transition-colors">
                0902 823 9706
              </a>
            </li>
            <li>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Call</p>
              <a href="tel:+2349164107049" className="hover:text-white transition-colors">
                0916 410 7049
              </a>
            </li>
            <li>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Email</p>
              <a href="mailto:sinetworkinggobal@gmail.com" className="hover:text-white transition-colors">
                sinetworkinggobal@gmail.com
              </a>
            </li>
            <li>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Location</p>
              <span>Kogi State, Nigeria</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>&copy; {currentYear} SINet. All rights reserved.</p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link href="/privacy" className="hover:text-[#D4AF37] transition-colors">Privacy Policy</Link>
            <span className="text-slate-700">·</span>
            <Link href="/terms" className="hover:text-[#D4AF37] transition-colors">Terms of Service</Link>
            <span className="text-slate-700">·</span>
            <p>Building Africa&apos;s next generation of owners.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
