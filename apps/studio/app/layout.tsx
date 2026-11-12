import type {ReactNode} from 'react';

export const metadata = {title: 'HeyMariner Studio', description: 'Preview HeyMariner video specs'};

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html lang="en">
      <body style={{margin: 0, background: '#061223', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif'}}>{children}</body>
    </html>
  );
}
