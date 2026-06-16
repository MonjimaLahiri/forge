import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  heading: string;
  subtext?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, heading, subtext, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <div className="mb-4 text-[#3a3a3a]" aria-hidden="true">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-[#6b7280]">{heading}</p>
      {subtext && <p className="mt-1 text-xs text-[#4b5563]">{subtext}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
