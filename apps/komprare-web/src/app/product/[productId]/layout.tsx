import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { productId: string };
}): Promise<Metadata> {
  return {
    title: `Product ${params.productId} - KOMPRÅRE`,
    description: `Vergelijk IKEA prijzen voor product ${params.productId}`,
  };
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
