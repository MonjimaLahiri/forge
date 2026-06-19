'use client';

import { useIdentity, displayNameFor } from '@/lib/useIdentity';

export default function Greeting() {
  const identity = useIdentity();

  if (identity.loading) {
    return <h1 className="text-xl font-semibold text-[#f0f0f0]">Hello!</h1>;
  }

  return (
    <h1 className="text-xl font-semibold text-[#f0f0f0]">
      Hello, {displayNameFor(identity)}!
    </h1>
  );
}
