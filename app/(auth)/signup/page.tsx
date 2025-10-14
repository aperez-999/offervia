import { getCurrentUser } from "@/lib/auth";
import SignupForm from "./_form";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) {
    return (
      <main className="p-8">
        <script dangerouslySetInnerHTML={{ __html: 'window.location.replace("/dashboard")' }} />
      </main>
    );
  }

  return (
    <main className="p-8 max-w-sm mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Create account</h1>
      <SignupForm />
    </main>
  );
}
