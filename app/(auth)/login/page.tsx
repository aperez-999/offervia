import LoginForm from "./_form";

export default async function LoginPage() {
  return (
    <main className="p-8 max-w-sm mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Login</h1>
      <LoginForm />
    </main>
  );
}
