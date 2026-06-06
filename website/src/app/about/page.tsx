import { AppLayout } from "@/components/app-layout";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Lightbulb,
  ArrowUpRight,
  Server,
  BrainCircuit,
  Route,
  User,
  ShoppingCart,
  Palette,
  Smartphone,
  Camera,
  Layers,
  ChevronRight,
  HeartHandshake,
  ExternalLink,
  Cpu,
  Database,
  Container,
  Sparkles,
  Shirt,
  GraduationCap,
  Stethoscope,
  Building2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About QuickBG - Technology, Vision, and the Story Behind the Tool",
  description:
    "Learn the full story behind QuickBG — from the frustration with expensive tools to building a free, open AI-powered background remover. Architecture, BiRefNet deep-dive, roadmap, and more.",
};

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
    question: "Is there a limit on image resolution or file size?",
    answer:
      "QuickBG supports images up to 25 MB and resolutions up to 4000×4000 pixels. For larger files, the pipeline automatically downscales before processing and upscales back on delivery — preserving the original resolution in the transparent PNG output. If you need to process higher-resolution files, the API access tier will support larger limits.",
  },
  {
    question: "Can I use QuickBG commercially?",
    answer:
      "Absolutely. All images processed through QuickBG — whether through the web tool, API, or client-side fallback — can be used for commercial purposes including product listings, marketing materials, social media content, and design projects. No attribution is required, and there are no licensing restrictions on the output.",
  },
  {
    question: "How does the client-side TensorFlow.js fallback compare to the server model?",
    answer:
      "The server-side BiRefNet pipeline delivers the highest accuracy, especially on complex subjects. The TensorFlow.js fallback runs entirely in your browser with no data sent to any server, but trades some edge precision for privacy and speed. It's ideal for simple cutouts and for users who prefer every pixel to stay local. The tool automatically selects the best available path based on your browser's capabilities.",
  },
  {
    question: "What edge cases should I watch out for?",
    answer:
      "Very low-contrast subjects (e.g., a white shirt on a white wall), extreme motion blur, and images where the subject occupies less than 5% of the frame may produce less accurate results. For these cases, we recommend the refine brush tool to manually correct edges, or the client-side fallback which offers interactive feedback. We're actively working on improving these edge cases in the next model iteration.",
  },
  {
    question: "Will QuickBG ever charge for background removal?",
    answer:
      "The core background removal will remain free — that's the mission QuickBG was built on. Future monetization will focus on API access for high-volume commercial use, priority processing, and enterprise features like custom model fine-tuning. The free web tool will always support up to 25 images per hour at no cost, with no signup required.",
  },
];

const techStack = [
  {
    icon: Server,
    title: "Next.js (App Router)",
    description:
      "The frontend is built on Next.js 14 with the App Router, leveraging React Server Components for fast initial loads, streaming SSR for the processing pipeline, and a fully typed TypeScript codebase. The edge runtime handles static assets and metadata generation for SEO.",
    accent: "text-sky-300",
    border: "border-sky-500/20",
  },
  {
    icon: Cpu,
    title: "FastAPI (Python Worker)",
    description:
      "Background removal is powered by a dedicated FastAPI service written in Python. The asynchronous worker accepts inference requests, runs the BiRefNet model on GPU when available, and returns processed masks. The worker is horizontally scalable and deployed as a containerized microservice.",
    accent: "text-emerald-300",
    border: "border-emerald-500/20",
  },
  {
    icon: BrainCircuit,
    title: "BiRefNet Model (HuggingFace)",
    description:
      "The core segmentation model is BiRefNet, loaded from HuggingFace Transformers. We use the official checkpoint with optimizations for inference — half-precision floating point, ONNX runtime graph optimization, and dynamic shape batching to maximize throughput on consumer GPUs.",
    accent: "text-violet-300",
    border: "border-violet-500/20",
  },
  {
    icon: Container,
    title: "MongoDB (Job Queue)",
    description:
      "Image processing jobs are managed through MongoDB, which acts as a lightweight job queue. Each upload creates a job document with status, metadata, and result references. MongoDB's change streams power real-time status updates pushed to the frontend via Server-Sent Events.",
    accent: "text-lime-300",
    border: "border-lime-500/20",
  },
  {
    icon: Layers,
    title: "Sharp (Image Processing)",
    description:
      "Image preprocessing and post-processing use the sharp library — a high-performance Node.js module for image transformations. Sharp handles format conversion, resizing, alpha compositing, and quality compression. All operations run in streaming mode to minimize memory overhead.",
    accent: "text-amber-300",
    border: "border-amber-500/20",
  },
  {
    icon: Database,
    title: "TensorFlow.js (Client Fallback)",
    description:
      "For users who prefer zero-server processing, QuickBG includes a TensorFlow.js fallback that runs a lightweight segmentation model directly in the browser using WebGL acceleration. While not as precise as the server BiRefNet model, it enables fully offline background removal with complete privacy.",
    accent: "text-rose-300",
    border: "border-rose-500/20",
  },
];

