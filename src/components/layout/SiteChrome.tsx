import { headers } from 'next/headers';
import { isPreviewMode } from '@admin/lib/preview';
import { getCmsContent } from '@/lib/cms';
import { mergeAdvertSources } from '@/lib/adverts/active';
import { getOpenRegistrationLinkAdverts } from '@/lib/adverts/from-links';
import { Header } from './Header';
import { Footer } from './Footer';
import { PreviewBanner } from './PreviewBanner';
import { AdvertSpotlight } from './AdvertSpotlight';
import { isAdvertSuppressedRoute } from '@/lib/adverts/suppression';

export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = headers().get('x-pathname') ?? '';
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  const isSuppressed = isAdvertSuppressedRoute(pathname);
  const preview = isPreviewMode();
  const [settings, adverts, linkAdverts] = await Promise.all([
    getCmsContent('site-settings'),
    getCmsContent('adverts'),
    getOpenRegistrationLinkAdverts(),
  ]);
  const spotlightAdverts = mergeAdvertSources(adverts, linkAdverts);

  return (
    <>
      {preview && <PreviewBanner />}
      <Header
        whatsappUrl={settings.contact.whatsapp}
        stackOffset={preview}
        logoUrl={settings.logoUrl}
      />
      {!isSuppressed && spotlightAdverts.length > 0 && (
        <AdvertSpotlight adverts={spotlightAdverts} stackOffset={preview} />
      )}
      <main className={`flex-grow ${preview ? 'pt-10' : ''}`}>{children}</main>
      <Footer settings={settings} />
    </>
  );
}
