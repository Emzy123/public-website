import { headers } from 'next/headers';
import { isPreviewMode } from '@admin/lib/preview';
import { getCmsContent } from '@/lib/cms';
import { getPrimaryMergedAdvert } from '@/lib/adverts/active';
import { getOpenRegistrationLinkAdverts } from '@/lib/adverts/from-links';
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
  const [settings, adverts, linkAdverts] = await Promise.all([
    getCmsContent('site-settings'),
    getCmsContent('adverts'),
    getOpenRegistrationLinkAdverts(),
  ]);
  const primaryAdvert = getPrimaryMergedAdvert(adverts, linkAdverts);

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
