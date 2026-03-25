import React from 'react';

export function VisionStatement() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center border-l-4 border-r-4 border-blue-600 px-6 md:px-12 py-8 bg-blue-50 rounded-lg">
          <svg className="w-12 h-12 text-blue-400 mx-auto mb-6 opacity-50" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
          </svg>
          <blockquote className="text-2xl md:text-3xl font-medium text-slate-900 leading-snug">
            "Our vision is to democratise wealth creation across Africa, empowering the diaspora and local communities to securely own and grow profitable assets."
          </blockquote>
          <p className="mt-6 text-blue-800 font-semibold tracking-wide uppercase text-sm">
            — The SINet Founding Team
          </p>
        </div>
      </div>
    </section>
  );
}
