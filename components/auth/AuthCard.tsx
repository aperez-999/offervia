"use client";

export default function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 text-center">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-gray-600">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}
