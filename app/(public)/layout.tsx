import * as React from 'react';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between antialiased selection:bg-[#FF6500] selection:text-white">
      <main className="w-full max-w-4xl mx-auto px-4 flex-1">
        {children}
      </main>
    </div>
  );
}
