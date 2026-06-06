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
              QuickBG is designed with privacy as a core principle. When you upload an image
              for background removal, the file is transmitted to our servers solely for the
              purpose of processing. We do not collect, store, or share any personal information
              derived from your images beyond what is strictly necessary to provide the service.
              The only data we retain temporarily is the image file itself during processing and,
              in limited cases, a anonymized reference for queue management and rate limiting.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Image Handling</h2>
            <p>
              Uploaded images are stored only as long as needed to complete the background removal
              process. Once processing is finished and the result has been delivered to you,
              both the original and the processed image are scheduled for permanent deletion.
              We implement a time-to-live (TTL) policy of 24 hours at most, after which all
              image data is irrecoverably removed from our storage systems. Images are never
              used for AI training, model improvement, data mining, or any purpose other than
              fulfilling your specific background removal request.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Data Retention</h2>
            <p>
              Image files are automatically deleted within 24 hours of upload via an enforced
              TTL index on our database. No backup copies are retained beyond this window.
              Basic metadata such as processing timestamps and image dimensions may be kept
              in aggregate form for operational analytics but cannot be traced back to any
              individual user. We do not maintain user accounts, so there are no persistent
              personal profiles or histories associated with your usage.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Analytics</h2>
            <p>
              QuickBG uses Vercel Analytics to collect anonymized, aggregated usage data
              including page views, processing job counts, and average processing times.
              This data is used exclusively to monitor service performance, identify trends,
              and guide improvements. Vercel Analytics does not use cookies and does not
              collect personally identifiable information. No IP addresses, user agents, or
              other identifying signals are stored. All analytics data is fully anonymized
              and cannot be linked back to any specific individual or device.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Cookies</h2>
            <p>
              QuickBG uses only strictly essential cookies that are necessary for the service
              to function. These include session tokens for rate limiting, queue position
              tracking, and a small cookie to remember that you have dismissed the privacy
              notice to avoid showing it repeatedly. We do not use tracking cookies,
              advertising cookies, analytics cookies, or any form of persistent cross-site
              tracking. All cookies set by QuickBG are first-party, session-only where
              possible, and contain no personally identifiable information.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Third Parties</h2>
            <p>
              QuickBG integrates with several third-party services to deliver its functionality:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>
                <strong className="text-white">Vercel</strong> &mdash; Our hosting platform.
                Vercel may process IP addresses and standard HTTP request headers as part of
                normal CDN operations. See Vercel&rsquo;s privacy policy for details.
              </li>
              <li>
                <strong className="text-white">MongoDB Atlas</strong> &mdash; Our database provider.
                Image data and processing metadata are stored temporarily in MongoDB Atlas with
                a 24-hour TTL. Data is encrypted at rest and in transit.
              </li>
              <li>
                <strong className="text-white">Google AdSense</strong> &mdash; Advertisements on
                public pages. AdSense may use cookies and web beacons to serve targeted ads
                based on your browsing activity. This is governed by Google&rsquo;s privacy
                policy and not by QuickBG. You can opt out of personalized advertising at
                <a
                  href="https://adssettings.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline ml-1"
                >
                  google.com/adssettings
                </a>.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Advertising</h2>
            <p>
              QuickBG displays advertisements via Google AdSense on certain public-facing pages.
              Google, as a third-party vendor, uses cookies to serve ads based on a user&rsquo;s
              prior visits to this website or other websites. Google&rsquo;s use of advertising
              cookies enables it and its partners to serve ads based on your visit to this site
              and/or other sites on the internet. You may opt out of personalized advertising by
              visiting Google&rsquo;s Ads Settings page. Alternatively, you can opt out of
              third-party vendor cookies by visiting the Network Advertising Initiative opt-out
              page. QuickBG does not control which ads are shown or how Google targets them.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Your Rights</h2>
            <p>
              If you are located in the European Economic Area (EEA) or the United Kingdom,
              you have certain rights under the General Data Protection Regulation (GDPR)
              including the right to access, rectify, or erase your personal data. Because
              QuickBG does not maintain user accounts and automatically deletes images within
              24 hours, there is typically no personal data held that can be subject to these
              requests. If you believe we hold data related to you, please contact us and we
              will address your request promptly. You also have the right to lodge a complaint
              with your local data protection authority.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Children&rsquo;s Privacy</h2>
            <p>
              QuickBG is not directed at children under the age of 13 (or the equivalent age
              of majority in your jurisdiction). We do not knowingly collect personal
              information from children. If you believe that a child has provided us with
              personal data, please contact us immediately and we will take steps to delete
              such information as quickly as possible. Our service is intended for general
              audiences and is not designed to attract children.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">International Users</h2>
            <p>
              QuickBG processes data on servers located in the United States and potentially
              other jurisdictions where our infrastructure providers operate. By using the
              service, you acknowledge that your data may be transferred to and processed in
              countries that may not have the same data protection laws as your country of
              residence. We take appropriate safeguards, including data encryption and strict
              access controls, to protect your information regardless of where it is processed.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Contact</h2>
            <p>
              If you have any questions, concerns, or requests regarding this privacy policy
              or how your data is handled, please reach out to us through the feedback form
              available on the website. We make every effort to respond to privacy inquiries
              within a reasonable timeframe. You may also contact us for any of the following:
              requesting information about data we may hold, reporting a suspected data breach,
              or exercising any of your data protection rights.
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
