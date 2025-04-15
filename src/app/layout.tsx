// app/layout.tsx
import React from 'react';

export const metadata = {
  title: 'My App',
  description: 'This is a sample layout for Next.js 15',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}