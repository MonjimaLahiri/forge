import type { ReactNode } from 'react';

interface TopBarProps {
  title: string;
  action?: ReactNode;
}

export default function TopBar({ title, action }: TopBarProps) {
  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-[#2a2a2a]">
      <h1 className="text-xl font-semibold text-[#f0f0f0]">{title}</h1>
      {action && <div>{action}</div>}
    </header>
  );
}
