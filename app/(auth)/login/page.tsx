import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./_form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    // If already logged in, redirect via a client-side replace to avoid server redirect loops in dev
    return (
      <main className="p-8">
        <script dangerouslySetInnerHTML={{ __html: 'window.location.replace("/dashboard")' }} />
      </main>
    );
  }

  return (
    <main className="p-8 max-w-sm mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Login</h1>
      <LoginForm />
    </main>
  );
}
