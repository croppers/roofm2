import React from 'react';
import DonateButton from './DonateButton';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">{children}</main>
      <footer className="py-6 flex justify-center">
        <DonateButton />
      </footer>
    </div>
  );
} 