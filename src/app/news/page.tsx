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
          <h1 className="mt-6 max-w-4xl font-editorial text-[clamp(2.75rem,8vw,5.5rem)] leading-[.86] tracking-[-.06em]">
            What we&apos;re working on.
          </h1>
          <p className="mt-9 max-w-2xl text-lg leading-8 text-[#554e43]">
            Project milestones and announcements — published when there is something substantive to share.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-[800px] px-4 py-14 xs:px-5 md:py-20 lg:px-8">
        <div className="border border-[#0d1a4a]/20 bg-white p-10 text-center xs:p-12">
          <p className="font-editorial text-2xl text-[#0d1a4a]">No public posts yet.</p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#7b7263]">
            We will publish updates here as projects across agriculture, trade &amp; distribution, and real estate
            reach clear milestones. For the latest, reach out directly.
          </p>
          <Link href="/contact" className="mt-8 inline-flex bg-[#0d1a4a] px-6 py-3 text-sm font-bold text-white hover:bg-[#d9711b]">
            Contact SINet
          </Link>
        </div>
      </section>
    </div>
  );
}