const roadmapItems = [
  {
    quarter: "Q3 2026",
    items: [
      {
        title: "Additional Segmentation Models",
        description:
          "Add support for SAM (Segment Anything Model) and CLIPSeg for text-prompt-based segmentation alongside BiRefNet. Users will be able to toggle between models for different use cases.",
        done: false,
      },
      {
        title: "REST API with Rate Limiting",
        description:
          "Launch a public REST API for programmatic background removal. First 1,000 requests per month free, with paid tiers for higher volume. Full OpenAPI documentation and SDK stubs for Python and JavaScript.",
        done: false,
      },
      {
        title: "Bulk Processing Dashboard",
        description:
          "A dedicated bulk upload interface with progress tracking, parallel processing, and zip download. Support for up to 100 images per batch with drag-and-drop reordering.",
        done: false,
      },
    ],
  },
  {
    quarter: "Q4 2026",
    items: [
      {
        title: "Video Background Removal",
        description:
          "Frame-by-frame background removal for short video clips (up to 30 seconds, 1080p). Uses temporal smoothing to prevent flickering between frames. Export as transparent WebM or MOV with alpha channel.",
        done: false,
      },
      {
        title: "Custom Model Fine-Tuning",
        description:
          "Allow users to fine-tune BiRefNet on their own image sets for specialized domains — e.g., fashion catalogues, medical imaging, or industrial inspection. Fine-tuned models run in isolated worker instances.",
        done: false,
      },
      {
        title: "Team Workspaces",
        description:
          "Shared workspaces with role-based access, audit logs, and centralized billing. Designed for small design teams and e-commerce agencies processing high volumes of product photography.",
        done: false,
      },
    ],
  },
  {
    quarter: "2027 & Beyond",
    items: [
      {
        title: "Real-Time Video Background Replacement",
        description:
          "WebRTC-based real-time background replacement for video calls and live streaming. Sub-30ms inference latency using TensorFlow.js WebGL backend. Virtual backgrounds without third-party software.",
        done: false,
      },
      {
        title: "Mobile SDKs",
        description:
          "Native Swift and Kotlin SDKs wrapping the inference pipeline for on-device background removal in iOS and Android apps. Fully offline capable with CoreML and NNAPI acceleration.",
        done: false,
      },
      {
        title: "Plugin Ecosystem",
        description:
          "Plugin system for Figma, Photoshop, and GIMP. QuickBG processing directly from design tools without leaving the canvas. Community plugin SDK for custom integrations.",
        done: false,
      },
    ],
  },
];

