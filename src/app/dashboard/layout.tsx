import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { getCurrentUser } from "@/lib/auth";
import { isClerkEnabled } from "@/lib/env";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader user={user} clerkEnabled={isClerkEnabled} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
