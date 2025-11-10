import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Share Link - KOMPRÅRE',
  description: 'Vergelijk IKEA prijzen via een share link',
};

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
