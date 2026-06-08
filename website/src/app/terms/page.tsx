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
  return getLocaleMetadata(locale, "terms", "/terms");
}

export default async function TermsPage() {
  const { t } = await getServerTranslations();

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <h1 className="mb-8 text-3xl font-semibold tracking-normal text-white">{t("terms.heading")}</h1>

        <Card className="premium-surface p-6 space-y-6 text-sm text-white/60">
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Acceptance</h2>
            <p>
              By accessing or using QuickBG (&ldquo;the Service&rdquo;), you agree to be bound
              by these Terms of Service. If you do not agree to all of these terms, you are not
              authorized to use the Service. These terms apply to all visitors, users, and any
              individual who accesses or interacts with QuickBG in any capacity. By using the
              Service, you represent that you are at least 13 years of age (or the age of
              digital consent in your jurisdiction) and have the legal capacity to enter into
              these terms.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Use License</h2>
            <p>
              QuickBG grants you a limited, non-exclusive, non-transferable, revocable license
              to use the Service for both personal and commercial purposes. You may use the
              processed output images for any lawful application, including commercial products,
              marketing materials, websites, and software, without attribution to QuickBG. This
              license does not permit you to copy, modify, distribute, reverse engineer, or
              create derivative works of the Service itself, the AI models, or any underlying
              technology. Unauthorized use of the Service may result in termination of your
              access and legal action where applicable.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">AI Limitations</h2>
            <p>
              QuickBG uses artificial intelligence to perform background removal, and while the
              model is designed to produce high-quality results, it is not perfect. Output
              quality depends on factors including image resolution, lighting, subject
              complexity, occlusion, and contrast between foreground and background. The AI
              may fail to correctly identify edges, may remove parts of the subject, or may
              leave portions of the background intact. You are solely responsible for reviewing
              all processed images before using them in any context. QuickBG makes no guarantee
              regarding the accuracy, completeness, or suitability of AI-generated output for
              any specific purpose.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Advertising</h2>
            <p>
              QuickBG may display advertisements served by Google AdSense on public-facing
              pages of the website. These advertisements are served by Google and may be
              targeted based on your browsing history, device information, and other signals
              collected by Google. QuickBG does not control which ads are shown, how they are
              targeted, or the content of any advertiser pages linked from these ads. Google&rsquo;s
              use of advertising cookies and data is governed by Google&rsquo;s own privacy policy
              and terms. You may opt out of personalized advertising at any time via
              Google&rsquo;s Ads Settings page.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Account Terms</h2>
            <p>
              QuickBG does not require user accounts to function. The Service operates on a
              queue-based model where each visit is treated as anonymous. No registration,
              login, or persistent identity is needed. As a result, there are no account
              credentials to maintain, no passwords to protect, and no personal profiles
              stored on our systems. Your usage is governed by rate limits applied at the
              network level, not by any user account association.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Service Availability</h2>
            <p>
              We strive to maintain high availability of QuickBG, but we do not guarantee
              uninterrupted or fault-free service. The Service may be temporarily unavailable
              due to scheduled maintenance, infrastructure upgrades, unexpected outages,
              network disruptions, or factors beyond our control. QuickBG is deployed on
              Vercel&rsquo;s serverless infrastructure, and availability is subject to the
              performance and reliability of that platform. We reserve the right to modify,
              suspend, or discontinue any aspect of the Service at any time without prior
              notice. We are not liable for any downtime or loss of access.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">User Conduct</h2>
            <p>
              You agree to use QuickBG responsibly and in compliance with all applicable laws.
              Prohibited conduct includes, but is not limited to:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Uploading, processing, or distributing content that is illegal, obscene,
                defamatory, threatening, or infringes upon the rights of others</li>
              <li>Attempting to reverse engineer, decompile, or extract the source code or AI
                model weights used by the Service</li>
              <li>Submitting automated or scripted requests that exceed reasonable usage
                limits or circumvent rate limiting mechanisms</li>
              <li>Using the Service for any form of data mining, scraping, or unauthorized
                data collection</li>
              <li>Interfering with the operation of the Service, including introducing malware,
                overloading infrastructure, or disrupting other users&rsquo; access</li>
              <li>Impersonating any person or entity or misrepresenting your affiliation with
                QuickBG</li>
              <li>Using the Service in any manner that violates applicable export control or
                sanctions laws</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Intellectual Property</h2>
            <p>
              The Service, including its design, code, logos, trademarks, AI models, and
              proprietary technology, is the intellectual property of QuickBG and its
              licensors. These Terms do not transfer any ownership rights to you. You may
              not copy, modify, distribute, sell, or lease any part of the Service without
              our express written permission. The AI model used for background removal is
              based on BiRefNet, which is made available by its creators under an open
              license, and attribution to the original authors is provided where required.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Prohibited Use</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Processing illegal or harmful content including child exploitation material,
                hate speech, or violent extremism</li>
              <li>Attempting to reverse engineer, decompile, or extract our AI models, code,
                or proprietary algorithms</li>
              <li>Abusing the service with automated, excessive, or malicious requests that
                degrade performance for other users</li>
              <li>Using the service for any unlawful purpose or in violation of applicable
                local, national, or international laws</li>
              <li>Circumventing any technical measures, rate limits, or access controls
                implemented by QuickBG</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Disclaimer</h2>
            <p>
              QuickBG is provided strictly on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo;
              basis. To the fullest extent permitted by law, we disclaim all warranties of any
              kind, whether express, implied, or statutory, including but not limited to implied
              warranties of merchantability, fitness for a particular purpose, title, and
              non-infringement. We do not warrant that the Service will meet your requirements,
              be uninterrupted, timely, secure, or error-free, that defects will be corrected,
              or that the Service is free of viruses or other harmful components. Any reliance
              on the Service is at your own risk. No advice or information obtained from
              QuickBG shall create any warranty not expressly stated in these terms.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, QuickBG, its operators,
              contributors, and affiliates shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, including but not limited to loss
              of profits, data, use, goodwill, or other intangible losses, arising out of or
              relating to your use of or inability to use the Service. This limitation applies
              regardless of the theory of liability, whether in contract, tort, negligence,
              strict liability, or otherwise, even if QuickBG has been advised of the
              possibility of such damages. In no event shall our total liability exceed the
              amount you have paid, if any, to use the Service.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to QuickBG at any time,
              without prior notice or liability, for any reason including violation of these
              terms, abusive behavior, or at our sole discretion. Upon termination, your right
              to use the Service ceases immediately. Any provisions of these terms that by
              their nature should survive termination, including intellectual property
              provisions, disclaimers, and limitations of liability, shall survive.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the
              State of California, without regard to its conflict of law provisions. Any
              disputes arising out of or relating to these terms or the Service shall be
              resolved exclusively in the state or federal courts located in California. You
              consent to the personal jurisdiction of such courts and waive any objection
              based on improper venue or forum non conveniens. If any provision of these terms
              is found to be unenforceable, the remaining provisions shall remain in full
              force and effect.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Changes to Terms</h2>
            <p>
              We reserve the right to modify or replace these Terms at any time at our sole
              discretion. If a revision is material, we will make reasonable efforts to provide
              notice via the website. By continuing to access or use the Service after any
              revisions become effective, you agree to be bound by the updated terms. We
              encourage you to review this page periodically for changes. The date of the
              most recent update is displayed at the bottom of this page.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Contact Information</h2>
            <p>
              If you have any questions about these Terms, wish to report a violation, or
              need to reach us for any legal or administrative matter, please contact us
              through the feedback form on the QuickBG website. We endeavor to respond to
              all inquiries within a reasonable timeframe but make no guarantee of response
              time for any particular communication.
            </p>
          </div>

          <p className="text-xs pt-4 border-t border-white/10">
            Last updated: June 2026
          </p>
        </Card>
      </div>
    </AppLayout>
  );
}
