'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

type Variant = 'lime' | 'blue' | 'outline' | 'ghost';
type Size    = 'sm'   | 'md';

const VARIANT: Record<Variant, string> = {
  lime:    'bg-[#D7F237] text-[#171717] hover:bg-[#c9e422] active:bg-[#b8cf1a] focus-visible:ring-[#D7F237]/50',
  blue:    'bg-[#1a73e8] text-white hover:bg-[#1558c0] active:bg-[#1044a0] focus-visible:ring-[#1a73e8]/50',
  outline: 'border border-[#3a3a3a] text-[#e5e5e5] hover:bg-[#1f1f1f] hover:border-[#4a4a4a] focus-visible:ring-white/20',
  ghost:   'text-[#9ca3af] hover:text-[#f0f0f0] hover:bg-[#1f1f1f] focus-visible:ring-white/20',
};

const SIZE: Record<Size, string> = {
  sm: 'h-8  px-4 text-xs',
  md: 'h-10 px-6 text-sm',
};

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold ' +
  'transition-colors duration-150 whitespace-nowrap shrink-0 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d] ' +
  'disabled:opacity-40 disabled:pointer-events-none';

export interface ButtonProps {
  variant?:    Variant;
  size?:       Size;
  href?:       string;
  disabled?:   boolean;
  type?:       'button' | 'submit' | 'reset';
  onClick?:    () => void;
  className?:  string;
  children:    ReactNode;
  'aria-label'?: string;
  title?:      string;
}

export default function Button({
  variant   = 'lime',
  size      = 'md',
  href,
  className = '',
  children,
  disabled,
  type      = 'button',
  onClick,
  ...rest
}: ButtonProps) {
  const cls = `${BASE} ${VARIANT[variant]} ${SIZE[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={cls} {...rest}>
      {children}
    </button>
  );
}
