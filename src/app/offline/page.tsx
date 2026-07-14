import { EmptyState } from "@/components/ui";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <EmptyState
        illustration="default"
        title="You are offline"
        description="Reconnect to continue using your account."
      />
    </main>
  );
}
