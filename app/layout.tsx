import './globals.css';

export const metadata = {
  title: 'SaleAgentic.ai | We Build Real Sales Pipeline in 7 Days',
  description: 'Your automated sales partner. Build a high-intent outbound B2B pipeline and get warm responses in 7 days. Start your risk-free trial today.',
  metadataBase: new URL('https://saleagentic.ai'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'SaleAgentic.ai | We Build Real Sales Pipeline in 7 Days',
    description: 'Your automated sales partner. Build a high-intent outbound B2B pipeline and get warm responses in 7 days. Start your risk-free trial today.',
    url: '/',
    siteName: 'SaleAgentic.ai',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SaleAgentic.ai | We Build Real Sales Pipeline in 7 Days',
    description: 'Your automated sales partner. Build a high-intent outbound B2B pipeline and get warm responses in 7 days. Start your risk-free trial today.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
