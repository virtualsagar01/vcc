import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '../src/index.css';

export const metadata: Metadata = {
  title: 'Virtual Card Nepal | Virtual Dollar Cards, Gift Cards & Top-ups',
  description: 'Premium virtual dollar cards, prepaid cards, gift cards and game top-ups in Nepal.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
