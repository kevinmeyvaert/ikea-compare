import './global.css';

export const metadata = {
  title: 'KOMPRÅRE',
  description: 'Altijd de juiste GRÄBPRIS. Vergelijk IKEA prijzen snel en eenvoudig.',
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
