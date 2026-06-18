import RuntimeRoot from './RuntimeRoot';

export default async function PublicAppPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  return <RuntimeRoot appId={appId} />;
}
