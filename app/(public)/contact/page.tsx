"use client";

import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // No backend yet: placeholder behavior
    console.log({ name, email, message });
    alert("Thanks for reaching out! Coming soon.");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Contact Offervia</h1>
        <p className="mt-2 text-sm text-gray-600">Have feedback or questions? We’d love to hear from you.</p>
      </header>

      <form onSubmit={onSubmit} className="mx-auto grid gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:max-w-xl">
        <div className="grid gap-1">
          <label className="text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="Your name"
            required
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-medium text-gray-700">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px] w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="How can we help?"
            required
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
            Submit
          </button>
        </div>
      </form>
    </main>
  );
}