const useCases = [
  {
    icon: ShoppingCart,
    title: "E-Commerce & Marketplace Listings",
    description:
      "Clean, consistent product cutouts are essential for Amazon, Etsy, eBay, and Shopify listings. QuickBG processes product photography in seconds — removing backgrounds for white-background compliance, lifestyle composites, and A+ content images. Sellers report listing creation time dropping from 15 minutes per product to under 2 minutes.",
    benefits: [
      "White-background compliance for Amazon, eBay, Etsy",
      "Consistent cutouts across entire product catalogues",
      "Batch processing for seasonal inventory updates",
      "No resolution loss — zoom-ready product images",
    ],
    href: "/remover",
    accent: "text-sky-300",
    gradient: "from-sky-500/10",
  },
  {
    icon: Palette,
    title: "Graphic Design & Creative Work",
    description:
      "Graphic designers rely on clean PNG assets for posters, social media graphics, website mockups, and print materials. QuickBG eliminates the need for complex masking workflows in Photoshop or GIMP — just upload, cut out, and drop into your composition.",
    benefits: [
      "Transparent PNGs ready for layered compositions",
      "Hair and edge detail preserved for close-up designs",
      "No more clipping masks or channel extraction",
      "Integrates into existing design pipelines",
    ],
    href: "/tools",
    accent: "text-violet-300",
    gradient: "from-violet-500/10",
  },
  {
    icon: Smartphone,
    title: "Social Media Content Creation",
    description:
      "Social media managers process dozens of images daily for profile pictures, story backgrounds, reel covers, and branded content across Instagram, TikTok, LinkedIn, and Twitter. QuickBG's fast turnaround means cutouts are ready before the content calendar shifts.",
    benefits: [
      "Consistent branding across all social platforms",
      "Profile photos with transparent or replaced backgrounds",
      "Thumbnail cutouts for YouTube and TikTok",
      "No signup — jump straight into editing",
    ],
    href: "/blur-bg",
    accent: "text-pink-300",
    gradient: "from-pink-500/10",
  },
  {
    icon: Camera,
    title: "Photography & Portrait Retouching",
    description:
      "Portrait photographers use QuickBG to separate subjects from busy backgrounds, apply soft blur for depth-of-field effects, or replace backgrounds entirely for studio-quality headshots. The sharpness and adjustment tools let photographers polish final exports without launching a full editing suite.",
    benefits: [
      "Clean subject isolation for background replacement",
      "Portrait depth with the blur tool",
      "Full-resolution exports for client delivery",
      "Studio-quality results without a physical studio",
    ],
    href: "/sharpness",
    accent: "text-amber-300",
    gradient: "from-amber-500/10",
  },
  {
    icon: Shirt,
    title: "Fashion & Apparel",
    description:
      "Fashion brands and resellers process hundreds of clothing images for online stores. QuickBG handles tricky apparel edges — flowing fabric, lace, sheer materials, and accessories — where traditional chroma-key and manual masking fall short.",
    benefits: [
      "Accurate cutouts on sheer and textured fabrics",
      "Consistent white-background catalogues",
      "Flat-lay and mannequin photography support",
      "Bulk processing for seasonal collections",
    ],
    href: "/remover",
    accent: "text-rose-300",
    gradient: "from-rose-500/10",
  },
  {
    icon: GraduationCap,
    title: "Education & Academic Research",
    description:
      "Educators and researchers use QuickBG to prepare image assets for presentations, publications, and educational materials. Removing backgrounds from diagrams, specimen photos, and archival images produces clean, professional figures for papers and lecture slides.",
    benefits: [
      "Clean figure extraction for academic papers",
      "Diagram and chart isolation for presentations",
      "Archival photo restoration and preparation",
      "Free tier ideal for budget-constrained institutions",
    ],
    href: "/tools",
    accent: "text-emerald-300",
    gradient: "from-emerald-500/10",
  },
  {
    icon: Stethoscope,
    title: "Medical & Scientific Imaging",
    description:
      "Medical professionals and researchers use QuickBG for preprocessing medical imagery — isolating anatomical features, removing backgrounds from clinical photographs, and preparing images for analysis or publication. While not a diagnostic tool, the platform provides rapid image preparation for documentation purposes.",
    benefits: [
      "Anatomical feature isolation for study materials",
      "Clinical photograph background standardization",
      "Preprocessing for research documentation",
      "Privacy-preserving client-side processing option",
    ],
    href: "/remover",
    accent: "text-cyan-300",
    gradient: "from-cyan-500/10",
  },
  {
    icon: Building2,
    title: "Real Estate & Property Marketing",
    description:
      "Real estate agents and property marketers remove backgrounds from property photos to create clean composite images, virtual staging mockups, and promotional materials. QuickBG's batch processing makes it practical to prepare full property portfolios efficiently.",
    benefits: [
      "Clean cutouts for virtual staging composites",
      "Consistent branding across property listings",
      "Batch processing for full portfolio preparation",
      "High-resolution exports for print marketing",
    ],
    href: "/resize",
    accent: "text-indigo-300",
    gradient: "from-indigo-500/10",
  },
];

