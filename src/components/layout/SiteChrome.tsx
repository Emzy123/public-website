import { headers } from 'next/headers';
import { isPreviewMode } from '@admin/lib/preview';
import { getCmsContent } from '@/lib/cms';
import { Header } from './Header';
import { Footer } from './Footer';
import { PreviewBanner } from './PreviewBanner';

export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = headers().get('x-pathname') ?? '';
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  const preview = isPreviewMode();
  const settings = await getCmsContent('site-settings');

  return (
    <>
      {preview && <PreviewBanner />}
      <Header
        navLinks={settings.navigation}
        whatsappUrl={settings.contact.whatsapp}
        stackOffset={preview}
        logoUrl={settings.logoUrl}
      />
      <main className={`flex-grow ${preview ? 'pt-10' : ''}`}>{children}</main>
      <Footer settings={settings} />
    </>
  );
}
