'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import AppShell from '@/components/layout/AppShell';
import ThemeProvider from '@/components/providers/ThemeProvider';

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AppShell>
          {children}
        </AppShell>
      </ThemeProvider>
    </Provider>
  );
};

export default Providers;