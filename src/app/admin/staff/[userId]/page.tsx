import { StaffDetailPanel } from "@/features/admin/components/admin-system-panels";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function AdminStaffDetailPage({ params }: PageProps) {
  const { userId } = await params;
  return <StaffDetailPanel userId={userId} />;
}
