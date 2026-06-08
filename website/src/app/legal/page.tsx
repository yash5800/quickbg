import { AppLayout } from "@/components/app-layout";
import { Card } from "@/components/ui/card";
import { Metadata } from "next";
import { headers } from "next/headers";
import { getLocaleMetadata } from "@/lib/i18n/metadata";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const locale = (headersList.get("x-locale") || defaultLocale) as Locale;
  return getLocaleMetadata(locale, "legal", "/legal");
}

export default async function LegalPage() {
  const { t } = await getServerTranslations();
  const currentYear = new Date().getFullYear();

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-semibold tracking-normal text-white">{t("legal.heading")}</h1>

        <Card className="premium-surface p-6 space-y-6 text-sm text-white/60">
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Ownership</h2>
            <p>
              QuickBG, including the website, logo, branding, user interface design, underlying AI
              technology, and all associated software code, is the exclusive intellectual property
              of QuickBG. The name &ldquo;QuickBG&rdquo;, its visual identity, domain name, and any
              derivative works are protected under applicable copyright, trademark, and trade dress
              laws. Nothing in these terms grants you any right, title, or interest in the service
              or its components beyond the limited use rights expressly described herein.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Your Content</h2>
            <p>
              You retain full and unconditional ownership of all images you upload to QuickBG.
              We do not claim any rights, title, or interest in your original or processed images.
              Your content remains yours, and we act solely as a data processor to facilitate the
              background removal transformation you request. No license of any kind is granted
              from you to QuickBG with respect to your uploaded images beyond the temporary
              processing required to deliver the service.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Processed Images</h2>
            <p>
              Once background removal is complete, you are free to use the output images for any
              lawful purpose, including personal projects, commercial products, advertising,
              social media, or any other application you choose. Attribution to QuickBG is not
              required, though it is appreciated. QuickBG does not assert any ownership or
              licensing rights over the processed output. You assume full responsibility for
              ensuring your use of processed images complies with applicable laws and third-party
              rights.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Trademark</h2>
            <p>
              &ldquo;QuickBG&rdquo;, the QuickBG logo, and any associated branding elements are
              trademarks or registered trademarks of QuickBG. You may not use, reproduce,
              display, modify, or distribute our branding, name, or logo in connection with any
              product or service without our prior written permission. This includes use in
              advertising, press materials, websites, or any other medium. Any permitted use of
              our branding must not imply endorsement, sponsorship, or affiliation without an
              express written agreement.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">AI Model</h2>
            <p>
              The AI model powering background removal on QuickBG is based on BiRefNet
              (Bilateral Reference Network) technology. The model weights are sourced from
              Hugging Face and remain the intellectual property of their respective creators
              and contributors. QuickBG does not claim ownership of the underlying model
              architecture or pre-trained weights. BiRefNet is used under the terms of its
              applicable license, and we gratefully acknowledge the research community whose
              open work makes this service possible.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Third Party Services</h2>
            <p>
              QuickBG relies on several third-party services to operate. AI model inference
              uses models hosted on Hugging Face. Image and metadata storage is managed
              through MongoDB Atlas. The application is deployed on Vercel&rsquo;s cloud
              infrastructure. Each third-party service operates under its own terms of service
              and privacy policy. QuickBG is not responsible for the availability, security, or
              practices of these third parties. We encourage you to review their respective
              policies for more information on how they handle data.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">DMCA</h2>
            <p>
              QuickBG respects the intellectual property rights of others and complies with the
              Digital Millennium Copyright Act (DMCA). If you believe in good faith that any
              content available through QuickBG infringes your copyright, please notify us
              with the following information: (i) a physical or electronic signature of the
              copyright owner or authorized representative; (ii) identification of the
              copyrighted work claimed to be infringed; (iii) identification of the infringing
              material and information reasonably sufficient to locate it; (iv) your contact
              information including address, telephone number, and email; (v) a statement that
              you have a good faith belief that the use is not authorized by the copyright
              owner, its agent, or the law; and (vi) a statement made under penalty of perjury
              that the information in the notification is accurate and that you are the
              copyright owner or authorized to act on their behalf. Notices may be submitted
              through our feedback form or by contacting us directly. We will respond to all
              valid DMCA notices and may remove or disable access to allegedly infringing
              material as required by law.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Disclaimer</h2>
            <p>
              QuickBG is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo;
              basis without any warranties of any kind, express or implied. We do not guarantee
              that the service will be uninterrupted, timely, secure, or error-free. The
              background removal process relies on AI which may produce inaccurate or
              unsatisfactory results. You acknowledge that you use the service at your own
              discretion and risk. To the maximum extent permitted by law, QuickBG disclaims
              all warranties, including any implied warranties of merchantability, fitness for
              a particular purpose, and non-infringement.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Changes to This Policy</h2>
            <p>
              We reserve the right to update or modify this legal page at any time without
              prior notice. Changes will be effective immediately upon posting to this URL.
              Your continued use of QuickBG after any changes constitutes acceptance of the
              updated terms. We encourage you to review this page periodically for the latest
              information about our legal policies. Material changes will be noted by updating
              the effective date at the bottom of this page.
            </p>
          </div>

          <div className="pt-4 border-t border-white/10">
            <p className="text-center text-sm">
              &copy; {currentYear} QuickBG. All rights reserved.
            </p>
            <p className="text-center text-xs mt-2">
              QuickBG is an independent project not affiliated with BiRefNet, Hugging Face, or any referenced third party.
            </p>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
