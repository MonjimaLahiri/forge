import AppShell from '@/components/layout/AppShell';
import Greeting from '@/components/layout/Greeting';
import Button from '@/components/ui/Button';
import DiscoverClient from './DiscoverClient';
import { MOCK_TEMPLATES } from '@/lib/mock-data';

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export default function DiscoverPage() {
  const topBar = (
    <>
      <Greeting />
      <Button href="/builder/new"><PlusIcon />Create New</Button>
    </>
  );

  return (
    <AppShell topBar={topBar}>
      <DiscoverClient templates={MOCK_TEMPLATES} />
    </AppShell>
  );
}
