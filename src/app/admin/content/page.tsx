import Link from 'next/link';
import { AdminShell } from '@admin/components/AdminShell';
import { getActiveCmsKeys } from '@admin/lib/cms/keys';

export default function AdminContentIndexPage() {
  const keys = getActiveCmsKeys();
  const groups = Array.from(new Set(keys.map((k) => k.group)));

  return (
    <AdminShell title="Content" description="Edit published site pages and settings">
      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#7b7263]">{group}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {keys
                .filter((k) => k.group === group)
                .map((item) => (
                  <Link
                    key={item.key}
                    href={`/admin/content/${item.key}`}
                    className="rounded-xl border border-[#e4dcc9] bg-white p-5 transition-colors hover:border-[#0d1a4a]"
                  >
                    <p className="font-semibold text-[#0d1a4a]">{item.label}</p>
                    <p className="mt-1 text-sm text-[#7b7263]">{item.description}</p>
                    <p className="mt-3 font-data text-[11px] uppercase tracking-wider text-[#d9711b]">
                      {item.previewPath} →
                    </p>
                  </Link>
                ))}
            </div>
          </section>
        ))}
      </div>
    </AdminShell>
  );
}
