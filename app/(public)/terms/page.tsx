export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-gray-600">Please read these terms carefully. Offervia is currently in free beta.</p>
      </header>

      <section className="space-y-6 text-sm text-gray-700">
        <div>
          <h2 className="text-base font-medium text-gray-900">Agreement</h2>
          <p className="mt-2">By accessing or using Offervia, you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the service.</p>
        </div>

        <div>
          <h2 className="text-base font-medium text-gray-900">Use of Service</h2>
          <p className="mt-2">You agree to use the service lawfully and responsibly. Don’t upload content you do not have the right to share. Don’t misuse or attempt to disrupt the platform.</p>
        </div>

        <div>
          <h2 className="text-base font-medium text-gray-900">Beta Limitations</h2>
          <p className="mt-2">The service is in beta and provided “as is.” Features may change, and there may be occasional downtime or issues. We’ll do our best to improve reliability and user experience.</p>
        </div>

        <div>
          <h2 className="text-base font-medium text-gray-900">Intellectual Property</h2>
          <p className="mt-2">Offervia and its content are owned by us or our licensors. You retain rights to your own materials (e.g., resumes and job descriptions) that you upload.</p>
        </div>

        <div>
          <h2 className="text-base font-medium text-gray-900">Limitation of Liability</h2>
          <p className="mt-2">To the fullest extent permitted by law, Offervia is not liable for indirect or consequential damages arising from use of the service. We do not guarantee job offers or outcomes.</p>
        </div>

        <div>
          <h2 className="text-base font-medium text-gray-900">Termination</h2>
          <p className="mt-2">We may suspend or terminate access if we reasonably believe there’s a violation of these terms or a risk to the service or other users. You may also stop using the service at any time.</p>
        </div>

        <div>
          <h2 className="text-base font-medium text-gray-900">Contact</h2>
          <p className="mt-2">Questions about these terms? Visit our <a href="/contact" className="underline hover:text-gray-900">Contact</a> page to reach us.</p>
        </div>
      </section>
    </main>
  );
}
