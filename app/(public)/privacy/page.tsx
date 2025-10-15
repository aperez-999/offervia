export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
      </header>

      <section className="space-y-6 text-sm text-gray-700">
        <div>
          <h2 className="text-base font-medium text-gray-900">Introduction</h2>
          <p className="mt-2">Offervia is an AI career suite built for job seekers. We’re committed to handling your information with care and transparency during our free beta. This policy explains what we collect, how we use it, and your choices.</p>
        </div>

        <div>
          <h2 className="text-base font-medium text-gray-900">Data We Collect</h2>
          <p className="mt-2">We collect minimal data needed to provide the service. This may include account details (e.g., email), content you provide (e.g., resumes or job descriptions), and basic usage analytics to improve performance. We do not sell your data.</p>
        </div>

        <div>
          <h2 className="text-base font-medium text-gray-900">How Data Is Used</h2>
          <p className="mt-2">Your data is used to deliver features like resume tailoring, interview coaching, and job description scanning. We may aggregate anonymous metrics to understand which features are helpful and to guide product improvements.</p>
        </div>

        <div>
          <h2 className="text-base font-medium text-gray-900">AI & Security</h2>
          <p className="mt-2">Resumes and job descriptions are processed to generate tailored content and insights. We aim to minimize retention and do not use your uploads to train our own models. Reasonable safeguards are used to protect data in transit and at rest, but no system is perfectly secure.</p>
        </div>

        <div>
          <h2 className="text-base font-medium text-gray-900">User Rights</h2>
          <p className="mt-2">You can request access or deletion of your account data. During beta, some requests may take time to complete, but we’ll do our best to help. If you have questions about your information, please reach out.</p>
        </div>

        <div>
          <h2 className="text-base font-medium text-gray-900">Cookies</h2>
          <p className="mt-2">We may use cookies or similar technologies to keep you signed in, remember preferences, and measure basic usage. You can control cookies through your browser settings.</p>
        </div>

        <div>
          <h2 className="text-base font-medium text-gray-900">Contact</h2>
          <p className="mt-2">For privacy questions, contact us via the <a href="/contact" className="underline hover:text-gray-900">Contact</a> page. We’re here to help.</p>
        </div>
      </section>
    </main>
  );
}
