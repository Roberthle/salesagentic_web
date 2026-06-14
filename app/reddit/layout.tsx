import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Social Poaching Hunter | SaleAgentic.ai',
  description: 'Search and monitor high-intent sales signals on Reddit, social channels, and community posts.',
  alternates: {
    canonical: '/reddit',
  },
  openGraph: {
    title: 'Social Poaching Hunter | SaleAgentic.ai',
    description: 'Search and monitor high-intent sales signals on Reddit, social channels, and community posts.',
    url: '/reddit',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Social Poaching Hunter | SaleAgentic.ai',
    description: 'Search and monitor high-intent sales signals on Reddit, social channels, and community posts.',
  },
};

export default function RedditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
