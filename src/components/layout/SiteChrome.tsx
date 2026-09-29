import { headers } from 'next/headers';
import { isPreviewMode } from '@admin/lib/preview';
import { getCmsContent } from '@/lib/cms';
import { getPrimaryAdvert } from '@/lib/adverts/active';
import { Header } from './Header';
import { Footer } from './Footer';
import { PreviewBanner } from './PreviewBanner';
import { AdvertSpotlight } from './AdvertSpotlight';

export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = headers().get('x-pathname') ?? '';
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  const preview = isPreviewMode();
  const [settings, adverts] = await Promise.all([
    getCmsContent('site-settings'),
    getCmsContent('adverts'),
  ]);
  const primaryAdvert = getPrimaryAdvert(adverts);

  return (
    <>
      {preview && <PreviewBanner />}
      <Header
        whatsappUrl={settings.contact.whatsapp}
        stackOffset={preview}
        logoUrl={settings.logoUrl}
      />
      {primaryAdvert && <AdvertSpotlight advert={primaryAdvert} stackOffset={preview} />}
      <main className={`flex-grow ${preview ? 'pt-10' : ''}`}>{children}</main>
      <Footer settings={settings} />
    </>
  );
}
