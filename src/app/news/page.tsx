import Link from 'next/link';

export const metadata = {
  title: 'News & Updates | SINet',
  description: 'Project milestones, announcements, and updates from SINet across agriculture, trade, and real estate.',
};

export default function NewsPage() {
  return (
    <div className="bg-[#f6f2e8] text-[#0d1a4a]">
      <section className="border-b border-[#0d1a4a]/20 px-4 py-14 xs:px-5 md:py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1180px]">
          <p className="font-data text-[11px] uppercase tracking-[.16em] text-[#d9711b]">News &amp; updates</p>
          <h1 className="mt-6 max-w-4xl font-editorial text-[clamp(2.75rem,8vw,5.5rem)] leading-[.86] tracking-[-.06em]">What we&apos;re working on.</h1>
          <p className="mt-9 max-w-2xl text-lg leading-8 text-[#554e43]">Ongoing projects, milestones, and announcements — published when there is something real to share.</p>
        </div>
      </section>
      <section className="mx-auto max-w-[800px] px-4 py-14 xs:px-5 md:py-20 lg:px-8">
        <div className="border border-dashed border-[#0d1a4a]/25 bg-white p-12 text-center">
          <p className="text-sm text-[#7b7263]">News posts will appear here as they are published through the admin content module.</p>
          <Link href="/contact" className="mt-6 inline-flex text-sm font-bold text-[#d9711b] hover:underline">Contact us for updates →</Link>
        </div>
      </section>
    </div>
  );
}
