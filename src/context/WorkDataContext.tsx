import React, { createContext, useContext, ReactNode } from 'react';
import { useWorkData } from '../hooks/useWorkData';

type WorkDataContextType = ReturnType<typeof useWorkData>;

const WorkDataContext = createContext<WorkDataContextType | null>(null);

export function WorkDataProvider({ children }: { children: ReactNode }) {
  const value = useWorkData();
  return <WorkDataContext.Provider value={value}>{children}</WorkDataContext.Provider>;
}

export function useWorkDataContext() {
  const ctx = useContext(WorkDataContext);
  if (!ctx) throw new Error('useWorkDataContext must be used within WorkDataProvider');
  return ctx;
}
