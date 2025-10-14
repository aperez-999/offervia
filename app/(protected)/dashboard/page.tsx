import { requireAuth } from "@/lib/auth";
import SignOutLink from "../signout";

export default async function DashboardPage() {
  await requireAuth();
  return (
    <main className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <SignOutLink />
      </div>
      <p className="text-sm text-gray-500">Welcome! You are authenticated.</p>
    </main>
  );
}
