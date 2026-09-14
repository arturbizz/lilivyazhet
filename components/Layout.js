import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';
import { SITE_NAME } from '../lib/config';

export default function Layout({ children, title, description, wide = false, bare = false }) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — маркетплейс изделий ручной работы`;
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>{fullTitle}</title>
        <meta
          name="description"
          content={description || 'Изделия ручной работы от частных мастериц: игрушки, одежда, украшения и подарки.'}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <Header />
      <main className={bare ? 'flex-grow' : `flex-grow w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 ${wide ? 'max-w-[1400px]' : 'max-w-7xl'}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
