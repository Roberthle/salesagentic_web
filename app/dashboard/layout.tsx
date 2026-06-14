import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pipeline Dashboard | SaleAgentic.ai',
  description: 'Monitor your SaleAgentic AI outbound sales pipeline, leads telemetry, and deal scores.',
  alternates: {
    canonical: '/dashboard',
  },
  openGraph: {
    title: 'Pipeline Dashboard | SaleAgentic.ai',
    description: 'Monitor your SaleAgentic AI outbound sales pipeline, leads telemetry, and deal scores.',
    url: '/dashboard',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pipeline Dashboard | SaleAgentic.ai',
    description: 'Monitor your SaleAgentic AI outbound sales pipeline, leads telemetry, and deal scores.',
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
