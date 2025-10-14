import { requireAuth } from "@/lib/auth";
import SignOutLink from "../signout";

export default async function TrackerPage() {
  await requireAuth();
  return (
    <main className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Application Tracker</h1>
        <SignOutLink />
      </div>
      <p className="text-sm text-gray-500">Protected page.</p>
    </main>
  );
}
