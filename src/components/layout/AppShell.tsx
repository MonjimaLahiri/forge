import type { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface AppShellProps {
  topBar: ReactNode;
  children: ReactNode;
}

export default function AppShell({ topBar, children }: AppShellProps) {
  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />
      {/*
        Right column: fixed-height header zone + scrollable content.
        The header zone sits at the same DOM level as the sidebar logo section
        so both border-b lines share the same y-position.
      */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="h-[60px] shrink-0 flex items-center justify-between px-8 border-b border-[#2a2a2a] bg-[#0d0d0d]">
          {topBar}
        </div>
        <main className="flex-1 overflow-y-auto bg-[#0d0d0d]">
          {children}
        </main>
      </div>
    </div>
  );
}
