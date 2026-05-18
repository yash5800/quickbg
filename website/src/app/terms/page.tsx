import { AppLayout } from "@/components/app-layout";
import { Card } from "@/components/ui/card";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - QuickBG",
  description: "Terms of service for QuickBG - AI-powered background removal service",
};

export default function TermsPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-semibold tracking-normal text-white">Terms of Service</h1>

        <Card className="premium-surface p-6 space-y-6 text-sm text-white/60">
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Acceptance</h2>
            <p>
              By using QuickBG, you agree to these terms. If you do not agree, please do not use our service.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Use License</h2>
            <p>
              QuickBG is provided free for personal and commercial use. You may use the processed
              images for any lawful purpose without attribution.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">AI Limitations</h2>
            <p>
              Our AI may not accurately process all images. Results may vary based on image quality,
              complexity, and subject matter. Please review outputs before use.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Prohibited Use</h2>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Processing illegal or harmful content</li>
              <li>Attempting to reverse engineer or copy our AI models</li>
              <li>Abusing the service with excessive requests</li>
              <li>Using the service for any unlawful purpose</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Disclaimer</h2>
            <p>
              QuickBG is provided &ldquo;as is&rdquo; without warranties of any kind. We do not guarantee
              uninterrupted service or error-free processing.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Limitation of Liability</h2>
            <p>
              We shall not be liable for any damages arising from the use of our service.
              Your use of QuickBG is at your own risk.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the service
              constitutes acceptance of updated terms.
            </p>
          </div>

          <p className="text-xs pt-4 border-t border-white/10">
            Last updated: May 2026
          </p>
        </Card>
      </div>
    </AppLayout>
  );
}