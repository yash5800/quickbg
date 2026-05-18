import { AppLayout } from "@/components/app-layout";
import { Card } from "@/components/ui/card";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Copyright - QuickBG",
  description: "Copyright and legal information for QuickBG",
};

export default function LegalPage() {
  const currentYear = new Date().getFullYear();

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-semibold tracking-normal text-white">Copyright & Legal</h1>

        <Card className="premium-surface p-6 space-y-6 text-sm text-white/60">
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Ownership</h2>
            <p>
              QuickBG, including the website, logo, branding, and underlying AI technology,
              is the intellectual property of QuickBG.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Your Content</h2>
            <p>
              You retain full ownership of images you upload. We do not claim any rights
              to your original or processed images.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Processed Images</h2>
            <p>
              Once processed, you are free to use the output images for any purpose,
              including commercial use, without attribution.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Trademark</h2>
            <p>
              &ldquo;QuickBG&rdquo; and the QuickBG logo are trademarks. You may not use our
              branding without explicit permission.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">AI Model</h2>
            <p>
              The AI model used for background removal is based on BiRefNet technology.
              Model weights are downloaded from Hugging Face and remain their property.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">DMCA</h2>
            <p>
              We respect intellectual property rights. If you believe your copyrighted
              work has been infringed, please contact us through the feedback form.
            </p>
          </div>

          <div className="pt-4 border-t border-white/10">
            <p className="text-center text-sm">
              © {currentYear} QuickBG. All rights reserved.
            </p>
            <p className="text-center text-xs mt-2">
              QuickBG is an independent project not affiliated with BiRefNet or Hugging Face.
            </p>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}