"use client";

export default function BetaBanner() {
  return (
    <div className="mx-auto max-w-3xl px-4">
      <div className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-2 text-center shadow-sm">
        <p className="text-xs font-medium text-indigo-800">
          Offervia is currently in free Beta — core tools are free while we continue building Pro features.
        </p>
        <p className="mt-1 text-[11px] text-indigo-700/80">
          Future Pro features coming soon • Feedback welcome
        </p>
      </div>
    </div>
  );
}