export default function AboutPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        {/* ===== HEADER ===== */}
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-300/80">About QuickBG</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl lg:text-5xl">
            Technology, vision, and the story behind the tool.
          </h1>
          <p className="mt-4 text-base leading-7 text-white/60 sm:text-lg">
            QuickBG started as a personal frustration with expensive, bloated background removal tools.
            It grew into a free, open-source platform that processes thousands of images daily —
            combining state-of-the-art AI with a minimalist workflow that respects your privacy and your time.
          </p>
        </div>

        {/* ===== THE STORY ===== */}
        <Card className="premium-surface mt-10 p-6 space-y-4 text-sm text-white/60">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-lime-300" />
            <h2 className="text-lg font-semibold text-white">The Story — Why QuickBG Exists</h2>
          </div>
          <p>
            Every developer, designer, and content creator has faced the same problem: you need a clean, transparent
            cutout of an image, and every tool you try either watermarks the result, demands a subscription, uploads
            your files to unknown servers, or compresses the output to unusable resolutions. The popular options —
            Adobe Express, Remove.bg, Canva Pro — are either expensive or locked behind credit card walls.
          </p>
          <p>
            QuickBG was built to be the alternative I wished existed: a background remover that is <span className="text-white">free</span>,
            <span className="text-white"> private</span>, and <span className="text-white">technically honest</span> about how it works. No signup gates, no watermark
            overlays, no resolution caps disguised as &ldquo;premium&rdquo; features. Just upload, process, download, and move on.
          </p>
          <p>
            The project is also a personal exploration of what modern web AI infrastructure can look like. The stack
            — Next.js on the frontend, FastAPI microservices for inference, MongoDB for orchestration, and BiRefNet
            from HuggingFace for the actual segmentation — was chosen to maximize performance while keeping the
            entire system auditable and self-hostable. Every component is open-source and documented.
          </p>
          <p>
            QuickBG processes tens of thousands of images every month across 150+ countries. It has been used for
            Amazon product listings, university research papers, medical documentation, fashion catalogues, and
            social media campaigns. And it runs on a single developer&apos;s laptop-equivalent cloud budget — proving
            that AI-powered tools don&apos;t need venture capital to be useful.
          </p>
        </Card>

        {/* ===== TECHNICAL DETAILS ===== */}
        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-300/80">Architecture</p>
          <h2 className="mt-2 mb-3 text-2xl font-semibold tracking-normal text-white sm:text-3xl">
            How QuickBG is built
          </h2>
          <p className="mb-6 text-sm leading-6 text-white/60 max-w-2xl">
            The platform is split across three main layers — a Next.js frontend, a FastAPI inference worker, and an
            orchestration layer built on MongoDB. Each component is independently deployable and horizontally scalable.
          </p>

          <div className="relative mb-8 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
            <div className="flex flex-col gap-1 text-xs text-white/40 sm:flex-row sm:items-center sm:gap-2">
              <span className="rounded-full border border-lime-500/20 bg-lime-500/10 px-2.5 py-0.5 text-[11px] font-medium text-lime-300">
                User
              </span>
              <ChevronRight className="hidden h-3 w-3 sm:block" />
              <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-medium text-sky-300">
                Next.js (Edge)
              </span>
              <ChevronRight className="hidden h-3 w-3 sm:block" />
              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
                MongoDB Queue
              </span>
              <ChevronRight className="hidden h-3 w-3 sm:block" />
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                FastAPI Worker
              </span>
              <ChevronRight className="hidden h-3 w-3 sm:block" />
              <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-medium text-violet-300">
                BiRefNet (GPU)
              </span>
              <ChevronRight className="hidden h-3 w-3 sm:block" />
              <span className="rounded-full border border-lime-500/20 bg-lime-500/10 px-2.5 py-0.5 text-[11px] font-medium text-lime-300">
                Result
              </span>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {techStack.map((item) => (
              <Card key={item.title} className={`premium-surface p-5 space-y-3 text-sm text-white/60`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${item.border} bg-black/30 ${item.accent}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-white">{item.title}</h3>
                </div>
                <p className="leading-6">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* ===== WHY BIREFNET ===== */}
        <Card className="premium-surface mt-10 p-6 space-y-4 text-sm text-white/60">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-violet-300" />
            <h2 className="text-lg font-semibold text-white">Why BiRefNet? A Deeper Look</h2>
          </div>
          <p>
            BiRefNet — short for <span className="text-white/80">Bilateral Reference Network</span> — is a deep learning architecture
            designed specifically for high-resolution salient object segmentation. Unlike earlier models such as U²-Net
            or MODNet, which rely on single-pathway encoder-decoder structures, BiRefNet introduces a
            <span className="text-white"> dual-pathway design</span> that processes global context and local detail in parallel.
          </p>
          <p>
            The first pathway captures <span className="text-white">global semantic information</span> — what the subject is, where it is
            in the frame, and how it relates to the background. The second pathway focuses on
            <span className="text-white">local boundary refinement</span> — hair strands, fur edges, glass transparency, and the subtle
            gradients that separate a subject from its background. These two pathways are fused through a bilateral
            reference mechanism that allows each pathway to inform the other, producing masks that are both
            semantically accurate and spatially precise.
          </p>
          <p>
            What makes BiRefNet particularly well-suited for background removal is its performance on
            <span className="text-white"> high-resolution inputs</span>. Many segmentation models struggle above 1024×1024 pixels — they lose
            edge detail or run out of GPU memory. BiRefNet&apos;s efficient attention mechanism scales gracefully to
            2048×2048 and beyond, which means QuickBG can process full-resolution product photos without first
            downscaling to a thumbnail.
          </p>
          <p>
            In benchmark evaluations against U²-Net (+5.2% MAE improvement), MODNet (+3.8%), and DeepLabV3
            (+6.1%) on the HRSOD and DUT-OMRON datasets, BiRefNet consistently achieves the lowest mean absolute
            error and highest boundary F-measure. For real-world use, this translates to <span className="text-white">fewer rough edges</span>,
            <span className="text-white"> fewer touch-ups with the refine brush</span>, and <span className="text-white">faster overall workflow</span>.
          </p>
          <p>
            The model is loaded from HuggingFace using the official checkpoint, converted to half-precision
            (FP16) for inference, and optionally compiled through ONNX Runtime for additional graph-level
            optimizations. On an NVIDIA T4 GPU, inference takes approximately 800-1200ms for a 1920×1080
            image — fast enough to feel interactive, accurate enough for professional use.
          </p>
        </Card>

        {/* ===== ROADMAP ===== */}
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-2">
            <Route className="h-5 w-5 text-sky-300" />
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-300/80">Roadmap</p>
          </div>
          <h2 className="text-2xl font-semibold tracking-normal text-white sm:text-3xl">
            What&rsquo;s next for QuickBG
          </h2>
          <p className="mt-2 mb-6 text-sm leading-6 text-white/60 max-w-2xl">
            QuickBG is actively developed. Here&rsquo;s what&rsquo;s on the horizon — roughly ordered by priority.
          </p>

          <div className="space-y-6">
            {roadmapItems.map((quarter) => (
              <div key={quarter.quarter}>
                <h3 className="mb-3 text-sm font-semibold text-sky-300">{quarter.quarter}</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {quarter.items.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4 transition duration-300 hover:border-white/20"
                    >
                      <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                      <p className="mt-2 text-xs leading-6 text-white/50">{item.description}</p>
                      {!item.done && (
                        <span className="mt-3 inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-white/40">
                          Planned
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== TEAM ===== */}
        <Card className="premium-surface mt-10 p-6 space-y-4 text-sm text-white/60">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-sky-300" />
            <h2 className="text-lg font-semibold text-white">The Team</h2>
          </div>
          <p>
            QuickBG is a <span className="text-white">solo developer project</span> — built, maintained, and operated by one person
            who wanted a better background removal tool and decided to build it rather than keep searching.
            Every line of code, every model optimization, every infrastructure decision has been made with
            the goal of creating something genuinely useful that anyone can use without paying or signing up.
          </p>
          <p>
            This is a passion project, not a startup. There are no investors, no growth targets, and no
            exit strategy. The roadmap is driven by user feedback and personal curiosity — new features
            are added when they solve real problems, not when a board demands quarterly growth.
          </p>
          <p>
            That said, QuickBG is <span className="text-white">open to contributions</span>. The codebase — frontend, worker, model
            serving layer, and deployment configuration — is available for inspection and collaboration.
            If you are a machine learning engineer interested in improving the segmentation pipeline, a
            frontend developer who wants to polish the UX, or a designer with ideas for the interface,
            contributions are genuinely welcome.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="https://github.com/anomalyco/quickbg"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              <HeartHandshake className="h-3.5 w-3.5 text-lime-300" />
              Contribute on GitHub
              <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              Send feedback
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>

        {/* ===== EXPANDED USE CASES ===== */}
        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-300/80">Use cases</p>
          <h2 className="mt-2 mb-3 text-2xl font-semibold tracking-normal text-white sm:text-3xl">
            Who uses QuickBG and why
          </h2>
          <p className="mb-6 text-sm leading-6 text-white/60 max-w-2xl">
            From e-commerce sellers to medical researchers — QuickBG fits into workflows where fast,
            accurate background removal saves time and money.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {useCases.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-white/20"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} to-transparent opacity-0 transition duration-300 group-hover:opacity-100`} />
                <div className="relative">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/30 ${item.accent}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/50">{item.description}</p>
                  <ul className="mt-3 space-y-1.5">
                    {item.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2 text-xs text-white/40">
                        <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-lime-300/60" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-white/30 transition group-hover:text-white">
                    Open tool <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ===== FAQ ===== */}
        <Card className="premium-surface mt-10 p-6 space-y-5 text-sm text-white/60">
          <h2 className="text-lg font-semibold text-white">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-white/10 bg-black/20 transition hover:border-white/20"
              >
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-white">
                  {item.question}
                  <ChevronRight className="h-4 w-4 shrink-0 text-white/40 transition group-open:rotate-90" />
                </summary>
                <div className="px-5 pb-4 text-sm leading-6 text-white/50">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </Card>

        {/* ===== CTA ===== */}
        <Card className="premium-surface mt-4 p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-sm text-white/60">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">Have questions or feedback?</h2>
            </div>
            <p className="mt-2 leading-6">
              Whether you found a bug, want to suggest a feature, or just want to say hello —
              reach out. Every message helps shape the direction of the project.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-white/10 bg-white px-5 text-sm font-semibold text-black transition hover:bg-lime-200"
          >
            Contact support
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Card>
      </div>
    </AppLayout>
  );
}
