import { EmptyState } from "@/components/ui";

export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <EmptyState
        illustration="security"
        title="Maintenance in progress"
        description="Unique Sky Way is temporarily unavailable while maintenance is completed."
      />
    </main>
  );
}
