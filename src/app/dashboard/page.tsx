import AppShell from '@/components/layout/AppShell';
import Button from '@/components/ui/Button';

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export default function DashboardPage() {
  const topBar = (
    <>
      <h1 className="text-xl font-semibold text-[#f0f0f0]">Hello, Alex!</h1>
      <Button href="/builder/new"><PlusIcon />Create New</Button>
    </>
  );

  return (
    <AppShell topBar={topBar}>
      <div className="px-8 py-8 space-y-8">
        <p className="text-sm text-[#6b7280] font-medium uppercase tracking-wider">Let&apos;s Get You Started</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left column */}
          <div className="space-y-5">
            {/* Guides card */}
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 flex gap-5 items-start">
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-[#f0f0f0]">Small Guides &amp; Tips</h2>
                <p className="mt-2 text-sm text-[#6b7280] leading-relaxed">
                  Learn how to build your first AI app in under five minutes. Start with a template or build from scratch.
                </p>
                <Button variant="outline" size="sm" className="mt-4">Check Resources</Button>
              </div>
              <div className="w-24 h-20 rounded-lg bg-[#1f1f1f] shrink-0 flex items-center justify-center" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
            </div>

            {/* Top picks card */}
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 flex gap-5 items-start">
              <div className="w-20 h-20 rounded-lg bg-[#1f1f1f] shrink-0 flex items-center justify-center" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-[#f0f0f0]">Explore Our Top Picks</h2>
                <p className="mt-2 text-sm text-[#6b7280] leading-relaxed">
                  Browse handpicked templates made for marketing, support, and ops teams.
                </p>
                <Button href="/discover" size="sm" className="mt-4">Explore</Button>
              </div>
            </div>
          </div>

          {/* Right column — Build from description */}
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
            {/* Decorative header strip */}
            <div className="h-14 bg-[#1a73e8]/10 border-b border-[#2a2a2a] flex items-center px-5 gap-3">
              <div className="w-5 h-5 rounded-full bg-[#1a73e8]/30" aria-hidden="true" />
              <div className="w-5 h-5 rounded-full bg-[#7c3aed]/30" aria-hidden="true" />
              <div className="w-5 h-5 rounded-full bg-[#0d9488]/30" aria-hidden="true" />
            </div>

            <div className="p-6">
              <h2 className="text-base font-semibold text-[#f0f0f0]">Build from Description</h2>
              <p className="mt-1 text-sm text-[#6b7280]">Describe your app and we&apos;ll generate a starting canvas for you.</p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <textarea
                  placeholder="Describe what you&apos;d like your app to do..."
                  disabled
                  rows={5}
                  className="col-span-1 resize-none rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] px-3 py-3 text-sm text-[#f0f0f0] placeholder-[#4b5563] focus:outline-none cursor-not-allowed opacity-60"
                />
                <div className="col-span-1 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] flex items-center justify-center">
                  <p className="text-xs text-[#4b5563] text-center px-3">Preview will appear here</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#d97706]/10 border border-[#d97706]/20">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span className="text-xs font-medium text-[#d97706]">Coming soon</span>
                </span>
                <Button variant="blue" size="sm" disabled title="Coming soon">Generate App</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
