import { AppLayout } from "@/components/app-layout";
import { Card } from "@/components/ui/card";
import { LocaleLink } from "@/components/locale-link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getLocaleMetadata } from "@/lib/i18n/metadata";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import {
  Lightbulb,
  ArrowUpRight,
  Server,
  BrainCircuit,
  HeartHandshake,
  Cpu,
  Database,
  Shirt,
  GraduationCap,
  Stethoscope,
  Building2,
  ShoppingCart,
  Palette,
  Smartphone,
  Camera,
} from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const locale = (headersList.get("x-locale") || defaultLocale) as Locale;
  return getLocaleMetadata(locale, "about", "/about");
}

const faqItems = [
  {
    question: "What kind of images work best with QuickBG?",
    answer:
      "QuickBG performs best on images where the subject has clear contrast against the background — portraits, product shots on white or solid backdrops, pets, and flat-lay compositions. It also handles challenging cases like hair, fur, glass, and semi-transparent objects thanks to the BiRefNet model's boundary refinement. For best results, ensure your subject is well-lit and occupies a meaningful portion of the frame.",
  },
  {
    question: "Why does QuickBG use BiRefNet instead of other models?",
    answer:
      "BiRefNet (Bilateral Reference Network) was chosen because it consistently outperforms U²-Net, MODNet, and other common architectures on the standard benchmarks we evaluated. Its two-pathway design — one for global context and one for local detail — produces cleaner edges, especially around hair and complex geometry. The model is also open-source and permissively licensed, which aligns with QuickBG's philosophy of building on transparent, accessible technology.",
  },
  {
    question: "What happens to my images after processing?",
    answer:
      "Your images are processed in memory and stored temporarily in the job queue in MongoDB. Once the result is delivered to your browser, the image data is automatically purged from the queue. We never store, train on, or share your uploads. The temporary worker storage is encrypted and wiped on a rolling basis. For complete peace of mind, you can also use the TensorFlow.js client-side fallback, which keeps every pixel on your device.",
  },
  {
    question: "Who built QuickBG?",
    answer:
      "QuickBG was built by a single developer (Yash) who was frustrated with expensive background removal tools and wanted to create a truly free alternative. The project started as a weekend experiment and grew into a full suite of image editing tools.",
  },
  {
    question: "What's the roadmap for QuickBG?",
    answer:
      "Upcoming features include: batch processing for power users, API access for developers, more AI models for specialized use cases, and expanded format support. The core tools will always remain free.",
  },
];

const useCases = [
  { icon: ShoppingCart, label: "E-commerce", desc: "Amazon, Etsy, Shopify product photos" },
  { icon: Smartphone, label: "Social Media", desc: "Instagram, TikTok, YouTube thumbnails" },
  { icon: Camera, label: "Photography", desc: "Portrait editing, event photography" },
  { icon: Palette, label: "Design", desc: "Mockups, presentations, marketing materials" },
  { icon: Shirt, label: "Fashion", desc: "Apparel catalogs, lookbooks" },
  { icon: GraduationCap, label: "Education", desc: "Presentations, course materials" },
  { icon: Stethoscope, label: "Healthcare", desc: "Medical imaging, documentation" },
  { icon: Building2, label: "Real Estate", desc: "Property listings, virtual staging" },
];

export default function AboutPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Lightbulb className="h-4 w-4" />
            Our Story
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            About QuickBG
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            QuickBG was born from a simple frustration: why should removing a background cost money or require a signup? We built a free, unlimited AI-powered tool that anyone can use — no strings attached.
          </p>
        </div>

        {/* Technology */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Technology</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <BrainCircuit className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">BiRefNet AI Model</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We use BiRefNet, a state-of-the-art bilateral reference network for high-resolution image matting. It delivers superior edge quality compared to older models.
              </p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <Server className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Serverless Architecture</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Built on Vercel&apos;s serverless platform with HuggingFace inference. Scales automatically, zero maintenance overhead, and keeps costs at zero.
              </p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <Cpu className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Client-Side Fallback</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                TensorFlow.js runs directly in your browser when the queue is busy. Your images never leave your device in this mode.
              </p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <Database className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">MongoDB Job Queue</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Jobs are queued in MongoDB with automatic cleanup. Images are purged immediately after processing — we never store your data.
              </p>
            </Card>
          </div>
        </section>

        {/* Use Cases */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Who Uses QuickBG?</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {useCases.map((uc) => (
              <div key={uc.label} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/30 p-3">
                <uc.icon className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <div className="text-sm font-medium">{uc.label}</div>
                  <div className="text-xs text-muted-foreground">{uc.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">FAQ</h2>
          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <Card key={i} className="p-5">
                <h3 className="font-semibold mb-2">{item.question}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Roadmap */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Roadmap</h2>
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-green-500 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Core background removal</p>
                  <p className="text-xs text-muted-foreground">Shipped — BiRefNet model, unlimited usage</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-green-500 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Image editing suite</p>
                  <p className="text-xs text-muted-foreground">Shipped — Resize, crop, blur, replace, adjust, sharpen, convert</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                <div>
                  <p className="font-medium text-sm">Multi-language support</p>
                  <p className="text-xs text-muted-foreground">In progress — English, Hindi, German</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0" />
                <div>
                  <p className="font-medium text-sm">API access</p>
                  <p className="text-xs text-muted-foreground">Planned — REST API for developers</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Batch processing</p>
                  <p className="text-xs text-muted-foreground">Planned — Process entire folders at once</p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Contact CTA */}
        <section>
          <Card className="p-6 text-center bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <HeartHandshake className="h-8 w-8 text-primary mx-auto mb-3" />
            <h2 className="text-xl font-bold mb-2">Get in Touch</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Have questions, feedback, or partnership ideas? We&apos;d love to hear from you.
            </p>
            <LocaleLink
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Contact Us
              <ArrowUpRight className="h-4 w-4" />
            </LocaleLink>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}
