import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PDF Upload - KOMPRÅRE',
  description: 'Upload een IKEA PDF om prijzen te vergelijken',
};

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
