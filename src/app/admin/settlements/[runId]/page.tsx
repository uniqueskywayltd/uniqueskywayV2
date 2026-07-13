import { SettlementDetailPanel } from "@/features/admin/components/admin-system-panels";

interface PageProps {
  params: Promise<{ runId: string }>;
}

export default async function AdminSettlementDetailPage({ params }: PageProps) {
  const { runId } = await params;
  return <SettlementDetailPanel runId={runId} />;
}
