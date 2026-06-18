import BuilderRoot from './BuilderRoot';

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  return <BuilderRoot appId={appId} />;
}
