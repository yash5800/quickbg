import { AppLayout } from "@/components/app-layout";
import { Card } from "@/components/ui/card";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - QuickBG",
  description: "Privacy policy for QuickBG - AI-powered background removal service",
};

export default function PrivacyPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-semibold tracking-normal text-white">Privacy Policy</h1>

        <Card className="premium-surface p-6 space-y-6 text-sm text-white/60">
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Data Collection</h2>
            <p>
              QuickBG processes images locally on our servers solely for the purpose of background removal.
              We do not collect, store, or share any personal information from your images beyond the processing duration.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Image Handling</h2>
            <p>
              Uploaded images are automatically deleted from our servers after processing is complete.
              We do not use your images for any AI training or model improvement purposes.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Analytics</h2>
            <p>
              We collect basic usage statistics (job counts, processing times) to improve our service.
              No personally identifiable information is stored in our analytics.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Cookies</h2>
            <p>
              QuickBG uses minimal cookies necessary for service functionality. We do not use
              tracking cookies or share data with third-party advertisers.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Third Parties</h2>
            <p>
              We do not sell, trade, or transfer your data to any third parties.
              All image processing is performed on our own infrastructure.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Contact</h2>
            <p>
              If you have any questions about this privacy policy, please contact us through our feedback form.
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