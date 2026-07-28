'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="glass"
      enableSystem={false}
      themes={['glass', 'dark', 'light']}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
