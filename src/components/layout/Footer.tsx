import React from 'react';
import Link from 'next/link';
import { socialLinks } from '@/lib/social';

export function Footer() {
  return (
    <footer className="bg-[#050D1A] py-16 text-slate-300 border-t border-slate-800">
      <div className="container mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Column 1: About */}
        <div>
          <h3 className="text-white text-xl font-bold mb-4 tracking-tighter">SINet</h3>
          <p className="text-sm leading-relaxed text-slate-400">
            Build Africa's future. Invest. Own. Grow. SINet is the premier Pan-African investment ecosystem platform dedicated to reshaping African wealth generation.
          </p>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h4 className="text-white font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-3 text-sm">
            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link href="/sectors" className="hover:text-white transition-colors">Our Empires</Link></li>
            <li><Link href="/academy" className="hover:text-white transition-colors">SINet Academy</Link></li>
            <li><Link href="/waitlist" className="hover:text-white transition-colors">Join Waitlist</Link></li>
          </ul>
        </div>

        {/* Column 3: Contact Info */}
        <div>
          <h4 className="text-white font-semibold mb-4">Contact Info</h4>
          <ul className="space-y-3 text-sm">
            <li><a href="mailto:contact@sinet.africa" className="hover:text-white transition-colors">contact@sinet.africa</a></li>
            <li>Lagos, Nigeria</li>
            <li><Link href="/contact" className="hover:text-white transition-colors">Contact Form</Link></li>
          </ul>
        </div>

        {/* Column 4: Social / Newsletter */}
        <div>
          <h4 className="text-white font-semibold mb-4">Connect With Us</h4>
          <div className="flex gap-4 mb-6">
            <a href={socialLinks.x} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors" aria-label="X">
              <span>X</span>
            </a>
            <a href={socialLinks.linkedIn} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors" aria-label="LinkedIn">
              <span>In</span>
            </a>
            <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors" aria-label="Facebook">
              <span>Fb</span>
            </a>
          </div>
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} SINet. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
